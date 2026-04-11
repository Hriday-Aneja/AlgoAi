export interface AIFeedbackInput {
  userId: string;
  weakTopics: string[]; // list of weak topic names
  recentActivity: {
    topic: string;
    solved: boolean;
    timeSpent: number; // in minutes
    difficulty: string;
  }[];
}

export interface AIFeedbackOutput {
  improvementSuggestions: string[];
  studyPlan: {
    topic: string;
    priority: 'high' | 'medium' | 'low';
    recommendedActions: string[];
    estimatedTime: number; // in minutes
  }[];
}