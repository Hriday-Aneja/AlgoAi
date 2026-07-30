import { prisma } from '../config/database';
import { CreateProgressDto, UserProgress } from '../types/progress.types';
import { normaliseTopic } from '../utils/progressValidator';

const toLegacyProgress = (record: any): UserProgress => ({
  id: record.id,
  user_id: record.userId,
  problem_id: record.problemId,
  topic: record.topic,
  difficulty: record.difficulty,
  status: record.status,
  time_taken: record.timeTaken ?? null,
  created_at: record.createdAt instanceof Date ? record.createdAt.toISOString() : record.createdAt,
});

export const upsertProgress = async (
  dto: CreateProgressDto
): Promise<UserProgress> => {
  const userId = dto.user_id;
  const payload = {
    userId,
    problemId: dto.problem_id,
    topic: normaliseTopic(dto.topic),
    difficulty: dto.difficulty,
    status: dto.status,
    timeTaken: dto.time_taken ?? null,
  };

  const record = await prisma.userProblemProgress.upsert({
    where: {
      userId_problemId: {
        userId: payload.userId,
        problemId: payload.problemId,
      },
    },
    update: {
      topic: payload.topic,
      difficulty: payload.difficulty,
      status: payload.status,
      timeTaken: payload.timeTaken,
    },
    create: payload,
  });

  return toLegacyProgress(record);
};

export const getProgressByUser = async (
  userId: string
): Promise<UserProgress[]> => {
  const records = await prisma.userProblemProgress.findMany({
    where: { userId },
    orderBy: { updatedAt: 'desc' },
  });

  return records.map(toLegacyProgress);
};
