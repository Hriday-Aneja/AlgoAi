export interface OnboardingInput {
  level: string;
  goals: string;
  topics: string[];
  testScore?: number;
}

export interface RoadmapDay {
  day: number;
  topic: string;
  problems: string[];
  difficulty: string;
}

export interface OnboardingResponse {
  success: true;
  roadmap: RoadmapDay[];
}

export interface CompleteDayInput {
  day: number;
}
