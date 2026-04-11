import { AIProviderFactory } from "./providers/aiProvider.factory";
import { AIConfig } from "./providers/aiProvider.interface";
import {
  createRoadmapDays,
  createUserProfile,
  findProfileByUserId,
  getRoadmapByUserId,
  markRoadmapDayCompleted,
} from "../repositories/onboarding.repository";
import { OnboardingInput, RoadmapDay } from "../types/onboarding.types";

const getAIConfig = (): AIConfig => {
  const provider = (process.env.AI_PROVIDER || "openai") as "openai" | "gemini";
  const apiKey =
    provider === "openai"
      ? process.env.OPENAI_API_KEY || process.env.AI_API_KEY
      : process.env.GEMINI_API_KEY || process.env.AI_API_KEY;

  if (!apiKey) {
    if (provider === "gemini") {
      throw new Error("GEMINI_API_KEY (or AI_API_KEY) is required.");
    }

    throw new Error("OPENAI_API_KEY (or AI_API_KEY) is required.");
  }

  return {
    provider,
    apiKey,
    model: process.env.AI_MODEL,
  };
};

const sanitizeRoadmap = (value: unknown): RoadmapDay[] => {
  if (!Array.isArray(value) || value.length === 0) {
    throw new Error("AI roadmap is empty or invalid.");
  }

  const sanitized = value
    .filter(
      (item): item is Record<string, unknown> =>
        typeof item === "object" && item !== null,
    )
    .map((item, index) => {
      const day = Number(item.day ?? index + 1);
      const topic = String(item.topic ?? "").trim();
      const difficulty = String(item.difficulty ?? "medium")
        .trim()
        .toLowerCase();
      const problemsRaw = Array.isArray(item.problems) ? item.problems : [];
      const problems = problemsRaw.map((p) => String(p).trim()).filter(Boolean);

      if (
        !Number.isInteger(day) ||
        day <= 0 ||
        !topic ||
        problems.length === 0
      ) {
        throw new Error("AI roadmap contains malformed day entries.");
      }

      return {
        day,
        topic,
        difficulty: difficulty || "medium",
        problems,
      };
    })
    .sort((a, b) => a.day - b.day);

  const dedupedByDay = sanitized.filter(
    (item, idx, arr) => idx === arr.findIndex((x) => x.day === item.day),
  );

  if (dedupedByDay.length === 0) {
    throw new Error("AI roadmap parsing failed.");
  }

  return dedupedByDay;
};

const generateRoadmapPrompt = (input: OnboardingInput): string => {
  const days =
    input.level === "beginner" ? 30 : input.level === "intermediate" ? 21 : 14;
  const scoreText =
    typeof input.testScore === "number"
      ? `Mini test score: ${input.testScore}/100.`
      : "Mini test score not provided.";

  return [
    "You are an elite DSA mentor.",
    "Create a personalized day-wise DSA roadmap.",
    `Level: ${input.level}.`,
    `Goals: ${input.goals}.`,
    `Focus topics: ${input.topics.join(", ")}.`,
    scoreText,
    `Return exactly ${days} days in JSON only.`,
    "Strict response format:",
    '{ "roadmap": [{ "day": 1, "topic": "arrays", "problems": ["Two Sum", "Best Time to Buy and Sell Stock"], "difficulty": "easy" }] }',
    "Rules:",
    "- day must be incremental integer starting at 1",
    "- problems must be practical DSA problem names",
    "- difficulty must be one of easy/medium/hard",
    "- no markdown, no prose, no extra keys",
  ].join("\n");
};

export const createOnboardingRoadmap = async (
  userId: string,
  input: OnboardingInput,
): Promise<RoadmapDay[]> => {
  const existingProfile = await findProfileByUserId(userId);
  if (existingProfile) {
    const error = new Error("Onboarding already completed for this user.");
    (error as Error & { statusCode?: number }).statusCode = 409;
    throw error;
  }

  await createUserProfile(userId, input);

  const provider = AIProviderFactory.createProvider(getAIConfig());
  const content = await provider.generateFeedback(generateRoadmapPrompt(input));

  if (!content) {
    const error = new Error("AI provider returned an empty response.");
    (error as Error & { statusCode?: number }).statusCode = 502;
    throw error;
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch {
    const error = new Error(
      "Malformed AI response. Could not parse JSON roadmap.",
    );
    (error as Error & { statusCode?: number }).statusCode = 502;
    throw error;
  }

  const roadmap = sanitizeRoadmap((parsed as { roadmap?: unknown }).roadmap);
  await createRoadmapDays(userId, roadmap);

  return roadmap;
};

export const fetchRoadmap = async (userId: string): Promise<RoadmapDay[]> => {
  const rows = await getRoadmapByUserId(userId);

  return rows.map((row) => ({
    day: row.day,
    topic: row.topic,
    problems: Array.isArray(row.problems)
      ? row.problems.map((p) => String(p))
      : [],
    difficulty: row.difficulty,
  }));
};

export const completeRoadmapDay = async (
  userId: string,
  day: number,
): Promise<void> => {
  try {
    await markRoadmapDayCompleted(userId, day);
  } catch {
    const error = new Error("Roadmap day not found for this user.");
    (error as Error & { statusCode?: number }).statusCode = 404;
    throw error;
  }
};
