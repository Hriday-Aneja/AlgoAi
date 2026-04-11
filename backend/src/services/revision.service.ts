import supabase from '../config/supabase';
import { ProblemToRevise, RevisionReason } from '../types/revision.types';

// ─── Spaced Repetition Intervals (days) ───────────────────────────────────────

const SPACED_REPETITION_DAYS = [1, 3, 7];

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Checks if a date falls on a spaced repetition day.
 */
const isSpacedRepetitionDay = (createdAt: Date): boolean => {
  const now = new Date();
  const daysDiff = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
  return SPACED_REPETITION_DAYS.includes(daysDiff);
};

/**
 * Gets weak topics for a user (accuracy < 60%).
 */
const getWeakTopics = async (userId: string): Promise<string[]> => {
  const { data, error } = await supabase
    .rpc('get_topic_stats', { p_user_id: userId });

  if (error) {
    console.error('Error fetching topic stats:', error);
    return [];
  }

  return data
    .filter((row: any) => row.accuracy < 60)
    .map((row: any) => row.topic);
};

/**
 * Gets problems to revise for a user.
 */
export const getProblemsToRevise = async (userId: string): Promise<ProblemToRevise[]> => {
  const problemsToRevise: ProblemToRevise[] = [];

  // 1. Spaced repetition: solved problems due for revision
  const { data: solvedProblems, error: solvedError } = await supabase
    .from('user_progress')
    .select('problem_id, topic, difficulty, created_at')
    .eq('user_id', userId)
    .eq('status', 'solved')
    .order('created_at', { ascending: false });

  if (solvedError) {
    console.error('Error fetching solved problems:', solvedError);
  } else {
    for (const problem of solvedProblems) {
      if (isSpacedRepetitionDay(new Date(problem.created_at))) {
        problemsToRevise.push({
          problem_id: problem.problem_id,
          topic: problem.topic,
          difficulty: problem.difficulty,
          last_attempted: problem.created_at,
          reason: 'spaced_repetition',
        });
      }
    }
  }

  // 2. Low accuracy topics: solved problems from weak topics
  const weakTopics = await getWeakTopics(userId);
  if (weakTopics.length > 0) {
    const { data: weakTopicProblems, error: weakError } = await supabase
      .from('user_progress')
      .select('problem_id, topic, difficulty, created_at')
      .eq('user_id', userId)
      .eq('status', 'solved')
      .overlaps('topic', weakTopics);

    if (weakError) {
      console.error('Error fetching weak topic problems:', weakError);
    } else {
      for (const problem of weakTopicProblems) {
        // Avoid duplicates
        if (!problemsToRevise.some(p => p.problem_id === problem.problem_id)) {
          problemsToRevise.push({
            problem_id: problem.problem_id,
            topic: problem.topic,
            difficulty: problem.difficulty,
            last_attempted: problem.created_at,
            reason: 'low_accuracy_topic',
          });
        }
      }
    }
  }

  // 3. Previously failed: attempted but not solved problems
  const { data: failedProblems, error: failedError } = await supabase
    .from('user_progress')
    .select('problem_id, topic, difficulty, created_at')
    .eq('user_id', userId)
    .eq('status', 'attempted')
    .order('created_at', { ascending: false });

  if (failedError) {
    console.error('Error fetching failed problems:', failedError);
  } else {
    for (const problem of failedProblems) {
      // Avoid duplicates
      if (!problemsToRevise.some(p => p.problem_id === problem.problem_id)) {
        problemsToRevise.push({
          problem_id: problem.problem_id,
          topic: problem.topic,
          difficulty: problem.difficulty,
          last_attempted: problem.created_at,
          reason: 'previously_failed',
        });
      }
    }
  }

  return problemsToRevise;
};