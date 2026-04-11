import prisma from "../utils/prisma";

export interface SubmissionSnapshot {
  failedAttempts: number;
  firstSubmissionAt: Date | null;
  lastSubmissionAt: Date | null;
}

export interface HintRecord {
  id: string;
  hintLevel: number;
  hintText: string;
  createdAt: Date;
}

export const getSubmissionSnapshot = async (
  userId: string,
  problemId: string,
): Promise<SubmissionSnapshot> => {
  const [failedAttempts, firstSubmission, lastSubmission] = await Promise.all([
    prisma.submission.count({
      where: {
        userId,
        problemId,
        status: "failed",
      },
    }),
    prisma.submission.findFirst({
      where: {
        userId,
        problemId,
      },
      orderBy: {
        createdAt: "asc",
      },
      select: {
        createdAt: true,
      },
    }),
    prisma.submission.findFirst({
      where: {
        userId,
        problemId,
      },
      orderBy: {
        createdAt: "desc",
      },
      select: {
        createdAt: true,
      },
    }),
  ]);

  return {
    failedAttempts,
    firstSubmissionAt: firstSubmission?.createdAt ?? null,
    lastSubmissionAt: lastSubmission?.createdAt ?? null,
  };
};

export const getHintsByUserAndProblem = async (
  userId: string,
  problemId: string,
): Promise<HintRecord[]> => {
  return prisma.hint.findMany({
    where: {
      userId,
      problemId,
    },
    orderBy: [{ hintLevel: "asc" }, { createdAt: "asc" }],
    select: {
      id: true,
      hintLevel: true,
      hintText: true,
      createdAt: true,
    },
  });
};

export const createHint = async (
  userId: string,
  problemId: string,
  hintLevel: number,
  hintText: string,
): Promise<HintRecord> => {
  return prisma.hint.create({
    data: {
      userId,
      problemId,
      hintLevel,
      hintText,
    },
    select: {
      id: true,
      hintLevel: true,
      hintText: true,
      createdAt: true,
    },
  });
};
