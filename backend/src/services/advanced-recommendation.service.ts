import supabase from '../config/supabase';
import { prisma } from '../config/database';
import { getProblemsByTopics } from '../repositories/problem.repository';
import {
  UserProgressRecord,
  TopicPerformance,
  TopicWeakness,
  RecommendedProblem,
  RecommendationResponse,
  EXPECTED_TIME_MINUTES,
  DIFFICULTY_WEIGHTS,
  WEAKNESS_THRESHOLDS,
} from '../types/advanced-recommendation.types';
import { Difficulty } from '../types/progress.types';

// ─── Database Query Functions ───────────────────────────────────────────────

/**
 * Fetches user progress records from database with attempts count
 */
export const getUserProgressRecords = async (userId: string): Promise<UserProgressRecord[]> => {
  try {
    const prismaRecords = await prisma.userProblemProgress.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
    });

    if (prismaRecords && prismaRecords.length > 0) {
      return prismaRecords.map((record) => ({
        user_id: record.userId,
        problem_id: record.problemId,
        topic: Array.isArray(record.topic) ? record.topic[0] : record.topic,
        difficulty: record.difficulty,
        status: record.status,
        attempts_count: record.status === 'attempted' ? 3 : 1,
        time_taken: record.timeTaken ? Math.round(record.timeTaken / 60) : 0,
        created_at: record.createdAt instanceof Date ? record.createdAt.toISOString() : record.createdAt,
      }));
    }

    let { data: progressData, error: progressError } = await supabase
      .from('user_problem_progress')
      .select('*')
      .eq('userId', userId)
      .order('createdAt', { ascending: false });

    if (progressError && progressError.message.includes('userId')) {
      const fallback = await supabase
        .from('user_problem_progress')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      progressData = fallback.data;
      progressError = fallback.error;
    }

    if (progressError) {
      console.warn('Progress query failed, returning empty progress:', progressError.message);
      return [];
    }

    if (!progressData || progressData.length === 0) {
      return [];
    }

    return progressData.map((record: any) => ({
      user_id: record.user_id ?? record.userId,
      problem_id: record.problem_id ?? record.problemId,
      topic: Array.isArray(record.topic) ? record.topic[0] : record.topic,
      difficulty: record.difficulty,
      status: record.status,
      attempts_count: record.status === 'attempted' ? 3 : 1,
      time_taken: record.time_taken ?? record.timeTaken ? Math.round((record.time_taken ?? record.timeTaken) / 60) : 0,
      created_at: record.created_at ?? record.createdAt,
    }));
  } catch (error) {
    console.error('Error fetching user progress:', error);
    return [];
  }
};

/**
 * Fetches available problems for a topic and difficulty
 */
export const getAvailableProblems = async (
  topic: string,
  difficulty: Difficulty,
  excludeSolved: string[]
): Promise<RecommendedProblem[]> => {
  try {
    // Get problems from the repository
    const allProblems = getProblemsByTopics([topic]);

    // Filter by difficulty and exclude solved problems
    return allProblems
      .filter(p => p.difficulty === difficulty && !excludeSolved.includes(p.id))
      .map(p => ({
        id: p.id,
        title: p.title,
        difficulty: p.difficulty,
        topic: p.topic,
      }))
      .slice(0, 10); // Limit to 10 problems
  } catch (error) {
    console.error('Error fetching problems:', error);
    return [];
  }
};

/**
 * Mock data for development when database is not available
 */
const getMockProgressData = (userId: string): UserProgressRecord[] => [
  {
    user_id: userId,
    problem_id: 'two-sum',
    topic: 'arrays',
    difficulty: 'easy',
    status: 'solved',
    attempts_count: 2,
    time_taken: 15,
    created_at: '2024-01-15T10:00:00Z',
  },
  {
    user_id: userId,
    problem_id: 'linked-list-cycle',
    topic: 'linked_list',
    difficulty: 'medium',
    status: 'attempted',
    attempts_count: 5,
    time_taken: 45,
    created_at: '2024-01-14T10:00:00Z',
  },
  {
    user_id: userId,
    problem_id: 'binary-tree-max-path',
    topic: 'binary_tree',
    difficulty: 'hard',
    status: 'attempted',
    attempts_count: 8,
    time_taken: 60,
    created_at: '2024-01-13T10:00:00Z',
  },
];

// ─── Weakness Calculation Functions ──────────────────────────────────────────

/**
 * Groups user progress by topic and calculates performance metrics
 */
export const calculateTopicPerformance = (progress: UserProgressRecord[]): TopicPerformance[] => {
  const topicMap = new Map<string, TopicPerformance>();

  // Group by topic
  progress.forEach(record => {
    const topic = record.topic;
    if (!topicMap.has(topic)) {
      topicMap.set(topic, {
        topic,
        total_attempted: 0,
        total_solved: 0,
        total_attempts: 0,
        total_time: 0,
        problem_count: 0,
        recent_weakness: false,
      });
    }

    const topicPerf = topicMap.get(topic)!;
    topicPerf.total_attempted += 1;
    topicPerf.total_attempts += record.attempts_count;
    topicPerf.total_time += record.time_taken;
    topicPerf.problem_count += 1;

    if (record.status === 'solved') {
      topicPerf.total_solved += 1;
    }

    // Check if weakness is recent (within last 7 days)
    const recordDate = new Date(record.created_at);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    if (recordDate > weekAgo && record.status === 'attempted') {
      topicPerf.recent_weakness = true;
    }
  });

  return Array.from(topicMap.values());
};

/**
 * Calculates weakness score for a topic using the specified formula
 * Note: This is a simplified version since we don't have per-difficulty data
 */
export const calculateWeakness = (performance: TopicPerformance): TopicWeakness => {
  const { topic, total_attempted, total_solved, total_attempts, total_time, problem_count } = performance;

  // Avoid division by zero
  if (total_attempted === 0) {
    return {
      topic,
      weakness_score: 0,
      accuracy_score: 0,
      time_score: 0,
      attempts_score: 0,
      difficulty_weight: 0,
      reason: 'No attempts yet',
      recommended_difficulty: 'easy',
    };
  }

  // Calculate accuracy score: (attempted - solved) / attempted
  const accuracy_score = (total_attempted - total_solved) / total_attempted;

  // Calculate average time score using overall expected time
  const avg_time = total_time / problem_count;
  const expected_time = (EXPECTED_TIME_MINUTES.easy + EXPECTED_TIME_MINUTES.medium + EXPECTED_TIME_MINUTES.hard) / 3;
  const time_score = Math.max(0, Math.min(2, avg_time / expected_time)); // Cap at 2x expected

  // Calculate attempts score: average((attempts_count - 1) / 3)
  const attempts_score = Math.max(0, (total_attempts / problem_count - 1) / 3);

  // Calculate difficulty weight (simplified - using average difficulty)
  const difficulty_weight = (DIFFICULTY_WEIGHTS.easy + DIFFICULTY_WEIGHTS.medium + DIFFICULTY_WEIGHTS.hard) / 3;

  // Final weakness formula
  const weakness_score = Math.min(1, Math.max(0,
    0.4 * accuracy_score +
    0.2 * time_score +
    0.2 * attempts_score +
    0.2 * difficulty_weight
  ));

  // Determine recommended difficulty based on weakness
  let recommended_difficulty: Difficulty;
  if (weakness_score > WEAKNESS_THRESHOLDS.HIGH) {
    recommended_difficulty = 'easy';
  } else if (weakness_score > WEAKNESS_THRESHOLDS.MEDIUM) {
    recommended_difficulty = 'medium';
  } else {
    recommended_difficulty = 'hard';
  }

  // Generate reason
  const reasons = [];
  if (accuracy_score > 0.3) reasons.push('Low success rate');
  if (time_score > 1.2) reasons.push('Taking too long');
  if (attempts_score > 0.5) reasons.push('Multiple attempts needed');
  if (performance.recent_weakness) reasons.push('Recent struggles');

  const reason = reasons.length > 0 ? reasons.join(' + ') : 'General improvement needed';

  return {
    topic,
    weakness_score: Math.round(weakness_score * 100) / 100,
    accuracy_score: Math.round(accuracy_score * 100) / 100,
    time_score: Math.round(time_score * 100) / 100,
    attempts_score: Math.round(attempts_score * 100) / 100,
    difficulty_weight: Math.round(difficulty_weight * 100) / 100,
    reason,
    recommended_difficulty,
  };
};

/**
 * Ranks topics by weakness score (descending) and returns top weak topics
 */
export const getWeakTopics = (topicWeaknesses: TopicWeakness[]): TopicWeakness[] => {
  return topicWeaknesses
    .filter(tw => tw.weakness_score > 0)
    .sort((a, b) => b.weakness_score - a.weakness_score);
};

/**
 * Selects a topic using weighted random selection based on weakness scores
 */
export const pickTopicWeighted = (weakTopics: TopicWeakness[]): TopicWeakness | null => {
  if (weakTopics.length === 0) return null;

  // Calculate total weight (sum of weakness scores)
  const totalWeight = weakTopics.reduce((sum, topic) => sum + topic.weakness_score, 0);

  // Generate random number between 0 and totalWeight
  const random = Math.random() * totalWeight;

  // Find the topic that corresponds to this random value
  let cumulativeWeight = 0;
  for (const topic of weakTopics) {
    cumulativeWeight += topic.weakness_score;
    if (random <= cumulativeWeight) {
      return topic;
    }
  }

  // Fallback to first topic
  return weakTopics[0];
};

/**
 * Gets recommended problems for a selected topic
 */
export const getRecommendedProblems = async (
  selectedTopic: TopicWeakness,
  solvedProblemIds: string[]
): Promise<RecommendedProblem[]> => {
  const problems = await getAvailableProblems(
    selectedTopic.topic,
    selectedTopic.recommended_difficulty,
    solvedProblemIds
  );

  // Return 5-10 problems, prioritizing variety
  return problems.slice(0, Math.min(10, Math.max(5, problems.length)));
};

// ─── Main Recommendation Function ────────────────────────────────────────────

/**
 * Main function that orchestrates the recommendation process
 */
export const generateRecommendations = async (userId: string): Promise<RecommendationResponse | null> => {
  // 1. Get user progress data
  const progressRecords = await getUserProgressRecords(userId);

  if (progressRecords.length === 0) {
    return null; // No data to base recommendations on
  }

  // 2. Calculate topic performance
  const topicPerformances = calculateTopicPerformance(progressRecords);

  // 3. Calculate weakness for each topic
  const topicWeaknesses = topicPerformances.map(calculateWeakness);

  // 4. Get weak topics ranked by weakness score
  const weakTopics = getWeakTopics(topicWeaknesses);

  if (weakTopics.length === 0) {
    return null; // No weak topics found
  }

  // 5. Pick topic using weighted random selection
  const selectedTopic = pickTopicWeighted(weakTopics);

  if (!selectedTopic) {
    return null;
  }

  // 6. Get solved problem IDs to exclude
  const solvedProblemIds = progressRecords
    .filter(r => r.status === 'solved')
    .map(r => r.problem_id);

  // 7. Get recommended problems
  const problems = await getRecommendedProblems(selectedTopic, solvedProblemIds);

  return {
    recommended_topic: selectedTopic.topic,
    weakness_score: selectedTopic.weakness_score,
    reason: selectedTopic.reason,
    problems,
  };
};