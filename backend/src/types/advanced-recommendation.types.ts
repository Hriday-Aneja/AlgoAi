import { Difficulty } from './progress.types';

// ─── User Progress Data Structure ─────────────────────────────────────────────

export interface UserProgressRecord {
  user_id: string;
  problem_id: string;
  topic: string;
  difficulty: Difficulty;
  status: 'solved' | 'attempted';
  attempts_count: number;
  time_taken: number; // in minutes
  created_at: string;
}

// ─── Topic Performance Metrics ───────────────────────────────────────────────

export interface TopicPerformance {
  topic: string;
  total_attempted: number;
  total_solved: number;
  total_attempts: number;
  total_time: number;
  problem_count: number;
  recent_weakness: boolean; // true if weakness in last 7 days
}

// ─── Weakness Calculation Results ────────────────────────────────────────────

export interface TopicWeakness {
  topic: string;
  weakness_score: number;
  accuracy_score: number;
  time_score: number;
  attempts_score: number;
  difficulty_weight: number;
  reason: string;
  recommended_difficulty: Difficulty;
}

// ─── Recommended Problem ─────────────────────────────────────────────────────

export interface RecommendedProblem {
  id: string;
  title: string;
  difficulty: Difficulty;
  topic: string;
}

// ─── API Response ────────────────────────────────────────────────────────────

export interface RecommendationResponse {
  recommended_topic: string;
  weakness_score: number;
  reason: string;
  problems: RecommendedProblem[];
}

// ─── Configuration Constants ─────────────────────────────────────────────────

export const EXPECTED_TIME_MINUTES = {
  easy: 10,
  medium: 20,
  hard: 35,
} as const;

export const DIFFICULTY_WEIGHTS = {
  easy: 0.5,
  medium: 1.0,
  hard: 1.5,
} as const;

export const WEAKNESS_THRESHOLDS = {
  HIGH: 0.7,
  MEDIUM: 0.4,
} as const;