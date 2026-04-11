import { AIProviderFactory } from './providers/aiProvider.factory';
import { AIFeedbackInput, AIFeedbackOutput } from '../types/aiFeedback.types';

// Get AI config from environment
const getAIConfig = () => {
  const provider = (process.env.AI_PROVIDER || 'openai') as 'openai' | 'gemini';
  const apiKey = process.env.AI_API_KEY;

  if (!apiKey) {
    throw new Error('AI_API_KEY environment variable is required');
  }

  return {
    provider,
    apiKey,
    model: process.env.AI_MODEL,
  };
};

// Create AI provider instance
const aiProvider = AIProviderFactory.createProvider(getAIConfig());

/**
 * Generates AI-powered feedback based on user's weak topics and recent activity.
 */
export const generateAIFeedback = async (
  input: AIFeedbackInput
): Promise<AIFeedbackOutput> => {
  const { weakTopics, recentActivity } = input;

  // Prepare the prompt
  const prompt = `
You are an AI tutor specializing in Data Structures and Algorithms (DSA). Based on the following user data, provide personalized improvement suggestions and a study plan.

User's Weak Topics: ${weakTopics.join(', ')}

Recent Activity (last few problems solved):
${recentActivity.map(activity => `- Topic: ${activity.topic}, Solved: ${activity.solved ? 'Yes' : 'No'}, Time Spent: ${activity.timeSpent} minutes, Difficulty: ${activity.difficulty}`).join('\n')}

Please respond in JSON format with the following structure:
{
  "improvementSuggestions": ["suggestion1", "suggestion2", ...],
  "studyPlan": [
    {
      "topic": "topicName",
      "priority": "high|medium|low",
      "recommendedActions": ["action1", "action2", ...],
      "estimatedTime": number_in_minutes
    },
    ...
  ]
}

Focus on:
- Identifying patterns in mistakes
- Suggesting targeted practice
- Recommending resources or strategies
- Creating a realistic study plan based on weak areas
`;

  try {
    const content = await aiProvider.generateFeedback(prompt);

    // Parse the JSON response
    const parsed: AIFeedbackOutput = JSON.parse(content);

    // Validate the structure
    if (!parsed.improvementSuggestions || !Array.isArray(parsed.improvementSuggestions)) {
      throw new Error('Invalid improvementSuggestions format');
    }
    if (!parsed.studyPlan || !Array.isArray(parsed.studyPlan)) {
      throw new Error('Invalid studyPlan format');
    }

    return parsed;
  } catch (error) {
    console.error('Error generating AI feedback:', error);
    throw new Error('Failed to generate AI feedback');
  }
};