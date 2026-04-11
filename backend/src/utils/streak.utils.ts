/**
 * ========================================================================
 * Streak Utilities
 * ========================================================================
 *
 * Helper functions for streak logic and calculations.
 * Useful for testing, frontend display logic, or analytics.
 * ========================================================================
 */

import { UserStreak } from '../types/streak.types';

// ─── Streak Status Helpers ─────────────────────────────────────────────────────

/**
 * Determine if a streak is "active" on a given date.
 * A streak is active if the user has been active within the last 2 days.
 *
 * @param streak - The user's streak record
 * @param checkDate - Date to check (defaults to today)
 * @returns true if streak is still active, false if broken
 */
export function isStreakActive(
  streak: UserStreak,
  checkDate: Date = new Date()
): boolean {
  const today = new Date(checkDate);
  today.setUTCHours(0, 0, 0, 0);

  const lastActive = new Date(streak.lastActiveDate);
  lastActive.setUTCHours(0, 0, 0, 0);

  const daysDiff = (today.getTime() - lastActive.getTime()) / (1000 * 60 * 60 * 24);

  // Streak is active if user was active today or yesterday
  return daysDiff <= 1;
}

/**
 * Get a human-readable status message for a streak.
 */
export function getStreakStatusMessage(streak: UserStreak): string {
  if (streak.currentStreak === 0) {
    return 'No active streak. Start solving problems to build one!';
  }

  if (streak.currentStreak === 1) {
    return 'You just started a new streak! Keep going!';
  }

  const message = `You're on a ${streak.currentStreak}-day streak! 🔥`;

  if (streak.currentStreak > streak.longestStreak) {
    return `${message} New personal record!`;
  }

  return message;
}

/**
 * Calculate days remaining before streak breaks.
 * Returns 0 if streak is already broken, 1 if breaking tomorrow, etc.
 */
export function daysUntilStreakBreaks(
  streak: UserStreak,
  checkDate: Date = new Date()
): number {
  const today = new Date(checkDate);
  today.setUTCHours(0, 0, 0, 0);

  const lastActive = new Date(streak.lastActiveDate);
  lastActive.setUTCHours(0, 0, 0, 0);

  const daysDiff = Math.floor(
    (today.getTime() - lastActive.getTime()) / (1000 * 60 * 60 * 24)
  );

  // If already 2+ days, streak is broken (0 days remaining)
  if (daysDiff >= 2) {
    return 0;
  }

  // If 1 day diff, breaking tomorrow (1 day remaining)
  if (daysDiff === 1) {
    return 1;
  }

  // If same day, breaking in 2 days (2 days remaining)
  return 2;
}

// ─── Streak Statistics ─────────────────────────────────────────────────────────

/**
 * Generate a streak summary for display/leaderboard.
 */
export function getStreakSummary(streak: UserStreak) {
  return {
    current: streak.currentStreak,
    longest: streak.longestStreak,
    isActive: isStreakActive(streak),
    daysUntilBreak: daysUntilStreakBreaks(streak),
    statusMessage: getStreakStatusMessage(streak),
    lastActiveDate: new Date(streak.lastActiveDate).toISOString().split('T')[0],
  };
}

/**
 * Format streak for display (e.g. "5 days 🔥").
 */
export function formatStreak(currentStreak: number): string {
  if (currentStreak === 0) {
    return '0 days';
  }

  const emoji =
    currentStreak >= 7 ? '🔥🔥' : currentStreak >= 3 ? '🔥' : '✨';

  return `${currentStreak} day${currentStreak === 1 ? '' : 's'} ${emoji}`;
}

// ─── Validation Helpers ────────────────────────────────────────────────────────

/**
 * Validate that a streak record is consistent.
 * Useful for data integrity checks.
 */
export function validateStreakConsistency(streak: UserStreak): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (streak.currentStreak < 0) {
    errors.push('currentStreak cannot be negative');
  }

  if (streak.longestStreak < 0) {
    errors.push('longestStreak cannot be negative');
  }

  if (streak.longestStreak < streak.currentStreak) {
    errors.push('longestStreak cannot be less than currentStreak');
  }

  if (isNaN(new Date(streak.lastActiveDate).getTime())) {
    errors.push('lastActiveDate is not a valid date');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

// ─── Timezone Helper ───────────────────────────────────────────────────────────

/**
 * Get the midpoint of today in a specific timezone.
 * Useful for determining "same day" across timezones.
 */
export function getMidnightInTimezone(timezone: string): Date {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });

  const dateParts = formatter.format(new Date());
  return new Date(dateParts + 'T00:00:00Z');
}

/**
 * Check if two dates are on the same day in a given timezone.
 */
export function isSameDayInTimezone(
  date1: Date,
  date2: Date,
  timezone: string = 'UTC'
): boolean {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });

  const day1 = formatter.format(date1);
  const day2 = formatter.format(date2);

  return day1 === day2;
}
