import { Problem } from '../types/recommendation.types';
import { Problem as PrismaProblem } from '@prisma/client';
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

/**
 * Returns one topic chosen at random from the distinct set of topics
 * present in the Problem table.
 */
export const getRandomTopic = async (): Promise<string | undefined> => {
  const records = await prisma.problem.findMany({
    distinct: ['topic'],
    select: { topic: true },
  });
  if (records.length === 0) return undefined;
  return records[Math.floor(Math.random() * records.length)].topic;
};

/**
 * Picks a random topic, then a random problem within that topic, optionally
 * constrained to a difficulty. Difficulty matching is case-insensitive since
 * the Problem table has inconsistent casing (e.g. "Easy" vs "easy").
 * Returns the full native Prisma Problem record (description, constraints,
 * examples, etc.) rather than the narrower recommendation Problem type.
 */
export const getRandomProblemForInterview = async (
  difficulty?: string,
): Promise<PrismaProblem | undefined> => {
  const topic = await getRandomTopic();
  if (!topic) return undefined;

  const where = difficulty
    ? { topic, difficulty: { equals: difficulty, mode: 'insensitive' as const } }
    : { topic };

  const problems = await prisma.problem.findMany({ where });
  if (problems.length === 0) return undefined;

  return problems[Math.floor(Math.random() * problems.length)];
};