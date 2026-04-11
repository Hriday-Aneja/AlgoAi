import { AIProviderFactory } from "../services/providers/aiProvider.factory";
import { AIConfig } from "../services/providers/aiProvider.interface";

export interface AiRoadmapContext {
  experienceLevel: "beginner" | "intermediate" | "advanced";
  preferredTopics: string[];
  goals: string;
}

const getRoadmapPromptDays = (
  experienceLevel: AiRoadmapContext["experienceLevel"],
): number => {
  if (experienceLevel === "beginner") {
    return 14;
  }

  if (experienceLevel === "intermediate") {
    return 10;
  }

  return 7;
};

export const buildRoadmapPrompt = (context: AiRoadmapContext): string => {
  const days = getRoadmapPromptDays(context.experienceLevel);

  return [
    process.env.ONBOARDING_PROMPT_PREFIX ||
      "Generate a 7-14 day DSA roadmap based on user level, goals, and topics.",
    `Experience level: ${context.experienceLevel}`,
    `Preferred topics: ${context.preferredTopics.join(", ")}`,
    `Goals: ${context.goals}`,
    `Total days required: ${days}`,
    "Return strict JSON only in this exact shape:",
    '{"roadmap":[{"day":1,"topic":"arrays","tasks":["Task 1","Task 2"],"difficulty":"easy"}]}',
    "Rules:",
    "- day must be integer and strictly increasing from 1",
    "- tasks must be non-empty string array",
    "- difficulty should be easy, medium, or hard",
    "- no markdown and no extra keys",
  ].join("\n");
};

const getAIConfig = (): AIConfig | null => {
  const provider = (process.env.AI_PROVIDER || "gemini") as "openai" | "gemini";
  const apiKey =
    provider === "gemini"
      ? process.env.GEMINI_API_KEY || process.env.AI_API_KEY
      : process.env.OPENAI_API_KEY || process.env.AI_API_KEY;

  if (!apiKey) {
    return null;
  }

  return {
    provider,
    apiKey,
    model:
      provider === "gemini"
        ? process.env.GEMINI_MODEL || process.env.AI_MODEL
        : process.env.OPENAI_MODEL || process.env.AI_MODEL,
  };
};

export const generateRoadmapWithAI = async (
  context: AiRoadmapContext,
): Promise<string | null> => {
  const config = getAIConfig();
  if (!config) {
    return null;
  }

  const provider = AIProviderFactory.createProvider(config);
  const prompt = buildRoadmapPrompt(context);

  try {
    return await provider.generateFeedback(prompt);
  } catch {
    return null;
  }
};
