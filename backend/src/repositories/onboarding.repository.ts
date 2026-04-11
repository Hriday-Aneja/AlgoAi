import { Prisma } from "@prisma/client";
import prisma from "../utils/prisma";
import { OnboardingInput, RoadmapDay } from "../types/onboarding.types";

export const findProfileByUserId = async (userId: string) => {
  return prisma.userProfile.findUnique({
    where: { userId },
  });
};

export const createUserProfile = async (
  userId: string,
  input: OnboardingInput,
) => {
  return prisma.userProfile.create({
    data: {
      userId,
      level: input.level,
      goals: input.goals,
      topics: input.topics,
      testScore: input.testScore ?? null,
    },
  });
};

export const createRoadmapDays = async (
  userId: string,
  roadmap: RoadmapDay[],
) => {
  const values: Prisma.RoadmapCreateManyInput[] = roadmap.map((item) => ({
    userId,
    day: item.day,
    topic: item.topic,
    problems: item.problems,
    difficulty: item.difficulty,
    completed: false,
  }));

  await prisma.roadmap.createMany({
    data: values,
    skipDuplicates: true,
  });
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
