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
      preferredTopics: JSON.stringify(input.preferredTopics), // Serialize array to string
      goals: input.goals,
    },
    update: {
      experienceLevel: input.experienceLevel,
      preferredTopics: JSON.stringify(input.preferredTopics), // Serialize array to string
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
    tasks: JSON.stringify(item.tasks), // Serialize array to string
    difficulty: item.difficulty,
    completed: false,
  }));

  await prisma.$transaction([
    prisma.roadmap.deleteMany({ where: { userId } }),
    prisma.roadmap.createMany({ data: values }),
  ]);
};

export const getRoadmapByUserId = async (userId: string) => {
  const roadmaps = await prisma.roadmap.findMany({
    where: { userId },
    orderBy: { day: "asc" },
  });

  // Deserialize tasks from string back to array
  return roadmaps.map(roadmap => ({
    ...roadmap,
    tasks: JSON.parse(roadmap.tasks as string),
  }));
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
