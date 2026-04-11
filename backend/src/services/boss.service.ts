import { v4 as uuidv4 } from 'uuid';
import supabase from '../config/supabase';
import {
  BossSession,
  BossResult,
  StartBossBattleRequest,
  SubmitBossBattleRequest,
} from '../types/boss.types';

// ─── In-Memory Session Storage (Note: Not scalable for production) ────────────
// In production, use Redis or database table for sessions

const sessions = new Map<string, BossSession>();

// ─── Scoring Constants ────────────────────────────────────────────────────────

const SCORING = {
  BASE_POINTS_PER_PROBLEM: 100,
  TIME_BONUS_MULTIPLIER: 0.1, // bonus for faster solving
  MAX_TIME_BONUS: 50, // max bonus points
  RANK_THRESHOLDS: {
    S: 90, // 90%+ score
    A: 80,
    B: 70,
    C: 60,
    D: 0,  // below 60%
  },
} as const;

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Generates a random set of problems for the battle.
 */
const generateProblems = async (
  difficulty: 'easy' | 'medium' | 'hard' = 'medium',
  count: number = 5
): Promise<{ problem_id: string; topic: string[]; difficulty: 'easy' | 'medium' | 'hard' }[]> => {
  // Get problems from database (assuming there's a problems table or data)
  // For now, using mock data since we don't have a problems table
  // In real implementation, query from problems table

  const mockProblems = [
    { problem_id: 'two-sum', topic: ['Arrays', 'Hash Table'], difficulty: 'easy' as const },
    { problem_id: 'fibonacci', topic: ['Dynamic Programming'], difficulty: 'easy' as const },
    { problem_id: 'binary-search', topic: ['Arrays', 'Binary Search'], difficulty: 'medium' as const },
    { problem_id: 'merge-sort', topic: ['Sorting', 'Divide and Conquer'], difficulty: 'medium' as const },
    { problem_id: 'knapsack', topic: ['Dynamic Programming'], difficulty: 'hard' as const },
    { problem_id: 'graph-traversal', topic: ['Graphs', 'DFS'], difficulty: 'medium' as const },
    { problem_id: 'tree-traversal', topic: ['Trees', 'DFS'], difficulty: 'medium' as const },
    { problem_id: 'sliding-window', topic: ['Arrays', 'Two Pointers'], difficulty: 'medium' as const },
  ];

  // Filter by difficulty and shuffle
  const filteredProblems = mockProblems.filter(p => p.difficulty === difficulty);
  const shuffled = filteredProblems.sort(() => 0.5 - Math.random());

  return shuffled.slice(0, Math.min(count, shuffled.length));
};

/**
 * Calculates the score based on problems solved and time taken.
 */
const calculateScore = (
  problemsSolved: number,
  totalProblems: number,
  totalTimeTaken: number
): BossResult => {
  const baseScore = (problemsSolved / totalProblems) * 100;

  // Time bonus: faster solving gives bonus (inverse of time)
  const avgTimePerProblem = totalTimeTaken / totalProblems;
  const timeBonus = Math.max(0, SCORING.MAX_TIME_BONUS - (avgTimePerProblem * SCORING.TIME_BONUS_MULTIPLIER));

  const finalScore = Math.min(100, baseScore + timeBonus);

  // Determine rank
  let rank: 'S' | 'A' | 'B' | 'C' | 'D' = 'D';
  if (finalScore >= SCORING.RANK_THRESHOLDS.S) rank = 'S';
  else if (finalScore >= SCORING.RANK_THRESHOLDS.A) rank = 'A';
  else if (finalScore >= SCORING.RANK_THRESHOLDS.B) rank = 'B';
  else if (finalScore >= SCORING.RANK_THRESHOLDS.C) rank = 'C';

  return {
    score: Math.round(finalScore),
    timeTaken: totalTimeTaken,
    rank,
    problemsSolved,
    totalProblems,
  };
};

/**
 * Starts a new boss battle session.
 */
export const startBossBattle = async (
  request: StartBossBattleRequest
): Promise<{ sessionId: string; problems: any[]; startTime: string }> => {
  const { userId, difficulty = 'medium', problemCount = 5 } = request;

  const problems = await generateProblems(difficulty, problemCount);
  const sessionId = uuidv4();
  const startTime = new Date();

  const session: BossSession = {
    sessionId,
    userId,
    problems,
    startTime,
  };

  sessions.set(sessionId, session);

  return {
    sessionId,
    problems,
    startTime: startTime.toISOString(),
  };
};

/**
 * Submits answers for a boss battle session.
 */
export const submitBossBattle = async (
  request: SubmitBossBattleRequest
): Promise<BossResult> => {
  const { sessionId, answers } = request;

  const session = sessions.get(sessionId);
  if (!session) {
    throw new Error('Session not found or expired');
  }

  if (session.submitted) {
    throw new Error('Battle already submitted');
  }

  // Calculate results
  const problemsSolved = answers.filter(a => a.solved).length;
  const totalTimeTaken = answers.reduce((sum, a) => sum + a.timeTaken, 0);

  const result = calculateScore(problemsSolved, session.problems.length, totalTimeTaken);

  // Mark as submitted and store result
  session.submitted = true;
  session.result = result;
  sessions.set(sessionId, session);

  // Store in database (optional, for persistence)
  // await storeBossResult(session.userId, result);

  return result;
};

/**
 * Gets the result of a boss battle for a user.
 * Note: In production, this would query from database.
 */
export const getBossResult = async (userId: string): Promise<BossResult | null> => {
  // Find the most recent submitted session for the user
  const userSessions = Array.from(sessions.values())
    .filter(s => s.userId === userId && s.submitted && s.result);

  if (userSessions.length === 0) {
    return null;
  }

  // Return the most recent result
  const latestSession = userSessions.sort((a, b) =>
    b.startTime.getTime() - a.startTime.getTime()
  )[0];

  return latestSession.result!;
};