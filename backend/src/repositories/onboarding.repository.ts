import { Prisma } from "@prisma/client";
import prisma from "../utils/prisma";
import { OnboardingInput, RoadmapDay } from "../types/onboarding.types";

export const upsertOnboardingProfile = async (
  userId: string,
  input: OnboardingInput,
) => {
  return prisma.onboardingProfile.upsert({
    where: { userId },
    create: {
      userId,
      experienceLevel: input.experienceLevel,
      preferredTopics: input.preferredTopics,
      goals: input.goals,
    },
    update: {
      experienceLevel: input.experienceLevel,
      preferredTopics: input.preferredTopics,
      goals: input.goals,
    },
  });
};

export const replaceRoadmapDays = async (
  userId: string,
  roadmap: RoadmapDay[],
) => {
  const values: Prisma.RoadmapCreateManyInput[] = roadmap.map((item) => ({
    userId,
    day: item.day,
    topic: item.topic,
    tasks: item.tasks,
    difficulty: item.difficulty,
    completed: false,
  }));

  await prisma.$transaction([
    prisma.roadmap.deleteMany({ where: { userId } }),
    prisma.roadmap.createMany({ data: values }),
  ]);
};

export const getRoadmapByUserId = async (userId: string) => {
  return prisma.roadmap.findMany({
    where: { userId },
    orderBy: { day: "asc" },
  });
};

export const markRoadmapDayCompleted = async (userId: string, day: number) => {
  return prisma.roadmap.update({
    where: {
      userId_day: {
        userId,
        day,
      },
    },
    data: {
      completed: true,
    },
  });
};
