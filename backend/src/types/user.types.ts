export interface RoadmapProgress {
  completed: boolean;
  score: number;
  attempts: number;
  lastAttempted: string;
}

export interface DailyStat {
  date: string;
  questionsSolved: number;
  xpGained: number;
  timeSpent: number; // in minutes
}

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
    [topicId: string]: RoadmapProgress;
  };
  topicStrengths: {
    [topic: string]: number; // 0-100 score
  };
  dailyStats: DailyStat[];
  weeklyGoal: number;
  monthlyGoal: number;
  achievements: string[];
}

export interface UserAnalytics {
  totalQuestions: number;
  solvedQuestions: number;
  solveRate: number;
  currentStreak: number;
  longestStreak: number;
  totalXp: number;
  level: number;
  completedTopics: number;
  totalTopics: number;
  topicStrengths: { [topic: string]: number };
  weeklyProgress: DailyStat[];
  monthlyProgress: DailyStat[];
  achievements: string[];
}