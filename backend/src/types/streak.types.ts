// ─── Database Row (mirrors the Supabase table exactly) ────────────────────────

export interface UserStreak {
  id: string;
  userId: string;
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: string; // ISO timestamp
  createdAt: string;
  updatedAt: string;
}

// ─── Request Bodies ───────────────────────────────────────────────────────────

export interface UpdateStreakDto {
  user_id: string;
  timezone?: string; // e.g. 'America/New_York', defaults to UTC
}

// ─── Response Shapes ──────────────────────────────────────────────────────────

export interface StreakResponse {
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: string;
}

export interface StreakUpdateResponse extends StreakResponse {
  streakIncremented: boolean;
  message: string;
}
