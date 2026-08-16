// ─── Enums ────────────────────────────────────────────────────────────────────

export type Difficulty = 'easy' | 'medium' | 'hard';
export type Status = 'solved' | 'attempted';

// ─── Database Row (mirrors the Supabase table exactly) ────────────────────────

export interface UserProgress {
  id: string;                  // UUID primary key
  user_id: string;             // FK → auth.users
  problem_id: string;          // Unique problem identifier (e.g. "two-sum")
  topic: string[];             // e.g. ["arrays", "hash-map"]
  difficulty: Difficulty;
  status: Status;
  time_taken: number | null;   // Seconds spent solving
  created_at: string;          // ISO timestamp set by Supabase
  updated_at: string;          // Last time this record changed (e.g. attempted -> solved)
}

// ─── Request Bodies ───────────────────────────────────────────────────────────

export interface CreateProgressDto {
  user_id: string;
  problem_id: string;
  topic: string | string[];    // Accept both; will normalise to string[]
  difficulty: Difficulty;
  status: Status;
  time_taken?: number;
}

// ─── Response Shapes ──────────────────────────────────────────────────────────

export interface ProgressResponse {
  status: 'success' | 'error';
  data?: UserProgress | UserProgress[];
  message?: string;
}