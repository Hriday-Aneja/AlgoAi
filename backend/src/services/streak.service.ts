import supabase from '../config/supabase';
import { UserStreak, UpdateStreakDto, StreakUpdateResponse } from '../types/streak.types';

const TABLE = 'streaks';

export const calculateNextStreakState = ({
  currentStreak,
  daysDiff,
}: {
  currentStreak: number;
  daysDiff: number;
}): { currentStreak: number; streakIncremented: boolean; message: string } => {
  if (daysDiff === 0) {
    return {
      currentStreak: Math.max(1, currentStreak),
      streakIncremented: false,
      message: 'Problem solved today already. Streak unchanged.',
    };
  }

  if (daysDiff === 1) {
    return {
      currentStreak: currentStreak + 1,
      streakIncremented: true,
      message: `Streak continued! Day ${currentStreak + 1}`,
    };
  }

  if (daysDiff > 1) {
    return {
      currentStreak: 1,
      streakIncremented: true,
      message: 'Streak reset after skipping days. New streak: Day 1',
    };
  }

  return {
    currentStreak: Math.max(1, currentStreak),
    streakIncremented: false,
    message: 'Invalid date. Streak unchanged.',
  };
};

// ─── Helper: Date Utilities ───────────────────────────────────────────────────
// Handles timezone-aware date comparisons without time components.

/**
 * Get today's date in a specific timezone (midnight UTC for that timezone).
 * This ensures consistent date-based logic across time zones.
 *
 * @param timezone - e.g. 'America/New_York', defaults to 'UTC'
 * @returns ISO date string (YYYY-MM-DD) representing today in that timezone
 */
function getTodayInTimezone(timezone: string = 'UTC'): string {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  return formatter.format(new Date());
}

/**
 * Extract date component from ISO timestamp (YYYY-MM-DD).
 */
function extractDate(isoTimestamp: string): string {
  return isoTimestamp.split('T')[0];
}

/**
 * Calculate the difference in days between two ISO date strings (YYYY-MM-DD).
 * Returns: positive if date1 > date2, negative if date1 < date2, 0 if equal.
 */
function daysDifference(date1: string, date2: string): number {
  const d1 = new Date(date1 + 'T00:00:00Z');
  const d2 = new Date(date2 + 'T00:00:00Z');
  const diffMs = d1.getTime() - d2.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

// ─── Service Layer ────────────────────────────────────────────────────────────
// All direct Supabase / DB interactions and streak logic live here.
// Controllers never touch the DB client directly.

/**
 * Get or initialize a streak record for a user.
 * If the user has no streak record, create one with zero streak.
 */
export const getOrCreateStreak = async (userId: string): Promise<UserStreak> => {
  // Try to fetch existing streak
  const { data: existingStreak, error: fetchError } = await supabase
    .from(TABLE)
    .select('*')
    .eq('userId', userId)
    .single();

  // If exists, return it
  if (existingStreak) {
    return existingStreak as UserStreak;
  }

  // If error is not "no rows", it's a real error
  if (fetchError && fetchError.code !== 'PGRST116') {
    throw new Error(`Database error [getOrCreateStreak]: ${fetchError.message}`);
  }

  // Create new streak record for this user
  const { data: newStreak, error: createError } = await supabase
    .from(TABLE)
    .insert({
      userId,
      currentStreak: 0,
      longestStreak: 0,
      lastActiveDate: new Date().toISOString(),
    })
    .select()
    .single();

  if (createError) {
    throw new Error(`Database error [getOrCreateStreak]: ${createError.message}`);
  }

  return newStreak as UserStreak;
};

/**
 * Get the current streak for a user.
 */
export const getStreak = async (userId: string): Promise<UserStreak> => {
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .eq('userId', userId)
    .single();

  if (error && error.code !== 'PGRST116') {
    throw new Error(`Database error [getStreak]: ${error.message}`);
  }

  if (!data) {
    // User has no streak record yet
    return await getOrCreateStreak(userId);
  }

  return data as UserStreak;
};

/**
 * Update the user's streak when they solve a problem.
 *
 * Logic:
 *  1. If user solves a problem on the SAME day → no increment (already counted)
 *  2. If user solves on NEXT day → increment currentStreak, update lastActiveDate
 *  3. If user skips a day (2+ days gap) → reset currentStreak to 1, update lastActiveDate
 *  4. Always update longestStreak if currentStreak exceeds it
 *
 * @param dto - Contains user_id and optional timezone
 * @returns Updated streak info and whether it was incremented
 */
export const updateStreakOnProblemSolved = async (
  dto: UpdateStreakDto
): Promise<StreakUpdateResponse> => {
  const { user_id: userId, timezone = 'UTC' } = dto;

  // 1. Get current streak (or create if doesn't exist)
  let streak = await getOrCreateStreak(userId);

  // 2. Determine today's date in user's timezone
  const todayDate = getTodayInTimezone(timezone);
  const lastActiveDate = extractDate(streak.lastActiveDate);

  // 3. Calculate days difference
  const daysDiff = daysDifference(todayDate, lastActiveDate);

  const { currentStreak: newCurrentStreak, streakIncremented, message } = calculateNextStreakState({
    currentStreak: streak.currentStreak,
    daysDiff,
  });

  // 4. Update longestStreak if exceeded
  const newLongestStreak = Math.max(streak.longestStreak, newCurrentStreak);

  // 5. Update database
  const { data: updatedStreak, error } = await supabase
    .from(TABLE)
    .update({
      currentStreak: newCurrentStreak,
      longestStreak: newLongestStreak,
      lastActiveDate: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
    .eq('userId', userId)
    .select()
    .single();

  if (error) {
    throw new Error(`Database error [updateStreakOnProblemSolved]: ${error.message}`);
  }

  return {
    currentStreak: updatedStreak.currentStreak,
    longestStreak: updatedStreak.longestStreak,
    lastActiveDate: updatedStreak.lastActiveDate,
    streakIncremented,
    message,
  };
};

/**
 * Manually reset a streak (e.g., admin action or if user requests).
 */
export const resetStreak = async (userId: string): Promise<UserStreak> => {
  const { data, error } = await supabase
    .from(TABLE)
    .update({
      currentStreak: 0,
      lastActiveDate: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
    .eq('userId', userId)
    .select()
    .single();

  if (error) {
    throw new Error(`Database error [resetStreak]: ${error.message}`);
  }

  return data as UserStreak;
};
