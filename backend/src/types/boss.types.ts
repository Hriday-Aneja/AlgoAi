// ─── Boss Battle Session ──────────────────────────────────────────────────────

export interface BossSession {
  sessionId: string;
  userId: string;
  problems: {
    problem_id: string;
    topic: string[];
    difficulty: 'easy' | 'medium' | 'hard';
  }[];
  startTime: Date;
  submitted?: boolean;
  result?: BossResult;
}

// ─── Boss Battle Result ───────────────────────────────────────────────────────

export interface BossResult {
  score: number;
  timeTaken: number; // seconds
  rank: 'S' | 'A' | 'B' | 'C' | 'D';
  problemsSolved: number;
  totalProblems: number;
}

// ─── API Request/Response Types ───────────────────────────────────────────────

export interface StartBossBattleRequest {
  userId: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  problemCount?: number;
}

export interface StartBossBattleResponse {
  sessionId: string;
  problems: {
    problem_id: string;
    topic: string[];
    difficulty: string;
  }[];
  startTime: string;
}

export interface SubmitBossBattleRequest {
  sessionId: string;
  answers: {
    problem_id: string;
    solved: boolean;
    timeTaken: number; // seconds
  }[];
}

export interface SubmitBossBattleResponse {
  result: BossResult;
}

export interface GetBossResultResponse {
  status: 'success' | 'error';
  user_id: string;
  data: BossResult | null;
}