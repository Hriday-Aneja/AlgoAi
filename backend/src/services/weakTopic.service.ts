import supabase from '../config/supabase';
import {
  THRESHOLDS,
  TopicStatsRow,
  WeakTopic,
  WeaknessLevel,
} from '../types/weakTopic.types';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Classifies weakness level based on accuracy and average time thresholds.
 *
 * Level: "high"   → accuracy < 40%  OR avg_time > 30 min
 *        "medium" → accuracy < 60%  OR avg_time > 20 min  (and not high)
 */
const classifyWeakness = (
  accuracy: number,
  avgTimeSeconds: number
): WeaknessLevel => {
  const isHighAccuracy = accuracy < THRESHOLDS.ACCURACY_HIGH;
  const isHighTime     = avgTimeSeconds > THRESHOLDS.AVG_TIME_HIGH_SECONDS;

  return isHighAccuracy || isHighTime ? 'high' : 'medium';
};

/**
 * Converts a raw RPC row → a clean WeakTopic DTO.
 * - avg_time is exposed in MINUTES (rounded to 2 dp) for the frontend
 * - topics with null avg_time (no time recorded) are treated as 0
 * - Safely handles missing or invalid data
 */
const toWeakTopic = (row: TopicStatsRow): WeakTopic | null => {
  try {
    // Validate required fields
    if (!row || !row.topic) {
      console.warn('Invalid row data:', row);
      return null;
    }

    const avgTimeSeconds = row.avg_time_seconds ?? 0;
    const accuracy = Math.max(0, Math.min(100, row.accuracy || 0)); // Clamp 0-100

    return {
      topic:           row.topic,
      total_attempted: row.total_attempted ?? 0,
      total_solved:    row.total_solved ?? 0,
      accuracy:        Math.round(accuracy * 100) / 100,
      avg_time:        Math.round((avgTimeSeconds / 60) * 100) / 100,  // → minutes
      weakness_level:  classifyWeakness(accuracy, avgTimeSeconds),
    };
  } catch (err) {
    console.error('Error converting row to WeakTopic:', row, err);
    return null;
  }
};

/**
 * Comparator that sorts weakest topics first.
 *
 * Priority order:
 *   1. weakness_level: "high" before "medium"
 *   2. accuracy ascending (lower accuracy = weaker)
 *   3. avg_time descending (higher time = weaker)
 */
const compareByWeakness = (a: WeakTopic, b: WeakTopic): number => {
  if (a.weakness_level !== b.weakness_level) {
    return a.weakness_level === 'high' ? -1 : 1;
  }
  if (a.accuracy !== b.accuracy) {
    return a.accuracy - b.accuracy;           // ascending
  }
  return b.avg_time - a.avg_time;             // descending
};

// ─── Service ──────────────────────────────────────────────────────────────────

/**
 * Fetches per-topic stats for a user via a PostgreSQL RPC (aggregated server-side),
 * filters to weak topics only, classifies severity, and sorts weakest-first.
 *
 * The heavy GROUP BY + unnest aggregation runs entirely in Postgres —
 * this function only receives the small already-aggregated result set.
 */
export const getWeakTopics = async (userId: string): Promise<WeakTopic[]> => {
  try {
    console.log('[getWeakTopics] Starting for user:', userId);

    // ── 1. Aggregate in the database ──────────────────────────────────────────
    const { data, error } = await supabase.rpc('get_topic_stats', {
      p_user_id: userId,
    });

    if (error) {
      console.error('[getWeakTopics] RPC error:', error.message);
      
      // If RPC function doesn't exist or user has no data, return empty array
      if (
        error.message.includes("function") ||
        error.message.includes("does not exist") ||
        error.message.includes("Could not find") ||
        error.message.includes("relation") ||
        error.message.includes("get_topic_stats") ||
        error.code === "42883" // PostgreSQL: undefined_function
      ) {
        console.warn('[getWeakTopics] RPC function not available, returning empty array');
        return [];
      }
      
      throw new Error(`Database error [getWeakTopics]: ${error.message}`);
    }

    // ── 2. Handle empty data ──────────────────────────────────────────────────
    if (!data || !Array.isArray(data) || data.length === 0) {
      console.log('[getWeakTopics] No data returned from RPC, returning empty array');
      return [];
    }

    const rows = data as TopicStatsRow[];
    console.log('[getWeakTopics] Received rows:', rows.length);

    // ── 3. Filter to weak topics only ─────────────────────────────────────────
    //    A topic is weak if accuracy < 60% OR avg_time > 20 min.
    const weakRows = rows.filter((row) => {
      if (!row || !row.topic) return false;
      
      const avgTimeSeconds = row.avg_time_seconds ?? 0;
      const accuracy = row.accuracy ?? 0;
      
      return (
        accuracy < THRESHOLDS.ACCURACY_WEAK ||
        avgTimeSeconds > THRESHOLDS.AVG_TIME_WEAK_SECONDS
      );
    });

    console.log('[getWeakTopics] Filtered weak rows:', weakRows.length);

    // ── 4. Transform → WeakTopic DTO (safe conversion) ────────────────────────
    const weakTopics = weakRows
      .map(toWeakTopic)
      .filter((topic): topic is WeakTopic => topic !== null); // Remove null conversions

    console.log('[getWeakTopics] Transformed topics:', weakTopics.length);

    // ── 5. Sort weakest first ─────────────────────────────────────────────────
    const sorted = weakTopics.sort(compareByWeakness);
    console.log('[getWeakTopics] Returning', sorted.length, 'weak topics');
    
    return sorted;
  } catch (err) {
    console.error('[getWeakTopics] Caught exception:', err);
    // Return empty array on error instead of crashing
    return [];
  }
};
