import { AIProviderFactory } from './providers/aiProvider.factory';
import {
  ChatMessage,
  Conversation,
  ChatRequest,
  UserContext,
} from '../types/chat.types';

// ─── In-Memory Conversation Storage (Note: Not scalable for production) ──────
// In production, use Redis or database for conversation history

const conversations = new Map<string, Conversation>();

// ─── AI Provider ──────────────────────────────────────────────────────────────

const getAIProvider = () => {
  const provider = (process.env.AI_PROVIDER || 'gemini') as 'openai' | 'gemini';
  const apiKey = process.env.AI_API_KEY;

  if (!apiKey) {
    throw new Error('AI_API_KEY environment variable is required');
  }

  return AIProviderFactory.createProvider({
    provider,
    apiKey,
    model: provider === 'gemini' ? 'gemini-1.5-flash' : 'gpt-3.5-turbo',
  });
};

const aiProvider = getAIProvider();

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Fetches user context (weak topics and recent progress).
 */
const getUserContext = async (userId: string): Promise<UserContext> => {
  // Import here to avoid circular dependencies
  const { getWeakTopics } = await import('./weakTopic.service');
  const supabase = (await import('../config/supabase')).default;

  // Get weak topics
  const weakTopicsData = await getWeakTopics(userId);
  const weakTopics = weakTopicsData.map(wt => wt.topic);

  // Get recent progress (last 10 problems)
  const { data: recentProgress, error } = await supabase
    .from('user_progress')
    .select('problem_id, topic, status, time_taken, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(10);

  if (error) {
    console.error('Error fetching recent progress:', error);
  }

  return {
    weakTopics,
    recentProgress: recentProgress || [],
  };
};

/**
 * Gets or creates a conversation for the user.
 */
const getConversation = (userId: string): Conversation => {
  let conversation = conversations.get(userId);

  if (!conversation) {
    conversation = {
      userId,
      messages: [],
      lastActivity: new Date(),
    };
    conversations.set(userId, conversation);
  }

  return conversation;
};

/**
 * Adds a message to the conversation history.
 */
const addMessageToConversation = (userId: string, message: ChatMessage): void => {
  const conversation = getConversation(userId);
  conversation.messages.push(message);
  conversation.lastActivity = new Date();

  // Keep only last 20 messages to prevent memory issues
  if (conversation.messages.length > 20) {
    conversation.messages = conversation.messages.slice(-20);
  }

  conversations.set(userId, conversation);
};

/**
 * Builds the system prompt with user context.
 */
const buildSystemPrompt = (context: UserContext): string => {
  const { weakTopics, recentProgress } = context;

  return `You are an expert DSA (Data Structures and Algorithms) tutor and helpful assistant. Your role is to help users learn and improve their DSA skills.

User Context:
- Weak Topics: ${weakTopics.length > 0 ? weakTopics.join(', ') : 'None identified'}
- Recent Activity: ${recentProgress.length > 0 ?
    recentProgress.map(p => `${p.problem_id} (${p.status})`).join(', ') :
    'No recent activity'}

Guidelines:
- Be encouraging and patient
- Explain concepts clearly with examples
- Provide hints rather than direct solutions when appropriate
- Suggest relevant practice problems
- Focus on understanding over memorization
- Use simple language and analogies
- Ask clarifying questions when needed

Capabilities:
- Explain DSA concepts and problems
- Give step-by-step hints for problems
- Suggest topics to study based on weaknesses
- Recommend practice problems
- Answer questions about algorithms and data structures

Keep responses concise but helpful.`;
};

/**
 * Processes a chat message and returns an AI response.
 */
export const processChatMessage = async (
  request: ChatRequest
): Promise<string> => {
  const { message, userId, problemId } = request;

  // Get user context
  const context = await getUserContext(userId);

  // Get conversation history
  const conversation = getConversation(userId);
  const recentMessages = conversation.messages.slice(-10); // Last 10 messages for context

  // Add user message to history
  addMessageToConversation(userId, {
    role: 'user',
    content: message,
    timestamp: new Date(),
  });

  // Build conversation context for AI
  const systemPrompt = buildSystemPrompt(context);

  let conversationContext = `System: ${systemPrompt}\n\n`;
  conversationContext += recentMessages
    .map(msg => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`)
    .join('\n\n');

  if (problemId) {
    conversationContext += `\n\nCurrent Problem Context: ${problemId}`;
  }

  conversationContext += `\n\nUser: ${message}\n\nAssistant:`;

  // Get AI response
  const reply = await aiProvider.generateFeedback(conversationContext);

  // Add AI response to history
  addMessageToConversation(userId, {
    role: 'assistant',
    content: reply,
    timestamp: new Date(),
  });

  return reply;
};