import supabase from '../config/supabase';

// Hardcoded list of problems for deterministic selection
const PROBLEMS = [
  { id: 'two-sum', difficulty: 'easy' },
  { id: 'reverse-string', difficulty: 'easy' },
  { id: 'palindrome-check', difficulty: 'easy' },
  { id: 'binary-search', difficulty: 'medium' },
  { id: 'merge-sort', difficulty: 'medium' },
  { id: 'fibonacci', difficulty: 'medium' },
  { id: 'longest-substring', difficulty: 'hard' },
  { id: 'knapsack', difficulty: 'hard' },
  { id: 'graph-traversal', difficulty: 'hard' },
];

/**
 * Get the daily challenge for a given date.
 * If not exists, create it deterministically.
 */
export const getDailyChallenge = async (date: Date) => {
  const dateString = date.toISOString().split('T')[0]; // YYYY-MM-DD

  // Check if exists
  const { data: existing, error } = await supabase
    .from('daily_challenges')
    .select('*')
    .eq('date', dateString)
    .single();

  if (existing && !error) {
    return existing;
  }

  // Create new
  const dayOfYear = Math.floor((date.getTime() - new Date(date.getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24));
  const index = dayOfYear % PROBLEMS.length;
  const problem = PROBLEMS[index];

  const { data: newChallenge, error: insertError } = await supabase
    .from('daily_challenges')
    .insert({
      date: dateString,
      problemId: problem.id,
      difficulty: problem.difficulty,
    })
    .select()
    .single();

  if (insertError) {
    throw new Error(`Failed to create daily challenge: ${insertError.message}`);
  }

  return newChallenge;
};

/**
 * Check if user has completed today's challenge.
 */
export const hasUserCompletedToday = async (userId: string, date: Date) => {
  const dateString = date.toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('daily_challenge_completions')
    .select('completed')
    .eq('userId', userId)
    .eq('date', dateString)
    .single();

  if (error && error.code !== 'PGRST116') { // PGRST116 is no rows
    throw new Error(`Failed to check completion: ${error.message}`);
  }

  return data?.completed || false;
};

/**
 * Mark today's challenge as completed for user, and award XP bonus.
 */
export const completeDailyChallenge = async (userId: string, date: Date) => {
  const dateString = date.toISOString().split('T')[0];

  // Upsert completion
  const { error: completionError } = await supabase
    .from('daily_challenge_completions')
    .upsert({
      userId,
      date: dateString,
      completed: true,
    });

  if (completionError) {
    throw new Error(`Failed to mark completion: ${completionError.message}`);
  }

  // Award XP bonus (optional)
  // Assuming there's a way to add XP, perhaps update user profile or separate XP table
  // For now, just log or assume handled elsewhere

  return true;
};