export interface OnboardingInput {
  experienceLevel: "beginner" | "intermediate" | "advanced";
  goals: string;
  preferredTopics: string[];
}

export interface RoadmapDay {
  day: number;
  topic: string;
  tasks: string[];
  difficulty: string;
}

export interface OnboardingResponse {
  success: true;
  personalizedRoadmap: RoadmapDay[];
  recommendedTopics: string[];
}

export interface CompleteDayInput {
  day: number;
}
