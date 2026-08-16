import prisma from "../utils/prisma";

export interface SubmissionRecord {
  id: string;
  problemId: string;
  status: string;
  createdAt: Date;
}

export const createSubmission = async (
  userId: string,
  problemId: string,
  status: "passed" | "failed",
): Promise<SubmissionRecord> => {
  return prisma.submission.create({
    data: {
      userId,
      problemId,
      status,
    },
    select: {
      id: true,
      problemId: true,
      status: true,
      createdAt: true,
    },
  });
};

export const getSubmissionsForUserLastNDays = async (
  userId: string,
  days = 30,
): Promise<Pick<SubmissionRecord, 'status' | 'createdAt'>[]> => {
  const today = new Date();
  const start = new Date(today);
  start.setDate(today.getDate() - (days - 1));

  return prisma.submission.findMany({
    where: {
      userId,
      createdAt: {
        gte: start,
      },
    },
    select: {
      status: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'asc' },
  });
};

export const getAllSubmissionsForUser = async (
  userId: string,
): Promise<Pick<SubmissionRecord, 'problemId' | 'status' | 'createdAt'>[]> => {
  return prisma.submission.findMany({
    where: { userId },
    select: {
      problemId: true,
      status: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'asc' },
  });
};