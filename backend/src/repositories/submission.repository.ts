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