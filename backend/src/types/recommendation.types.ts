import { Difficulty } from './progress.types';
import { WeakTopic }  from './weakTopic.types';

// ─── Core Problem Shape ───────────────────────────────────────────────────────

export interface Problem {
  id: string;
  title: string;
  topic: string;
  difficulty: Difficulty;
  url: string;
}

// ─── Enriched recommendation (Problem + reason metadata) ─────────────────────

export interface RecommendedProblem extends Problem {
  /** Why this problem was recommended */
  reason: string;
  /** Weakness level of the matched topic (carried from WeakTopic) */
  topic_weakness: 'high' | 'medium';
}

// ─── Inputs the strategy receives ────────────────────────────────────────────

export interface RecommendationInput {
  userId: string;
  weakTopics: WeakTopic[];
  /** Set of problem_ids the user has already SOLVED — excluded from results */
  solvedProblemIds: Set<string>;
  limit: number;
}

// ─── Strategy Interface ───────────────────────────────────────────────────────
//
// This is the extension point for future AI upgrades.
//
// To swap in an AI model:
//   1. Create a new class that implements RecommendationStrategy.
//   2. Set it as the active strategy in recommendation.service.ts.
//   3. No other file needs to change.

export interface RecommendationStrategy {
  /** Human-readable name (logged for observability) */
  readonly name: string;

  /**
   * Given the pre-computed input context, return an ordered list of
   * recommended problems (already sliced to `input.limit`).
   */
  recommend(input: RecommendationInput): Promise<RecommendedProblem[]>;
}

// ─── API Response ─────────────────────────────────────────────────────────────

export interface RecommendationsResponse {
  status: 'success' | 'error';
  user_id: string;
  strategy: string;
  weak_topic_count: number;
  count: number;
  data: RecommendedProblem[];
}
