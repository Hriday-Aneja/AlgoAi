export interface HintRequestPayload {
  problemId: string;
  problemTitle: string;
  problemDescription: string;
  language: string;
  code: string;
}

export interface HintResponse {
  success: boolean;
  hintLevel?: number;
  hint?: string;
  message?: string;
}

export interface StuckAnalysis {
  isStuck: boolean;
  failedAttempts: number;
  elapsedMinutes: number;
}

export interface NextHintContext {
  nextHintLevel: number;
  existingHints: { hintLevel: number; hintText: string }[];
}