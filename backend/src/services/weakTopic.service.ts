import supabase from '../config/supabase';
import { prisma } from '../config/database';
import {
  THRESHOLDS,
  TopicStatsRow,
  WeakTopic,
  WeaknessLevel,
} from '../types/weakTopic.types';

const PROBLEM_PROGRESS_TABLE = 'user_problem_progress';

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

const aggregateTopicStats = (rows: Array<{ topic: string | string[] | null; status: string; time_taken: number | null }>): TopicStatsRow[] => {
  const topicMap = new Map<string, { total_attempted: number; total_solved: number; total_time: number; count: number }>();

  for (const row of rows) {
    const topics = Array.isArray(row.topic) ? row.topic : row.topic ? [row.topic] : [];

    for (const topic of topics) {
      if (!topic) continue;

      const current = topicMap.get(topic) ?? {
        total_attempted: 0,
        total_solved: 0,
        total_time: 0,
        count: 0,
      };

      current.total_attempted += 1;
      if (row.status === 'solved') current.total_solved += 1;
      if (row.time_taken != null) {
        current.total_time += row.time_taken;
        current.count += 1;
      }

      topicMap.set(topic, current);
    }
  }

  return Array.from(topicMap.entries()).map(([topic, stats]) => ({
    topic,
    total_attempted: stats.total_attempted,
    total_solved: stats.total_solved,
    accuracy:
      stats.total_attempted > 0
        ? Math.round((stats.total_solved / stats.total_attempted) * 10000) / 100
        : 0,
    avg_time_seconds:
      stats.count > 0
        ? Math.round((stats.total_time / stats.count) * 100) / 100
        : 0,
  }));
};

const getWeakTopicsFromPrisma = async (userId: string): Promise<WeakTopic[]> => {
  try {
    const rows = await prisma.userProblemProgress.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
    });

    if (!rows || rows.length === 0) {
      return [];
    }

    const aggregated = aggregateTopicStats(
      rows.map((row) => ({
        topic: Array.isArray(row.topic) ? row.topic : row.topic ? row.topic : null,
        status: row.status,
        time_taken: typeof row.timeTaken === 'number' ? row.timeTaken : null,
      }))
    );

    const weakRows = aggregated.filter((row) => {
      const avgTimeSeconds = row.avg_time_seconds ?? 0;
      const accuracy = row.accuracy ?? 0;
      return (
        accuracy < THRESHOLDS.ACCURACY_WEAK ||
        avgTimeSeconds > THRESHOLDS.AVG_TIME_WEAK_SECONDS
      );
    });

    return weakRows
      .map(toWeakTopic)
      .filter((topic): topic is WeakTopic => topic !== null)
      .sort(compareByWeakness);
  } catch (error) {
    console.error('[getWeakTopics] Prisma fallback error:', error);
    return [];
  }
};

export const getWeakTopics = async (userId: string): Promise<WeakTopic[]> => {
  try {
    console.log('[getWeakTopics] Starting for user:', userId);

    const { data, error } = await supabase.rpc('get_topic_stats', {
      p_user_id: userId,
    });

    if (error) {
      console.warn('[getWeakTopics] RPC error, using Prisma fallback:', error.message);
      return getWeakTopicsFromPrisma(userId);
    }

    if (!data || !Array.isArray(data) || data.length === 0) {
      console.log('[getWeakTopics] No data returned from RPC, using Prisma fallback');
      return getWeakTopicsFromPrisma(userId);
    }

    const rows = data as TopicStatsRow[];
    console.log('[getWeakTopics] Received rows:', rows.length);

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

    const weakTopics = weakRows
      .map(toWeakTopic)
      .filter((topic): topic is WeakTopic => topic !== null);

    console.log('[getWeakTopics] Transformed topics:', weakTopics.length);

    const sorted = weakTopics.sort(compareByWeakness);
    console.log('[getWeakTopics] Returning', sorted.length, 'weak topics');
    return sorted;
  } catch (err) {
    console.error('[getWeakTopics] Caught exception:', err);
    return getWeakTopicsFromPrisma(userId);
  }
};
