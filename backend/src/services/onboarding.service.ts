import {
  replaceRoadmapDays,
  getRoadmapByUserId,
  markRoadmapDayCompleted,
  upsertOnboardingProfile,
} from "../repositories/onboarding.repository";
import {
  OnboardingInput,
  OnboardingResponse,
  RoadmapDay,
} from "../types/onboarding.types";
import { generateRoadmapWithAI } from "../utils/ai";

const FUNDAMENTAL_TOPICS = [
  "arrays",
  "strings",
  "hashing",
  "two-pointers",
  "sliding-window",
  "binary-search",
  "recursion",
  "trees",
  "graphs",
  "dp",
];

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
      const tasksRaw = Array.isArray(item.tasks) ? item.tasks : [];
      const tasks = tasksRaw.map((p) => String(p).trim()).filter(Boolean);

      if (!Number.isInteger(day) || day <= 0 || !topic || tasks.length === 0) {
        throw new Error("AI roadmap contains malformed day entries.");
      }

      return {
        day,
        topic,
        difficulty: difficulty || "medium",
        tasks,
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

const buildFallbackRoadmap = (input: OnboardingInput): RoadmapDay[] => {
  const days =
    input.experienceLevel === "beginner"
      ? 14
      : input.experienceLevel === "intermediate"
        ? 10
        : 7;

  const topicPool = [
    ...input.preferredTopics,
    ...FUNDAMENTAL_TOPICS.filter(
      (topic) => !input.preferredTopics.includes(topic),
    ),
  ];

  return Array.from({ length: days }).map((_, index) => {
    const topic = topicPool[index % topicPool.length] || "arrays";

    return {
      day: index + 1,
      topic,
      difficulty:
        input.experienceLevel === "beginner"
          ? "easy"
          : input.experienceLevel === "intermediate"
            ? index < 3
              ? "easy"
              : "medium"
            : index < 2
              ? "medium"
              : "hard",
      tasks: [
        `Revise ${topic} fundamentals for 30-45 minutes.`,
        `Solve 2 ${topic} practice problems and write complexity notes.`,
        `Write a short reflection on mistakes and improvement points.`,
      ],
    };
  });
};

const tryParseOpenAIRoadmap = (content: string | null): RoadmapDay[] | null => {
  if (!content) {
    return null;
  }

  const normalized = content
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```\s*$/i, "");

  try {
    const parsed = JSON.parse(normalized);
    return sanitizeRoadmap((parsed as { roadmap?: unknown }).roadmap);
  } catch {
    return null;
  }
};

const getRecommendedTopics = (preferredTopics: string[]): string[] => {
  const merged = [
    ...preferredTopics,
    ...FUNDAMENTAL_TOPICS.filter((topic) => !preferredTopics.includes(topic)),
  ];

  return [...new Set(merged)].slice(0, 12);
};

export const createOrUpdateOnboardingRoadmap = async (
  userId: string,
  input: OnboardingInput,
): Promise<OnboardingResponse> => {
  await upsertOnboardingProfile(userId, input);

  const aiContent = await generateRoadmapWithAI({
    experienceLevel: input.experienceLevel,
    preferredTopics: input.preferredTopics,
    goals: input.goals,
  });

  const roadmapFromAi = tryParseOpenAIRoadmap(aiContent);
  const personalizedRoadmap = roadmapFromAi ?? buildFallbackRoadmap(input);

  await replaceRoadmapDays(userId, personalizedRoadmap);

  return {
    success: true,
    personalizedRoadmap,
    recommendedTopics: getRecommendedTopics(input.preferredTopics),
  };
};

export const fetchRoadmap = async (userId: string): Promise<RoadmapDay[]> => {
  const rows = await getRoadmapByUserId(userId);

  return rows.map((row) => ({
    day: row.day,
    topic: row.topic,
    tasks: Array.isArray(row.tasks) ? row.tasks.map((p) => String(p)) : [],
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
