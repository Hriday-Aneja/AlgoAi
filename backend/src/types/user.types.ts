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
  problemStatus: {
    [problemId: string]: 'solved' | 'attempted' | 'unsolved' | 'bookmarked';
  };
  topicStrengths: {
    [topic: string]: number; // 0-100 score
  };
  dailyStats: DailyStat[];
  weeklyGoal: number;
  monthlyGoal: number;
  attemptedProblems?: string[];
  solvedProblems?: string[];
  submissions?: Array<{ id: string; problemId: string; status: string; createdAt: string }>;
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