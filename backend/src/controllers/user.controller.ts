import { Request, Response } from 'express';
import { getAllProblems } from '../repositories/problem.repository';
import { UserProgress } from '../types/user.types';
import { prisma } from '../config/database';

const parseUserProgressData = (rawData: unknown): UserProgress => {
  if (typeof rawData === 'string') {
    return JSON.parse(rawData) as UserProgress;
  }

  return rawData as unknown as UserProgress;
};

const getWeekStartMonday = (date: Date): Date => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay();
  const diff = (day + 6) % 7; // Monday = 0, Sunday = 6
  d.setDate(d.getDate() - diff);
  return d;
};

// Get user progress
export const getUserProgress = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;

    // Try to get existing progress
    let userProgress = await prisma.userProgress.findUnique({
      where: { userId }
    });

    // If no progress exists, create default
    if (!userProgress) {
      const defaultProgress: UserProgress = {
        userId,
        questionsAttempted: 0,
        questionsSolved: 0,
        currentStreak: 1,
        longestStreak: 1,
        lastLoginDate: new Date().toISOString().split('T')[0],
        totalXp: 0,
        level: 1,
        roadmapProgress: {},
        topicStrengths: {
          'Arrays': 0,
          'Strings': 0,
          'Linked Lists': 0,
          'Stacks': 0,
          'Queues': 0,
          'Trees': 0,
          'Graphs': 0,
          'Dynamic Programming': 0,
          'Greedy': 0,
          'Backtracking': 0,
          'Sorting': 0,
          'Searching': 0,
          'Hash Tables': 0,
          'Math': 0,
          'Bit Manipulation': 0
        },
        dailyStats: [],
        weeklyGoal: 7,
        monthlyGoal: 30,
        problemStatus: {},
        attemptedProblems: [],
        solvedProblems: [],
        submissions: [],
        achievements: []
      };

      userProgress = await prisma.userProgress.create({
        data: {
          userId,
          data: JSON.stringify(defaultProgress)
        }
      });
    }

    // Parse the JSON string stored in database
    const parsedProgress = parseUserProgressData(userProgress.data);
    res.json({ 
      success: true,
      progress: parsedProgress 
    });
  } catch (error) {
    console.error('Error getting user progress:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to get user progress' 
    });
  }
};

export const getWeeklyActivity = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    if (!userId) {
      return res.status(401).json({ status: 'error', message: 'Unauthorized' });
    }

    const today = new Date();
    const weekStart = getWeekStartMonday(today);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 7);

    const weekSubmissions = await prisma.submission.findMany({
      where: {
        userId,
        status: 'solved',
        createdAt: {
          gte: weekStart,
          lt: weekEnd,
        },
      },
      select: {
        createdAt: true,
      },
    });

    const orderedDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const counts = orderedDays.reduce<Record<string, number>>((acc, day) => {
      acc[day] = 0;
      return acc;
    }, {} as Record<string, number>);

    weekSubmissions.forEach((submission) => {
      const date = new Date(submission.createdAt);
      const dayIndex = (date.getDay() + 6) % 7;
      const dayLabel = orderedDays[dayIndex] ?? orderedDays[0];
      counts[dayLabel] = (counts[dayLabel] ?? 0) + 1;
    });

    const activity = orderedDays.map((day) => ({ day, solved: counts[day] ?? 0 }));

    res.status(200).json({ success: true, activity });
  } catch (error) {
    console.error('Error getting weekly activity:', error);
    res.status(500).json({ success: false, message: 'Failed to get weekly activity' });
  }
};

// Save user progress
export const saveUserProgress = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { progress } = req.body;

    if (!progress || typeof progress !== 'object') {
      return res.status(400).json({ error: 'Invalid progress data' });
    }

    // Validate required fields
    const requiredFields = ['userId', 'questionsAttempted', 'questionsSolved', 'currentStreak', 'longestStreak', 'lastLoginDate', 'totalXp', 'level'];
    for (const field of requiredFields) {
      if (!(field in progress)) {
        return res.status(400).json({ error: `Missing required field: ${field}` });
      }
    }

    const userProgress = await prisma.userProgress.upsert({
      where: { userId },
      update: {
        data: JSON.stringify(progress),
        updatedAt: new Date()
      },
      create: {
        userId,
        data: JSON.stringify(progress)
      }
    });

    // Parse and return the saved data
    const parsedProgress = parseUserProgressData(userProgress.data);
    res.json({ 
      success: true,
      progress: parsedProgress 
    });
  } catch (error) {
    console.error('Error saving user progress:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to save user progress' 
    });
  }
};

// Update user stats (incremental updates)
export const updateUserStats = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const updates = req.body;

    const userProgress = await prisma.userProgress.findUnique({
      where: { userId }
    });

    if (!userProgress) {
      return res.status(404).json({ error: 'User progress not found' });
    }

    const currentData = parseUserProgressData(userProgress.data);
    const updatedData: any = { ...currentData };

    // Apply updates
    if (updates.questionsAttempted !== undefined) {
      updatedData.questionsAttempted += updates.questionsAttempted;
    }
    if (updates.questionsSolved !== undefined) {
      updatedData.questionsSolved += updates.questionsSolved;
    }
    if (updates.xpGained !== undefined) {
      updatedData.totalXp += updates.xpGained;
      updatedData.level = Math.floor(updatedData.totalXp / 100) + 1;
    }
    if (updates.currentStreak !== undefined) {
      updatedData.currentStreak = updates.currentStreak;
      updatedData.longestStreak = Math.max(updatedData.longestStreak, updates.currentStreak);
    }
    if (updates.lastLoginDate) {
      updatedData.lastLoginDate = updates.lastLoginDate;
    }

    // Update roadmap progress if provided
    if (updates.roadmapProgress) {
      updatedData.roadmapProgress = {
        ...updatedData.roadmapProgress,
        ...updates.roadmapProgress
      };
    }

    // Update topic strengths if provided
    if (updates.topicStrengths) {
      updatedData.topicStrengths = {
        ...updatedData.topicStrengths,
        ...updates.topicStrengths
      };
    }

    // Add daily stats if provided
    if (updates.dailyStats) {
      const today = new Date().toISOString().split('T')[0];
      const existingIndex = updatedData.dailyStats.findIndex((stat: any) => stat.date === today);

      if (existingIndex >= 0) {
        updatedData.dailyStats[existingIndex] = {
          ...updatedData.dailyStats[existingIndex],
          questionsSolved: updatedData.dailyStats[existingIndex].questionsSolved + (updates.dailyStats.questionsSolved || 0),
          xpGained: updatedData.dailyStats[existingIndex].xpGained + (updates.dailyStats.xpGained || 0),
          timeSpent: updatedData.dailyStats[existingIndex].timeSpent + (updates.dailyStats.timeSpent || 0)
        };
      } else {
        updatedData.dailyStats.push({
          date: today,
          questionsSolved: updates.dailyStats.questionsSolved || 0,
          xpGained: updates.dailyStats.xpGained || 0,
          timeSpent: updates.dailyStats.timeSpent || 0
        });
      }

      // Keep only last 30 days
      updatedData.dailyStats = updatedData.dailyStats.slice(-30);
    }

    // Sync attempted/solved problem ids and submission records when provided
    if (updates.attemptedProblems) {
      updatedData.attemptedProblems = Array.from(
        new Set([...(updatedData.attemptedProblems ?? []), ...updates.attemptedProblems])
      );
    }

    if (updates.solvedProblems) {
      updatedData.solvedProblems = Array.from(
        new Set([...(updatedData.solvedProblems ?? []), ...updates.solvedProblems])
      );
    }

    if (updates.submissions) {
      updatedData.submissions = [
        ...(updatedData.submissions ?? []),
        ...updates.submissions,
      ];
    }

    await prisma.userProgress.update({
      where: { userId },
      data: {
        data: JSON.stringify(updatedData),
        updatedAt: new Date()
      }
    });

    res.json({ progress: updatedData });
  } catch (error) {
    console.error('Error updating user stats:', error);
    res.status(500).json({ error: 'Failed to update user stats' });
  }
};

// Get user analytics
export const getUserAnalytics = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;

    const userProgress = await prisma.userProgress.findUnique({
      where: { userId }
    });

    if (!userProgress) {
      return res.status(404).json({ error: 'User progress not found' });
    }

    const data = parseUserProgressData(userProgress.data);

    const progressRecords = await prisma.userProblemProgress.findMany({
      where: { userId },
      select: { problemId: true, status: true },
    });

    const attemptedProblemIds = progressRecords.map((record) => record.problemId);
    const solvedProblemIds = progressRecords
      .filter((record) => record.status === 'solved')
      .map((record) => record.problemId);

    const submissions = await prisma.submission.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: { id: true, problemId: true, status: true, createdAt: true },
    });

    const analytics = {
      totalQuestions: attemptedProblemIds.length,
      solvedQuestions: solvedProblemIds.length,
      attemptedProblems: attemptedProblemIds,
      solvedProblems: solvedProblemIds,
      submissions,
      totalProblems: (await getAllProblems()).length,
      solveRate: attemptedProblemIds.length > 0 ? (solvedProblemIds.length / attemptedProblemIds.length) * 100 : 0,
      currentStreak: data.currentStreak,
      longestStreak: data.longestStreak,
      totalXp: data.totalXp,
      level: data.level,
      completedTopics: Object.values(data.roadmapProgress).filter((p: any) => p.completed).length,
      totalTopics: Object.keys(data.roadmapProgress).length,
      topicStrengths: data.topicStrengths,
      weeklyProgress: data.dailyStats.slice(-7),
      monthlyProgress: data.dailyStats.slice(-30),
      achievements: data.achievements
    };

    res.json({ analytics });
  } catch (error) {
    console.error('Error getting user analytics:', error);
    res.status(500).json({ error: 'Failed to get user analytics' });
  }
};