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
import prisma from "../utils/prisma";

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

const normalizeToUtcMidnight = (date: Date | string | number) => {
  const parsedDate = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(parsedDate.getTime())) {
    throw new Error("Invalid date passed to normalizeToUtcMidnight");
  }

  return new Date(Date.UTC(parsedDate.getUTCFullYear(), parsedDate.getUTCMonth(), parsedDate.getUTCDate()));
};

export const getRoadmapMeta = async (userId: string, roadmapLength: number) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      createdAt: true,
      onboardingProfile: {
        select: {
          createdAt: true,
        },
      },
    },
  });

  const startDate = user?.onboardingProfile?.createdAt ?? user?.createdAt;
  if (!startDate) {
    return {
      startDate: null,
      daysSinceStart: 0,
      currentRoadmapDay: 1,
      roadmapLength,
      unlockedDays: 0,
      lockedDays: roadmapLength,
      unlockedDayNumbers: [],
      lockedDayNumbers: Array.from({ length: roadmapLength }, (_, idx) => idx + 1),
    };
  }

  const parsedStartDate = startDate instanceof Date ? startDate : new Date(startDate);
  if (Number.isNaN(parsedStartDate.getTime())) {
    throw new Error("Invalid startDate value in onboarding metadata");
  }

  const today = normalizeToUtcMidnight(new Date());
  const startedAt = normalizeToUtcMidnight(parsedStartDate);
  let daysSinceStart = Math.floor((today.getTime() - startedAt.getTime()) / (1000 * 60 * 60 * 24));
  if (daysSinceStart < 0) {
    daysSinceStart = 0;
  }

  const maxRoadmapDays = roadmapLength > 0 ? Math.min(roadmapLength, 15) : 0;
  const unlockedDays = Math.max(Math.min(daysSinceStart + 1, maxRoadmapDays), 0);
  const lockedDays = Math.max(maxRoadmapDays - unlockedDays, 0);
  const unlockedDayNumbers = Array.from({ length: unlockedDays }, (_, idx) => idx + 1);
  const lockedDayNumbers = Array.from({ length: lockedDays }, (_, idx) => unlockedDays + idx + 1);
  const currentRoadmapDay = maxRoadmapDays > 0 ? Math.min(daysSinceStart + 1, maxRoadmapDays) : 1;

  return {
    startDate: parsedStartDate.toISOString(),
    daysSinceStart,
    currentRoadmapDay,
    roadmapLength: maxRoadmapDays,
    unlockedDays,
    lockedDays,
    unlockedDayNumbers,
    lockedDayNumbers,
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
    tasks: Array.isArray(row.tasks) ? (row.tasks as any[]).map((p) => String(p)) : [],
    difficulty: row.difficulty,
    completed: Boolean(row.completed),
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
