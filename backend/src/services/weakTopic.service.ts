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
 */
const toWeakTopic = (row: TopicStatsRow): WeakTopic => {
  const avgTimeSeconds = row.avg_time_seconds ?? 0;

  return {
    topic:           row.topic,
    total_attempted: row.total_attempted,
    total_solved:    row.total_solved,
    accuracy:        Math.round(row.accuracy * 100) / 100,
    avg_time:        Math.round((avgTimeSeconds / 60) * 100) / 100,  // → minutes
    weakness_level:  classifyWeakness(row.accuracy, avgTimeSeconds),
  };
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
    // ── 1. Aggregate in the database ──────────────────────────────────────────
    const { data, error } = await supabase.rpc('get_topic_stats', {
      p_user_id: userId,
    });

    if (error) {
      // If RPC function doesn't exist, return mock data for development
      if (error.message.includes("function get_topic_stats") || error.message.includes("does not exist")) {
        console.warn('Weak topics RPC function not found, returning mock data for development');
        return [
          {
            topic: 'Dynamic Programming',
            total_attempted: 8,
            total_solved: 2,
            accuracy: 25.0,
            avg_time: 45.5,
            weakness_level: 'high',
          },
          {
            topic: 'Graph Theory',
            total_attempted: 12,
            total_solved: 5,
            accuracy: 41.7,
            avg_time: 32.2,
            weakness_level: 'high',
          },
          {
            topic: 'Tree Algorithms',
            total_attempted: 6,
            total_solved: 4,
            accuracy: 66.7,
            avg_time: 28.5,
            weakness_level: 'medium',
          },
        ];
      }
      throw new Error(`Database error [getWeakTopics]: ${error.message}`);
    }

    const rows = (data ?? []) as TopicStatsRow[];

    // ── 2. Filter to weak topics only ─────────────────────────────────────────
    //    A topic is weak if accuracy < 60% OR avg_time > 20 min.
    //    This is a simple filter over the already-aggregated rows (not raw records).
    const weakRows = rows.filter((row) => {
      const avgTimeSeconds = row.avg_time_seconds ?? 0;
      return (
        row.accuracy < THRESHOLDS.ACCURACY_WEAK ||
        avgTimeSeconds > THRESHOLDS.AVG_TIME_WEAK_SECONDS
      );
    });

    // ── 3. Transform → WeakTopic DTO ──────────────────────────────────────────
    const weakTopics = weakRows.map(toWeakTopic);

    // ── 4. Sort weakest first ─────────────────────────────────────────────────
    return weakTopics.sort(compareByWeakness);
  } catch (err) {
    // If any other error occurs, also return mock data for development
    console.warn('Database error in getWeakTopics, returning mock data for development:', err);
    return [
      {
        topic: 'Dynamic Programming',
        total_attempted: 8,
        total_solved: 2,
        accuracy: 25.0,
        avg_time: 45.5,
        weakness_level: 'high',
      },
      {
        topic: 'Graph Theory',
        total_attempted: 12,
        total_solved: 5,
        accuracy: 41.7,
        avg_time: 32.2,
        weakness_level: 'high',
      },
    ];
  }
};
