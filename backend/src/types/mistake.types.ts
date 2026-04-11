// ─── Database Row (mirrors queries) ──────────────────────────────────────────

export interface FailedAttempt {
  problem_id: string;
  topic: string;
  difficulty: 'easy' | 'medium' | 'hard';
  status: 'solved' | 'attempted';
}

export interface TopicStatistics {
  topic: string;
  totalAttempts: number;
  solvedCount: number;
  attemptedCount: number;
  solveRate: number; // 0-100
  averageTimeTaken: number | null; // seconds
  maxTimeTaken: number | null;
}

export interface ProblemMistake {
  problemId: string;
  topic: string;
  difficulty: 'easy' | 'medium' | 'hard';
  status: 'solved' | 'attempted';
  timeTaken: number | null;
  lastAttempt: string; // ISO timestamp
}

// ─── Response Shapes ──────────────────────────────────────────────────────────

export interface WeakPattern {
  topic: string;
  solveRate: number; // Percentage
  totalAttempts: number;
  message: string; // e.g., "Only 40% solve rate on Arrays"
}

export interface FrequentMistake {
  problemId: string;
  topic: string;
  difficulty: 'easy' | 'medium' | 'hard';
  timeTaken: number | null;
  message: string; // e.g., "Struggled with Two Sum despite multiple attempts"
}

export interface Suggestion {
  category: 'weak-topic' | 'time-efficiency' | 'repeated-failure';
  priority: 'high' | 'medium' | 'low'; // high = affects more problems
  text: string;
  action?: string; // e.g., "practice-arrays", "optimize-time"
}

export interface MistakeAnalyysis {
  userId: string;
  analysisDate: string; // ISO timestamp
  weakPatterns: WeakPattern[];
  frequentMistakes: FrequentMistake[];
  suggestions: Suggestion[];
  summary: {
    totalProblems: number;
    solvedCount: number;
    attemptedCount: number;
    overallSolveRate: number; // 0-100
  };
}

// ─── Request Bodies ───────────────────────────────────────────────────────────

export interface MistakeAnalysisQuery {
  topicFilter?: string; // Optional: analyze specific topic only
  minAttempts?: number; // Minimum attempts threshold (default: 1)
}

// ─── Analytics for AI Integration ──────────────────────────────────────────────

/**
 * Structured data format for future AI model integration.
 * Easily extensible for ML/LLM upgrades without breaking existing API.
 */
export interface AIReadyMistakeData {
  userId: string;
  timestamp: string;
  
  // Quantitative metrics
  metrics: {
    topicPerformance: Array<{
      topic: string;
      solveRate: number;
      difficulty: string;
      historicalTrend?: number; // How performance changes over time
    }>;
    timingAnalysis: Array<{
      topic: string;
      averageTime: number;
      threshold: number; // Expected time for this difficulty
      efficiency: number; // ratio: threshold / actual
    }>;
    errorPatterns: Array<{
      problemId: string;
      failureCount: number;
      timeSinceFirstAttempt: number; // seconds
      lastAttemptTime: number;
    }>;
  };
  
  // Qualitative context for AI
  context: {
    userLevel?: 'beginner' | 'intermediate' | 'advanced';
    learningPace?: 'slow' | 'normal' | 'fast';
    focusAreas?: string[];
  };
}
