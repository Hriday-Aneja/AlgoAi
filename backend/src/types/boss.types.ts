// ─── Boss Battle Types ───────────────────────────────────────────────────────

export interface BossProblem {
  id: string;
  title: string;
  topic: string;
  difficulty: 'easy' | 'medium' | 'hard';
  description: string;
  starterCode?: string | null;
  testCases?: Array<{
    input: string;
    output: string;
  }>;
}

export interface BossAssignment {
  id: string;
  dailyBossId: string;
  name: string;
  topic: string;
  difficulty: 'easy' | 'medium' | 'hard';
  hp: number;
  defeated: boolean;
  problem: BossProblem;
}

export interface BossTodayResponse {
  bosses: BossAssignment[];
}

export interface BossSubmitRequest {
  bossAssignmentId: string;
  code: string;
  language: string;
  testOnly?: boolean;
}

export type BossSubmitPayload = Omit<BossSubmitRequest, 'bossAssignmentId'> & { testOnly?: boolean };

export interface BossSubmitResponse {
  passed: boolean;
  testsPassed: number;
  totalTests: number;
  feedback: string;
  hp: number;
  defeated: boolean;
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