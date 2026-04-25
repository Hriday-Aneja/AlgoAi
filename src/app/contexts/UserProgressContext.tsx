import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';

export interface UserProgress {
  userId: string;
  questionsAttempted: number;
  questionsSolved: number;
  currentStreak: number;
  longestStreak: number;
  lastLoginDate: string;
  totalXp: number;
  level: number;
  roadmapProgress: {
    [topicId: string]: {
      completed: boolean;
      score: number;
      attempts: number;
      lastAttempted: string;
    };
  };
  topicStrengths: {
    [topic: string]: number; // 0-100 score
  };
  dailyStats: {
    date: string;
    questionsSolved: number;
    xpGained: number;
    timeSpent: number; // in minutes
  }[];
  weeklyGoal: number;
  monthlyGoal: number;
  achievements: string[];
}

interface UserProgressContextType {
  progress: UserProgress | null;
  updateProgress: (updates: Partial<UserProgress>) => void;
  incrementQuestionsAttempted: () => void;
  incrementQuestionsSolved: (xpGained?: number) => void;
  updateRoadmapProgress: (topicId: string, score: number) => void;
  updateTopicStrength: (topic: string, score: number) => void;
  checkAndUpdateStreak: () => void;
  addDailyStat: (questionsSolved: number, xpGained: number, timeSpent: number) => void;
  saveProgress: () => Promise<void>;
  loadProgress: () => Promise<void>;
  isLoading: boolean;
}

const UserProgressContext = createContext<UserProgressContextType | undefined>(undefined);

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3008/api';

export function UserProgressProvider({ children }: { children: ReactNode }) {
  const [progress, setProgress] = useState<UserProgress | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { user, token } = useAuth();

  // Initialize default progress for new users
  const createDefaultProgress = (userId: string): UserProgress => ({
    userId,
    questionsAttempted: 0,
    questionsSolved: 0,
    currentStreak: 0,
    longestStreak: 0,
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
    weeklyGoal: 7, // 7 questions per week
    monthlyGoal: 30, // 30 questions per month
    achievements: []
  });

  // Load user progress from backend
  const loadProgress = async () => {
    if (!user || !token) return;

    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/user/progress`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setProgress(data.progress);
      } else if (response.status === 404) {
        // User doesn't have progress yet, create default
        const defaultProgress = createDefaultProgress(user.id);
        setProgress(defaultProgress);
        await saveProgressToBackend(defaultProgress);
      }
    } catch (error) {
      console.error('Error loading user progress:', error);
      // Fallback to default progress
      const defaultProgress = createDefaultProgress(user.id);
      setProgress(defaultProgress);
    } finally {
      setIsLoading(false);
    }
  };

  // Save progress to backend
  const saveProgressToBackend = async (progressData: UserProgress) => {
    if (!token) return;

    try {
      await fetch(`${API_BASE_URL}/user/progress`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ progress: progressData })
      });
    } catch (error) {
      console.error('Error saving progress:', error);
    }
  };

  // Update progress and optionally save to backend
  const updateProgress = (updates: Partial<UserProgress>) => {
    setProgress(prev => {
      if (!prev) return null;
      const updated = { ...prev, ...updates };
      // Auto-save after updates (debounced)
      setTimeout(() => saveProgressToBackend(updated), 1000);
      return updated;
    });
  };

  // Increment questions attempted
  const incrementQuestionsAttempted = () => {
    updateProgress({
      questionsAttempted: (progress?.questionsAttempted || 0) + 1
    });
  };

  // Increment questions solved and add XP
  const incrementQuestionsSolved = (xpGained: number = 10) => {
    if (!progress) return;

    const newXp = progress.totalXp + xpGained;
    const newLevel = Math.floor(newXp / 100) + 1; // Level up every 100 XP

    updateProgress({
      questionsSolved: progress.questionsSolved + 1,
      totalXp: newXp,
      level: newLevel
    });
  };

  // Update roadmap progress for a specific topic
  const updateRoadmapProgress = (topicId: string, score: number) => {
    if (!progress) return;

    const currentProgress = progress.roadmapProgress[topicId] || {
      completed: false,
      score: 0,
      attempts: 0,
      lastAttempted: new Date().toISOString()
    };

    const updatedProgress = {
      ...progress.roadmapProgress,
      [topicId]: {
        ...currentProgress,
        score: Math.max(currentProgress.score, score),
        attempts: currentProgress.attempts + 1,
        lastAttempted: new Date().toISOString(),
        completed: score >= 80 // Mark as completed if score >= 80%
      }
    };

    updateProgress({ roadmapProgress: updatedProgress });
  };

  // Update topic strength
  const updateTopicStrength = (topic: string, score: number) => {
    if (!progress) return;

    updateProgress({
      topicStrengths: {
        ...progress.topicStrengths,
        [topic]: Math.min(100, Math.max(0, score))
      }
    });
  };

  // Check and update daily login streak
  const checkAndUpdateStreak = () => {
    if (!progress) return;

    const today = new Date().toISOString().split('T')[0];
    const lastLogin = progress.lastLoginDate;

    if (lastLogin === today) return; // Already logged in today

    const lastLoginDate = new Date(lastLogin);
    const todayDate = new Date(today);
    const diffTime = todayDate.getTime() - lastLoginDate.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    let newStreak = progress.currentStreak;
    if (diffDays === 1) {
      // Consecutive day
      newStreak = progress.currentStreak + 1;
    } else if (diffDays > 1) {
      // Streak broken
      newStreak = 1;
    }

    updateProgress({
      currentStreak: newStreak,
      longestStreak: Math.max(progress.longestStreak, newStreak),
      lastLoginDate: today
    });
  };

  // Add daily statistics
  const addDailyStat = (questionsSolved: number, xpGained: number, timeSpent: number) => {
    if (!progress) return;

    const today = new Date().toISOString().split('T')[0];
    const existingStatIndex = progress.dailyStats.findIndex(stat => stat.date === today);

    if (existingStatIndex >= 0) {
      // Update existing stat
      const updatedStats = [...progress.dailyStats];
      updatedStats[existingStatIndex] = {
        ...updatedStats[existingStatIndex],
        questionsSolved: updatedStats[existingStatIndex].questionsSolved + questionsSolved,
        xpGained: updatedStats[existingStatIndex].xpGained + xpGained,
        timeSpent: updatedStats[existingStatIndex].timeSpent + timeSpent
      };
      updateProgress({ dailyStats: updatedStats });
    } else {
      // Add new stat
      updateProgress({
        dailyStats: [...progress.dailyStats, {
          date: today,
          questionsSolved,
          xpGained,
          timeSpent
        }]
      });
    }
  };

  // Save progress manually
  const saveProgress = async () => {
    if (progress) {
      await saveProgressToBackend(progress);
    }
  };

  // Load progress when user changes
  useEffect(() => {
    if (user && token) {
      loadProgress();
      checkAndUpdateStreak();
    } else {
      setProgress(null);
    }
  }, [user, token]);

  const value: UserProgressContextType = {
    progress,
    updateProgress,
    incrementQuestionsAttempted,
    incrementQuestionsSolved,
    updateRoadmapProgress,
    updateTopicStrength,
    checkAndUpdateStreak,
    addDailyStat,
    saveProgress,
    loadProgress,
    isLoading
  };

  return (
    <UserProgressContext.Provider value={value}>
      {children}
    </UserProgressContext.Provider>
  );
}

export function useUserProgress() {
  const context = useContext(UserProgressContext);
  if (context === undefined) {
    throw new Error('useUserProgress must be used within a UserProgressProvider');
  }
  return context;
}