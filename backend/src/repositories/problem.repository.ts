import { Problem } from '../types/recommendation.types';
import { prisma } from '../config/database';

// ─── Repository ───────────────────────────────────────────────────────────────
//
// Problems now live in Postgres (see prisma/schema.prisma -> model Problem).
// Data is loaded via `npm run prisma:seed`.
// The `id` column has a DB-level unique constraint, so duplicate problem
// entries (e.g. "Two Sum" appearing twice) can no longer exist.

/**
 * Returns all problems whose topic matches any of the given topics.
 */
export const getProblemsByTopics = async (topics: string[]): Promise<Problem[]> => {
  const problems = await prisma.problem.findMany({
    where: { topic: { in: topics } },
  });
  return problems as unknown as Problem[];
};

/**
 * Returns the full problem catalogue.
 * Useful for admin or analytics endpoints.
 */
export const getAllProblems = async (): Promise<Problem[]> => {
  const problems = await prisma.problem.findMany();
  return problems as unknown as Problem[];
};

/**
 * Looks up a single problem by its ID.
 */
export const getProblemById = async (id: string): Promise<Problem | undefined> => {
  const problem = await prisma.problem.findUnique({ where: { id } });
  return problem ? (problem as unknown as Problem) : undefined;
};