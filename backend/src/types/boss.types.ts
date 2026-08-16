export interface BossProblem {
  id: string;
  title: string;
  topic: string;
  difficulty: 'easy' | 'medium' | 'hard';
  description: string;
  starterCode?: string | null;
  examples?: unknown;
  constraints?: unknown;
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
  xpGained: number;
}