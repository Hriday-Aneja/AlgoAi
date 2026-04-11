// ─── Weakness Thresholds ──────────────────────────────────────────────────────

export const THRESHOLDS = {
  /** Accuracy (%) below which a topic is considered weak */
  ACCURACY_WEAK: 60,

  /** Average time (seconds) above which a topic is considered weak */
  AVG_TIME_WEAK_SECONDS: 20 * 60,      // 20 minutes

  /** Sub-thresholds used to classify weakness level */
  ACCURACY_HIGH: 40,                    // < 40%  → high weakness
  AVG_TIME_HIGH_SECONDS: 30 * 60,      // > 30 min → high weakness
} as const;

// ─── Weakness Level ───────────────────────────────────────────────────────────

export type WeaknessLevel = 'high' | 'medium';

// ─── Raw row returned by the Supabase RPC function ───────────────────────────

export interface TopicStatsRow {
  topic: string;
  total_attempted: number;
  total_solved: number;
  accuracy: number;           // 0–100
  avg_time_seconds: number | null;
}

// ─── Processed weak-topic record returned by the API ─────────────────────────

export interface WeakTopic {
  topic: string;
  total_attempted: number;
  total_solved: number;
  accuracy: number;           // 0–100, rounded to 2 dp
  avg_time: number;           // minutes, rounded to 2 dp
  weakness_level: WeaknessLevel;
}

// ─── API Response ─────────────────────────────────────────────────────────────

export interface WeakTopicsResponse {
  status: 'success' | 'error';
  user_id: string;
  count: number;
  data: WeakTopic[];
}
