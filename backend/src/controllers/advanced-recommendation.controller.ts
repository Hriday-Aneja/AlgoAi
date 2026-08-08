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


// ─────────────────────────────────────────────────────────────
// DATABASE QUERY FUNCTIONS
// ─────────────────────────────────────────────────────────────

/**
 * Fetches user progress records from database
 */
export const getUserProgressRecords = async (
  userId: string
): Promise<UserProgressRecord[]> => {
  try {
    console.log('🔍 Fetching progress for user:', userId);

    // First try Prisma
    const prismaRecords = await prisma.userProblemProgress.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
    });

    console.log(
      '📊 Prisma progress records:',
      prismaRecords.length
    );

    if (prismaRecords && prismaRecords.length > 0) {
      return prismaRecords.map(
        (record): UserProgressRecord => ({
          user_id: record.userId,
          problem_id: record.problemId,

          topic: Array.isArray(record.topic)
            ? record.topic[0]
            : record.topic,

          difficulty:
            record.difficulty.toLowerCase() as Difficulty,

          status: record.status as 'solved' | 'attempted',

          attempts_count:
            record.status === 'attempted' ? 3 : 1,

          time_taken: record.timeTaken
            ? Math.round(record.timeTaken / 60)
            : 0,

          created_at:
            record.createdAt instanceof Date
              ? record.createdAt.toISOString()
              : String(record.createdAt),
        })
      );
    }

    // If Prisma has no records, try Supabase
    console.log('🔄 No Prisma records. Trying Supabase...');

    let { data: progressData, error: progressError } =
      await supabase
        .from('user_problem_progress')
        .select('*')
        .eq('userId', userId)
        .order('createdAt', { ascending: false });

    // Fallback for snake_case database columns
    if (
      progressError &&
      progressError.message.includes('userId')
    ) {
      console.log(
        '🔄 Trying snake_case Supabase columns...'
      );

      const fallback = await supabase
        .from('user_problem_progress')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      progressData = fallback.data;
      progressError = fallback.error;
    }

    if (progressError) {
      console.warn(
        '⚠️ Supabase progress query failed:',
        progressError.message
      );

      return [];
    }

    if (!progressData || progressData.length === 0) {
      console.log(
        'ℹ️ No progress found for user:',
        userId
      );

      return [];
    }

    console.log(
      '📊 Supabase progress records:',
      progressData.length
    );

    return progressData.map((record: any) => ({
      user_id:
        record.user_id ?? record.userId,

      problem_id:
        record.problem_id ?? record.problemId,

      topic: Array.isArray(record.topic)
        ? record.topic[0]
        : record.topic,

      difficulty:
        record.difficulty?.toLowerCase() as Difficulty,

      status:
        record.status as 'solved' | 'attempted',

      attempts_count:
        record.status === 'attempted' ? 3 : 1,

      time_taken:
        record.time_taken != null
          ? Math.round(record.time_taken / 60)
          : record.timeTaken != null
          ? Math.round(record.timeTaken / 60)
          : 0,

      created_at:
        record.created_at ?? record.createdAt,
    }));
  } catch (error) {
    console.error(
      '❌ Error fetching user progress:',
      error
    );

    return [];
  }
};


// ─────────────────────────────────────────────────────────────
// AVAILABLE PROBLEMS
// ─────────────────────────────────────────────────────────────

export const getAvailableProblems = async (
  topic: string,
  difficulty: Difficulty,
  excludeSolved: string[]
): Promise<RecommendedProblem[]> => {
  try {
    console.log(
      `🔎 Getting problems for topic=${topic}, difficulty=${difficulty}`
    );

    const allProblems =
      await getProblemsByTopics([topic]);

    return allProblems
      .filter(
        (p) =>
          p.difficulty === difficulty &&
          !excludeSolved.includes(p.id)
      )
      .map((p) => ({
        id: p.id,
        title: p.title,
        difficulty: p.difficulty,
        topic: p.topic,
      }))
      .slice(0, 10);
  } catch (error) {
    console.error(
      '❌ Error fetching available problems:',
      error
    );

    return [];
  }
};


// ─────────────────────────────────────────────────────────────
// MOCK DATA
// ─────────────────────────────────────────────────────────────

const getMockProgressData = (
  userId: string
): UserProgressRecord[] => [
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


// ─────────────────────────────────────────────────────────────
// TOPIC PERFORMANCE
// ─────────────────────────────────────────────────────────────

export const calculateTopicPerformance = (
  progress: UserProgressRecord[]
): TopicPerformance[] => {
  const topicMap =
    new Map<string, TopicPerformance>();

  progress.forEach((record) => {
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

    const topicPerf =
      topicMap.get(topic)!;

    topicPerf.total_attempted += 1;

    topicPerf.total_attempts +=
      record.attempts_count;

    topicPerf.total_time +=
      record.time_taken;

    topicPerf.problem_count += 1;

    if (record.status === 'solved') {
      topicPerf.total_solved += 1;
    }

    // Check if weakness is recent
    const recordDate =
      new Date(record.created_at);

    const weekAgo = new Date();

    weekAgo.setDate(
      weekAgo.getDate() - 7
    );

    if (
      recordDate > weekAgo &&
      record.status === 'attempted'
    ) {
      topicPerf.recent_weakness = true;
    }
  });

  return Array.from(
    topicMap.values()
  );
};


// ─────────────────────────────────────────────────────────────
// WEAKNESS CALCULATION
// ─────────────────────────────────────────────────────────────

export const calculateWeakness = (
  performance: TopicPerformance
): TopicWeakness => {
  const {
    topic,
    total_attempted,
    total_solved,
    total_attempts,
    total_time,
    problem_count,
  } = performance;

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

  // Accuracy
  const accuracy_score =
    (total_attempted - total_solved) /
    total_attempted;

  // Average time
  const avg_time =
    total_time / problem_count;

  const expected_time =
    (
      EXPECTED_TIME_MINUTES.easy +
      EXPECTED_TIME_MINUTES.medium +
      EXPECTED_TIME_MINUTES.hard
    ) / 3;

  const time_score = Math.max(
    0,
    Math.min(
      2,
      avg_time / expected_time
    )
  );

  // Attempts
  const attempts_score = Math.max(
    0,
    (
      total_attempts /
        problem_count -
      1
    ) / 3
  );

  // Difficulty
  const difficulty_weight =
    (
      DIFFICULTY_WEIGHTS.easy +
      DIFFICULTY_WEIGHTS.medium +
      DIFFICULTY_WEIGHTS.hard
    ) / 3;

  // Final weakness score
  const weakness_score =
    Math.min(
      1,
      Math.max(
        0,
        0.4 * accuracy_score +
        0.2 * time_score +
        0.2 * attempts_score +
        0.2 * difficulty_weight
      )
    );

  // Recommended difficulty
  let recommended_difficulty: Difficulty;

  if (
    weakness_score >
    WEAKNESS_THRESHOLDS.HIGH
  ) {
    recommended_difficulty = 'easy';
  } else if (
    weakness_score >
    WEAKNESS_THRESHOLDS.MEDIUM
  ) {
    recommended_difficulty = 'medium';
  } else {
    recommended_difficulty = 'hard';
  }

  // Reasons
  const reasons: string[] = [];

  if (accuracy_score > 0.3) {
    reasons.push('Low success rate');
  }

  if (time_score > 1.2) {
    reasons.push('Taking too long');
  }

  if (attempts_score > 0.5) {
    reasons.push('Multiple attempts needed');
  }

  if (performance.recent_weakness) {
    reasons.push('Recent struggles');
  }

  const reason =
    reasons.length > 0
      ? reasons.join(' + ')
      : 'General improvement needed';

  return {
    topic,

    weakness_score:
      Math.round(
        weakness_score * 100
      ) / 100,

    accuracy_score:
      Math.round(
        accuracy_score * 100
      ) / 100,

    time_score:
      Math.round(
        time_score * 100
      ) / 100,

    attempts_score:
      Math.round(
        attempts_score * 100
      ) / 100,

    difficulty_weight:
      Math.round(
        difficulty_weight * 100
      ) / 100,

    reason,

    recommended_difficulty,
  };
};


// ─────────────────────────────────────────────────────────────
// WEAK TOPICS
// ─────────────────────────────────────────────────────────────

export const getWeakTopics = (
  topicWeaknesses: TopicWeakness[]
): TopicWeakness[] => {
  return topicWeaknesses
    .filter(
      (tw) =>
        tw.weakness_score > 0
    )
    .sort(
      (a, b) =>
        b.weakness_score -
        a.weakness_score
    );
};


// ─────────────────────────────────────────────────────────────
// WEIGHTED TOPIC SELECTION
// ─────────────────────────────────────────────────────────────

export const pickTopicWeighted = (
  weakTopics: TopicWeakness[]
): TopicWeakness | null => {
  if (weakTopics.length === 0) {
    return null;
  }

  const totalWeight =
    weakTopics.reduce(
      (sum, topic) =>
        sum + topic.weakness_score,
      0
    );

  const random =
    Math.random() * totalWeight;

  let cumulativeWeight = 0;

  for (const topic of weakTopics) {
    cumulativeWeight +=
      topic.weakness_score;

    if (
      random <= cumulativeWeight
    ) {
      return topic;
    }
  }

  return weakTopics[0];
};


// ─────────────────────────────────────────────────────────────
// RECOMMENDED PROBLEMS
// ─────────────────────────────────────────────────────────────

export const getRecommendedProblems =
  async (
    selectedTopic: TopicWeakness,
    solvedProblemIds: string[]
  ): Promise<RecommendedProblem[]> => {
    const problems =
      await getAvailableProblems(
        selectedTopic.topic,
        selectedTopic.recommended_difficulty,
        solvedProblemIds
      );

    return problems.slice(
      0,
      Math.min(
        10,
        Math.max(5, problems.length)
      )
    );
  };


// ─────────────────────────────────────────────────────────────
// MAIN RECOMMENDATION FUNCTION
// ─────────────────────────────────────────────────────────────

export const generateRecommendations =
  async (
    userId: string
  ): Promise<RecommendationResponse | null> => {

    console.log(
      '🧠 Generating recommendations for:',
      userId
    );

    // 1. Get progress
    const progressRecords =
      await getUserProgressRecords(
        userId
      );

    console.log(
      '📊 Progress records found:',
      progressRecords.length
    );

    // No progress is NOT an error
    if (
      progressRecords.length === 0
    ) {
      console.log(
        'ℹ️ User has no progress yet'
      );

      return null;
    }

    // 2. Calculate performance
    const topicPerformances =
      calculateTopicPerformance(
        progressRecords
      );

    console.log(
      '📈 Topic performances:',
      topicPerformances
    );

    // 3. Calculate weakness
    const topicWeaknesses =
      topicPerformances.map(
        calculateWeakness
      );

    console.log(
      '⚠️ Topic weaknesses:',
      topicWeaknesses
    );

    // 4. Get weak topics
    const weakTopics =
      getWeakTopics(
        topicWeaknesses
      );

    console.log(
      '🎯 Weak topics:',
      weakTopics
    );

    if (
      weakTopics.length === 0
    ) {
      console.log(
        'ℹ️ No weak topics found'
      );

      return null;
    }

    // 5. Select topic
    const selectedTopic =
      pickTopicWeighted(
        weakTopics
      );

    if (!selectedTopic) {
      return null;
    }

    console.log(
      '🎯 Selected topic:',
      selectedTopic.topic
    );

    // 6. Solved problems
    const solvedProblemIds =
      progressRecords
        .filter(
          (r) =>
            r.status === 'solved'
        )
        .map(
          (r) =>
            r.problem_id
        );

    // 7. Get recommendations
    const problems =
      await getRecommendedProblems(
        selectedTopic,
        solvedProblemIds
      );

    console.log(
      '💡 Recommended problems:',
      problems.length
    );

    return {
      recommended_topic:
        selectedTopic.topic,

      weakness_score:
        selectedTopic.weakness_score,

      reason:
        selectedTopic.reason,

      problems,
    };
  };


// ─────────────────────────────────────────────────────────────
// API CONTROLLER
// ─────────────────────────────────────────────────────────────

import { Request, Response } from 'express';

export const getAdvancedRecommendations =
  async (
    req: Request,
    res: Response
  ) => {

    try {
      const { userId } =
        req.params;

      console.log(
        '🚀 Advanced recommendations request:',
        userId
      );

      const recommendations =
        await generateRecommendations(
          userId
        );

      // IMPORTANT:
      // No progress is a normal situation,
      // NOT a 404 API error.
      if (!recommendations) {
        return res.status(200).json({
          success: true,

          data: {
            recommended_topic: null,

            weakness_score: 0,

            reason:
              'Solve some problems to get personalized recommendations.',

            problems: [],
          },
        });
      }

      return res.status(200).json({
        success: true,
        data: recommendations,
      });

    } catch (error) {

      console.error(
        '❌ Advanced recommendation error:',
        error
      );

      return res.status(500).json({
        success: false,
        message:
          'Internal server error',
      });
    }
  };