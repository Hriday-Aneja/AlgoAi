import supabase from '../config/supabase';
import {
  TopicStatistics,
  ProblemMistake,
  WeakPattern,
  FrequentMistake,
  Suggestion,
  MistakeAnalyysis,
  MistakeAnalysisQuery,
  AIReadyMistakeData,
} from '../types/mistake.types';

const TABLE = 'user_problem_progress';

// ─── Database Row Interfaces (for proper TypeScript typing) ──────────────────

/**
 * Raw row from user_progress table.
 * Used to safely type Supabase query responses.
 */
interface UserProgressRow {
  id: string;
  user_id: string;
  problem_id: string;
  topic: string | string[] | null;
  difficulty: 'easy' | 'medium' | 'hard';
  status: 'solved' | 'attempted';
  time_taken: number | null;
  created_at: string;
  submission_code: string | null;
  submission_output: string | null;
}

// ─── Service Layer - Efficient SQL-Based Analysis ──────────────────────────────
// All queries are optimized to do aggregation at the DB level, not in application.

/**
 * Get topic statistics for a user with a single aggregated query.
 * Avoids N+1 queries and heavy loops.
 * 
 * NOTE: PostgREST doesn't support COUNT(*) in .select(), so we fetch raw rows
 * and aggregate in JavaScript (efficient for reasonable data sizes).
 */
export const getTopicStatistics = async (
  userId: string
): Promise<TopicStatistics[]> => {
  // Query to get all user progress (no aggregation in query - we do it in JS)
  let { data, error } = await supabase
    .from(TABLE)
    .select('topic, status, time_taken')
    .eq('userId', userId)
    .neq('topic', null) as any; // Type assertion needed because Supabase typing is loose

  if (error && error.message.includes('userId')) {
    const fallback = await supabase
      .from(TABLE)
      .select('topic, status, time_taken')
      .eq('user_id', userId)
      .neq('topic', null) as any;

    data = fallback.data;
    error = fallback.error;
  }

  // Type-safe error handling
  if (error) {
    throw new Error(`Database error [getTopicStatistics]: ${error.message}`);
  }

  // Type guard: ensure data is an array
  if (!data || !Array.isArray(data) || data.length === 0) {
    return [];
  }

  // Group by topic and calculate statistics
  const topicMap = new Map<string, TopicStatistics>();

  for (const row of data as Array<{ topic: string | string[] | null; status: string; time_taken: number | null }>) {
    // Safely extract topic (handle array or string)
    const topic = Array.isArray(row.topic) ? row.topic[0] : (row.topic || null);
    if (!topic) continue;

    if (!topicMap.has(topic)) {
      topicMap.set(topic, {
        topic,
        totalAttempts: 0,
        solvedCount: 0,
        attemptedCount: 0,
        solveRate: 0,
        averageTimeTaken: null,
        maxTimeTaken: null,
      });
    }

    const stats = topicMap.get(topic)!;
    
    // Increment total attempts (each row = 1 attempt)
    stats.totalAttempts += 1;
    
    if (row.status === 'solved') {
      stats.solvedCount += 1;
    } else if (row.status === 'attempted') {
      stats.attemptedCount += 1;
    }
  }

  // Convert back to array and calculate rates
  const result = Array.from(topicMap.values());

  for (const stat of result) {
    stat.solveRate =
      stat.totalAttempts > 0
        ? Math.round((stat.solvedCount / stat.totalAttempts) * 100)
        : 0;
  }

  return result;
};

/**
 * Get all failed/attempted problems for a user.
 * Returns only problems with status = 'attempted' (not solved).
 */
export const getFailedProblems = async (userId: string): Promise<ProblemMistake[]> => {
  let { data, error } = await supabase
    .from(TABLE)
    .select('problem_id, topic, difficulty, status, time_taken, created_at')
    .eq('userId', userId)
    .eq('status', 'attempted')
    .order('createdAt', { ascending: false }) as any; // Type assertion for Supabase response

  if (error && error.message.includes('userId')) {
    const fallback = await supabase
      .from(TABLE)
      .select('problem_id, topic, difficulty, status, time_taken, created_at')
      .eq('user_id', userId)
      .eq('status', 'attempted')
      .order('created_at', { ascending: false }) as any;

    data = fallback.data;
    error = fallback.error;
  }

  if (error) {
    throw new Error(`Database error [getFailedProblems]: ${error.message}`);
  }

  if (!data || !Array.isArray(data)) return [];

  return data.map((row: any) => ({
    problemId: row.problem_id,
    topic: Array.isArray(row.topic) ? row.topic[0] : (row.topic || 'unknown'),
    difficulty: row.difficulty,
    status: row.status,
    timeTaken: row.time_taken,
    lastAttempt: row.created_at,
  }));
};

/**
 * Detect weak patterns: topics with low solve rates.
 * Only considers topics with minimum attempts threshold.
 */
export const detectWeakPatterns = async (
  userId: string,
  minAttempts: number = 2
): Promise<WeakPattern[]> => {
  const stats = await getTopicStatistics(userId);

  // Filter: only topics with enough attempts and solve rate < 70%
  const weakTopics = stats
    .filter((s) => s.totalAttempts >= minAttempts && s.solveRate < 70)
    .sort((a, b) => a.solveRate - b.solveRate) // Weakest first
    .slice(0, 5); // Top 5 weak topics

  return weakTopics.map((topic) => ({
    topic: topic.topic,
    solveRate: topic.solveRate,
    totalAttempts: topic.totalAttempts,
    message: `Only ${topic.solveRate}% solve rate on ${capitalizeWords(topic.topic)} (${topic.totalAttempts} attempts)`,
  }));
};

/**
 * Detect high time-taken topics: problems solved but took too long.
 * Compares against average for that difficulty.
 */
export const detectTimeEfficiencyIssues = async (
  userId: string
): Promise<WeakPattern[]> => {
  let { data, error } = await supabase
    .from(TABLE)
    .select(
      `
        topic,
        difficulty,
        time_taken,
        status
      `
    )
    .eq('userId', userId)
    .eq('status', 'solved')
    .gt('timeTaken', 0) as any; // Type assertion for Supabase response

  if (error && error.message.includes('userId')) {
    const fallback = await supabase
      .from(TABLE)
      .select(
        `
          topic,
          difficulty,
          time_taken,
          status
        `
      )
      .eq('user_id', userId)
      .eq('status', 'solved')
      .gt('time_taken', 0) as any;

    data = fallback.data;
    error = fallback.error;
  }

  if (error) {
    throw new Error(`Database error [detectTimeEfficiencyIssues]: ${error.message}`);
  }

  if (!data || !Array.isArray(data) || data.length === 0) return [];

  // Group by topic + difficulty and calculate averages
  const groupMap = new Map<
    string,
    { times: number[]; count: number; difficulty: string }
  >();

  for (const row of data as Array<any>) {
    const topic = Array.isArray(row.topic) ? row.topic[0] : (row.topic || '');
    if (!topic) continue;
    
    const key = `${topic}_${row.difficulty}`;

    if (!groupMap.has(key)) {
      groupMap.set(key, {
        times: [],
        count: 0,
        difficulty: row.difficulty,
      });
    }

    const group = groupMap.get(key)!;
    if (row.time_taken) {
      group.times.push(row.time_taken);
    }
  }

  // Calculate averages and identify slow topics
  const slowTopics: WeakPattern[] = [];

  for (const [key, group] of groupMap.entries()) {
    if (group.times.length === 0) continue;

    const average = group.times.reduce((a, b) => a + b, 0) / group.times.length;
    const [topic] = key.split('_');

    // Thresholds (in seconds) - adjust based on difficulty
    const thresholds: Record<string, number> = {
      easy: 600, // 10 minutes
      medium: 1200, // 20 minutes
      hard: 1800, // 30 minutes
    };

    const threshold = thresholds[group.difficulty] || 1200;

    if (average > threshold) {
      // Topic takes significantly longer than expected
      slowTopics.push({
        topic,
        solveRate: 100, // They do solve it
        totalAttempts: group.count,
        message: `${capitalizeWords(topic)} takes ${formatSeconds(average)} on average (${group.difficulty})`,
      });
    }
  }

  return slowTopics.slice(0, 3); // Top 3 inefficient topics
};

/**
 * Detect repeated failures: problems that appear unsolved after multiple data points.
 * Since the schema stores only latest status, we detect patterns from current state.
 */
export const detectRepeatedFailures = async (userId: string): Promise<FrequentMistake[]> => {
  const failed = await getFailedProblems(userId);

  // If attempted, it's been tried before (multiple rows would be past attempts)
  // Return formatted list
  return failed
    .slice(0, 5) // Top 5 failures
    .map((mistake) => ({
      problemId: mistake.problemId,
      topic: mistake.topic,
      difficulty: mistake.difficulty,
      timeTaken: mistake.timeTaken,
      message: `Struggled with ${formatProblemId(mistake.problemId)} (${mistake.topic})`,
    }));
};

/**
 * Generate actionable suggestions based on analysis.
 * Modular design allows for future AI integration.
 */
export const generateSuggestions = async (userId: string): Promise<Suggestion[]> => {
  const suggestions: Suggestion[] = [];

  // 1. Weak topic suggestions
  const weakPatterns = await detectWeakPatterns(userId, 3);
  for (const pattern of weakPatterns) {
    if (pattern.solveRate < 50) {
      // Critical weakness
      suggestions.push({
        category: 'weak-topic',
        priority: 'high',
        text: `Focus on ${pattern.topic}: only ${pattern.solveRate}% solve rate. Review fundamentals.`,
        action: `practice-${pattern.topic}`,
      });
    } else if (pattern.solveRate < 70) {
      // Moderate weakness
      suggestions.push({
        category: 'weak-topic',
        priority: 'medium',
        text: `Improve ${capitalizeWords(pattern.topic)} (${pattern.solveRate}% solve rate).`,
        action: `practice-${pattern.topic}`,
      });
    }
  }

  // 2. Time efficiency suggestions
  const slowTopics = await detectTimeEfficiencyIssues(userId);
  if (slowTopics.length > 0) {
    suggestions.push({
      category: 'time-efficiency',
      priority: 'high',
      text: `You're solving problems but taking too long. Practice ${slowTopics[0].topic} with time limits.`,
      action: 'optimize-time',
    });
  }

  // 3. Repeated failure suggestions
  const failedProblems = await getFailedProblems(userId);
  if (failedProblems.length >= 5) {
    const failedTopics = new Set(failedProblems.map((f) => f.topic));
    const mostFailedTopic = Array.from(failedTopics)[0]; // First failed topic

    suggestions.push({
      category: 'repeated-failure',
      priority: 'high',
      text: `You have ${failedProblems.length} unsolved problems. Start with easy problems in ${mostFailedTopic}.`,
      action: 'review-basics',
    });
  }

  return suggestions;
};

/**
 * Main analysis endpoint: comprehensive mistake pattern report.
 * Aggregates all insights into a single response.
 */
export const analyzeMistakePatterns = async (
  userId: string,
  query?: MistakeAnalysisQuery
): Promise<MistakeAnalyysis> => {
  const minAttempts = query?.minAttempts ?? 1;

  // Parallel queries (non-dependent)
  const [weakPatterns, frequentMistakes, suggestions, stats] = await Promise.all([
    detectWeakPatterns(userId, minAttempts),
    detectRepeatedFailures(userId),
    generateSuggestions(userId),
    getTopicStatistics(userId),
  ]);

  // Calculate overall summary
  const totalProblems = stats.reduce((sum, s) => sum + s.totalAttempts, 0);
  const solvedCount = stats.reduce((sum, s) => sum + s.solvedCount, 0);
  const attemptedCount = stats.reduce((sum, s) => sum + s.attemptedCount, 0);
  const overallSolveRate =
    totalProblems > 0 ? Math.round((solvedCount / totalProblems) * 100) : 0;

  return {
    userId,
    analysisDate: new Date().toISOString(),
    weakPatterns,
    frequentMistakes,
    suggestions,
    summary: {
      totalProblems,
      solvedCount,
      attemptedCount,
      overallSolveRate,
    },
  };
};

/**
 * Generate AI-ready structured data for ML/LLM integration.
 * Format is designed to be stable across future upgrades.
 */
export const getAIReadyMistakeData = async (userId: string): Promise<AIReadyMistakeData> => {
  const stats = await getTopicStatistics(userId);
  const failedProblems = await getFailedProblems(userId);

  // Extract unique topics with low solve rates
  const weakTopics = stats
    .filter((s) => s.solveRate < 70)
    .map((s) => s.topic);

  return {
    userId,
    timestamp: new Date().toISOString(),
    metrics: {
      topicPerformance: stats.map((s) => ({
        topic: s.topic,
        solveRate: s.solveRate,
        difficulty: 'mixed', // Could be enhanced with weighted difficulty
        historicalTrend: 0, // Placeholder for trend analysis
      })),
      timingAnalysis: stats
        .filter((s) => s.averageTimeTaken !== null)
        .map((s) => ({
          topic: s.topic,
          averageTime: s.averageTimeTaken!,
          threshold: estimateThreshold(s.topic),
          efficiency: s.averageTimeTaken! > 0 ? 100 / (s.averageTimeTaken! / 60) : 0,
        })),
      errorPatterns: failedProblems.map((f) => ({
        problemId: f.problemId,
        failureCount: 1, // Would be enhanced with historical data
        timeSinceFirstAttempt: Date.now() - new Date(f.lastAttempt).getTime(),
        lastAttemptTime: f.timeTaken || 0,
      })),
    },
    context: {
      userLevel: inferUserLevel(stats),
      learningPace: 'normal', // Could be calculated from timestamp patterns
      focusAreas: weakTopics,
    },
  };
};

// ─── Helper Functions ──────────────────────────────────────────────────────────

/**
 * Helper: Estimate time threshold for a topic (simple heuristic).
 * In production, this could come from database of norms.
 */
function estimateThreshold(topic: string): number {
  // Average expected time (seconds) by topic
  const thresholds: Record<string, number> = {
    arrays: 900, // 15 min
    'hash-map': 1200, // 20 min
    strings: 1200, // 20 min
    'linked-list': 1500, // 25 min
    trees: 1800, // 30 min
    graphs: 2400, // 40 min
  };
  return thresholds[topic] || 1200;
}

/**
 * Infer user skill level based on solve rates.
 */
function inferUserLevel(
  stats: TopicStatistics[]
): 'beginner' | 'intermediate' | 'advanced' {
  if (stats.length === 0) return 'beginner';

  const averageSolveRate = stats.reduce((sum, s) => sum + s.solveRate, 0) / stats.length;

  if (averageSolveRate >= 80) return 'advanced';
  if (averageSolveRate >= 60) return 'intermediate';
  return 'beginner';
}

/**
 * Format problem ID to human-readable format.
 * e.g., "two-sum" → "Two Sum"
 */
function formatProblemId(id: string): string {
  return id
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Capitalize words in a topic.
 * e.g., "hash-map" → "Hash Map"
 */
function capitalizeWords(text: string): string {
  return text
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Format seconds into human-readable time.
 * e.g., 3661 → "1h 1m 1s"
 */
function formatSeconds(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);

  const parts: string[] = [];
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (seconds > 0 || parts.length === 0) parts.push(`${seconds}s`);

  return parts.join(' ');
}
