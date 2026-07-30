import { AIProviderFactory } from './providers/aiProvider.factory';
import { AIProvider } from './providers/aiProvider.interface';
import {
  ChatMessage,
  Conversation,
  ChatRequest,
  UserContext,
} from '../types/chat.types';
import { Response } from 'express';

// ─── In-Memory Conversation Storage ──────────────────────────
const conversations = new Map<string, Conversation>();

// ─── AI Provider (lazy init) ──────────────────────────────────
let aiProvider: AIProvider | null = null;

const getAIProvider = () => {
  if (!aiProvider) {
    const provider = (process.env.AI_PROVIDER || 'groq') as 'openai' | 'gemini' | 'groq';

    // Support specific keys and the generic AI_API_KEY fallback
    const apiKey =
      provider === 'gemini'
        ? process.env.GEMINI_API_KEY || process.env.AI_API_KEY
        : provider === 'openai'
        ? process.env.OPENAI_API_KEY || process.env.AI_API_KEY
        : process.env.GROQ_API_KEY || process.env.AI_API_KEY;

    if (!apiKey) {
      throw new Error(
        `AI API key not set. Add GROQ_API_KEY, OPENAI_API_KEY, or AI_API_KEY to your backend .env`
      );
    }

    const model =
      provider === 'gemini'
        ? process.env.GEMINI_MODEL || 'gemini-1.5-flash'
        : provider === 'openai'
        ? process.env.OPENAI_MODEL || 'gpt-3.5-turbo'
        : process.env.GROQ_MODEL || 'groq-1';

    aiProvider = AIProviderFactory.createProvider({ provider, apiKey, model });
  }
  return aiProvider;
};

// ─── Conversation helpers ─────────────────────────────────────
const getConversation = (userId: string): Conversation => {
  let conversation = conversations.get(userId);
  if (!conversation) {
    conversation = { userId, messages: [], lastActivity: new Date() };
    conversations.set(userId, conversation);
  }
  return conversation;
};

const addMessage = (userId: string, message: ChatMessage): void => {
  const conv = getConversation(userId);
  conv.messages.push(message);
  conv.lastActivity = new Date();
  // Keep last 20 messages only
  if (conv.messages.length > 20) conv.messages = conv.messages.slice(-20);
  conversations.set(userId, conv);
};

// ─── User context (safe — won't crash if Supabase not configured) ─
const getUserContext = async (userId: string): Promise<UserContext> => {
  try {
    const { getWeakTopics } = await import('./weakTopic.service');
    const supabase = (await import('../config/supabase')).default;

    const weakTopicsData = await getWeakTopics(userId);
    const weakTopics = weakTopicsData.map((wt: any) => wt.topic);

    let { data: recentProgress, error } = await supabase
      .from('user_problem_progress')
      .select('problem_id, topic, status, time_taken, created_at')
      .eq('userId', userId)
      .order('createdAt', { ascending: false })
      .limit(10);

    if (error && error.message.includes('userId')) {
      const fallback = await supabase
        .from('user_problem_progress')
        .select('problem_id, topic, status, time_taken, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(10);

      recentProgress = fallback.data;
    }

    return { weakTopics, recentProgress: Array.isArray(recentProgress) ? recentProgress : [] };
  } catch {
    // Supabase not configured or user not in DB — return empty context
    return { weakTopics: [], recentProgress: [] };
  }
};

// ─── System prompt builder ────────────────────────────────────
const buildSystemPrompt = (context: UserContext): string => {
  const { weakTopics, recentProgress } = context;

  return `You are AlgoAI — an expert, friendly DSA (Data Structures & Algorithms) tutor.

User Context:
- Weak Topics: ${weakTopics.length > 0 ? weakTopics.join(', ') : 'None identified yet'}
- Recent Activity: ${
    recentProgress.length > 0
      ? recentProgress.map((p: any) => `${p.problem_id} (${p.status})`).join(', ')
      : 'No recent activity'
  }

Guidelines:
- Be encouraging, patient and concise
- Explain with real examples and code snippets
- Give hints rather than full solutions when appropriate
- Use markdown for clarity (bold, code blocks, lists)
- Mention time/space complexity where relevant
- Keep responses focused — max ~300 words unless more is needed

You can help with: DSA concepts, problem approaches, debugging, interview tips, complexity analysis.`;
};

// ─── Build full conversation context string ───────────────────
const buildConversationContext = (
  systemPrompt: string,
  history: ChatMessage[],
  newMessage: string,
  problemId?: string
): string => {
  let ctx = `System: ${systemPrompt}\n\n`;
  ctx += history
    .slice(-10)
    .map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
    .join('\n\n');
  if (problemId) ctx += `\n\nCurrent Problem: ${problemId}`;
  ctx += `\n\nUser: ${newMessage}\n\nAssistant:`;
  return ctx;
};

// ─────────────────────────────────────────────────────────────
// processChatMessage — standard (non-streaming) response
// Used by the existing POST /api/chat endpoint
// ─────────────────────────────────────────────────────────────
export const processChatMessage = async (request: ChatRequest): Promise<string> => {
  const { message, userId = 'anonymous', problemId } = request;

  const context = await getUserContext(userId);
  const conversation = getConversation(userId);
  const systemPrompt = buildSystemPrompt(context);
  const fullContext = buildConversationContext(
    systemPrompt,
    conversation.messages,
    message,
    problemId
  );

  addMessage(userId, { role: 'user', content: message, timestamp: new Date() });

  const provider = getAIProvider();
  const reply = await provider.generateFeedback(fullContext);

  addMessage(userId, { role: 'assistant', content: reply, timestamp: new Date() });

  return reply;
};

// ─────────────────────────────────────────────────────────────
// streamChatMessage — SSE streaming response
// Used by the NEW POST /api/chat/stream endpoint
// ─────────────────────────────────────────────────────────────
export const streamChatMessage = async (
  request: ChatRequest,
  res: Response
): Promise<void> => {
  const { message, userId = 'anonymous', problemId } = request;

  // Set SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // Disable nginx buffering if deployed

  const context = await getUserContext(userId);
  const conversation = getConversation(userId);
  const systemPrompt = buildSystemPrompt(context);
  const fullContext = buildConversationContext(
    systemPrompt,
    conversation.messages,
    message,
    problemId
  );

  addMessage(userId, { role: 'user', content: message, timestamp: new Date() });

  const provider = getAIProvider();
  let fullReply = '';

  try {
    const providerName = (process.env.AI_PROVIDER || 'groq').toLowerCase();

    if (providerName === 'gemini') {
      // ── Gemini streaming ──────────────────────────────────────
      const { GoogleGenerativeAI } = await import('@google/generative-ai');
      const apiKey = process.env.GEMINI_API_KEY || process.env.AI_API_KEY || '';
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({
        model: process.env.GEMINI_MODEL || 'gemini-1.5-flash',
      });

      const streamResult = await model.generateContentStream(fullContext);

      for await (const chunk of streamResult.stream) {
        const text = chunk.text();
        if (text) {
          fullReply += text;
          res.write(`data: ${JSON.stringify({ text })}\n\n`);
        }
      }
    } else if (providerName === 'groq') {
      // ── Groq streaming fallback (single event payload) ───────
      const apiKey = process.env.GROQ_API_KEY || process.env.AI_API_KEY || '';
      const model = process.env.GROQ_MODEL || 'groq-1';

      const response = await fetch('https://api.groq.ai/v1/llm', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          input: fullContext,
          max_output_tokens: 1024,
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        throw new Error('Groq streaming request failed');
      }

      const data: any = await response.json();
      const output = (data?.output as any)?.[0];
      const text =
        Array.isArray(output?.content)
          ? output.content.map((item: any) => item?.text || '').join('')
          : output?.text || data?.output || data?.text || '';

      fullReply += text;
      res.write(`data: ${JSON.stringify({ text })}\n\n`);
    } else {
      // ── OpenAI streaming ──────────────────────────────────────
      const OpenAI = (await import('openai')).default;
      const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY || process.env.AI_API_KEY,
      });

      const stream = await openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: fullContext }],
        stream: true,
      });

      for await (const chunk of stream) {
        const text = chunk.choices[0]?.delta?.content || '';
        if (text) {
          fullReply += text;
          res.write(`data: ${JSON.stringify({ text })}\n\n`);
        }
      }
    }

    // Signal end of stream
    res.write('data: [DONE]\n\n');

    // Save complete reply to conversation history
    addMessage(userId, { role: 'assistant', content: fullReply, timestamp: new Date() });
  } catch (err: any) {
    res.write(`data: ${JSON.stringify({ error: err.message || 'AI error' })}\n\n`);
    res.write('data: [DONE]\n\n');
  } finally {
    res.end();
  }
};
