// ─── Revision Reason ──────────────────────────────────────────────────────────

export type RevisionReason = 'spaced_repetition' | 'low_accuracy_topic' | 'previously_failed';

// ─── Problem to Revise ────────────────────────────────────────────────────────

export interface ProblemToRevise {
  problem_id: string;
  topic: string[];
  difficulty: 'easy' | 'medium' | 'hard';
  last_attempted: string; // ISO date string
  reason: RevisionReason;
}

// ─── API Response ─────────────────────────────────────────────────────────────

export interface RevisionResponse {
  status: 'success' | 'error';
  user_id: string;
  count: number;
  data: {
    problemsToRevise: ProblemToRevise[];
  };
}