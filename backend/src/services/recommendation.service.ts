import { getWeakTopics }       from './weakTopic.service';
import { getProgressByUser }   from './progress.service';
import { LocalRecommendationStrategy } from '../strategies/local.strategy';
import {
  RecommendationStrategy,
  RecommendedProblem,
} from '../types/recommendation.types';

// ─── Active Strategy ──────────────────────────────────────────────────────────
//
// Swap this single line to change the entire recommendation engine:
//
//   import { AIRecommendationStrategy }    from '../strategies/ai.strategy';
//   const activeStrategy: RecommendationStrategy = new AIRecommendationStrategy();

const activeStrategy: RecommendationStrategy = new LocalRecommendationStrategy();

// ─── Config ───────────────────────────────────────────────────────────────────

const DEFAULT_LIMIT = 10;

// ─── Service ──────────────────────────────────────────────────────────────────

/**
 * Orchestrates the recommendation pipeline:
 *   1. Fetch weak topics for the user (from the DB via Supabase RPC)
 *   2. Collect solved problem IDs (to avoid recommending mastered problems)
 *   3. Delegate problem selection + ranking to the active strategy
 *
 * The orchestrator is strategy-agnostic — it only prepares the shared
 * RecommendationInput context and passes it down.
 */
export const getRecommendations = async (
  userId: string,
  limit: number = DEFAULT_LIMIT
): Promise<{ recommendations: RecommendedProblem[]; strategyName: string; weakTopicCount: number }> => {
  // ── 1. Fetch weak topics ───────────────────────────────────────────────────
  const weakTopics = await getWeakTopics(userId);

  // Early exit — no weak topics means nothing to recommend
  if (weakTopics.length === 0) {
    return {
      recommendations: [],
      strategyName:    activeStrategy.name,
      weakTopicCount:  0,
    };
  }

  // ── 2. Build solved problem ID set (O(1) lookups in strategy) ─────────────
  const progressRecords  = await getProgressByUser(userId);
  const solvedProblemIds = new Set(
    progressRecords
      .filter((r) => r.status === 'solved')
      .map((r)    => r.problem_id)
  );

  // ── 3. Delegate to active strategy ────────────────────────────────────────
  console.log(`[Recommendations] strategy="${activeStrategy.name}" user="${userId}" weakTopics=${weakTopics.length}`);

  const recommendations = await activeStrategy.recommend({
    userId,
    weakTopics,
    solvedProblemIds,
    limit,
  });

  return {
    recommendations,
    strategyName:   activeStrategy.name,
    weakTopicCount: weakTopics.length,
  };
};
