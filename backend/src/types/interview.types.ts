export type InterviewPersonality = 'strict' | 'friendly' | 'pressure';

export interface InterviewerInfo {
  name: string;
  personality: InterviewPersonality;
}

export interface ProblemExample {
  input: string;
  output: string;
  explanation?: string | null;
}

export interface InterviewProblemContext {
  title: string;
  description: string;
  topic?: string | null;
  difficulty?: string | null;
  constraints?: string[] | null;
  examples?: ProblemExample[] | null;
  expectedComplexity?: string | null;
}

export interface ConversationMessage {
  role: 'interviewer' | 'candidate';
  content: string;
}

export interface StartInterviewParams {
  interviewer: InterviewerInfo;
  problem: InterviewProblemContext;
  language: string;
  maxQuestions?: number;
}

export interface StartInterviewResult {
  message: string;
  questionNumber: number;
  maxQuestions: number;
}

export interface SendInterviewMessageParams {
  interviewer: InterviewerInfo;
  problem: InterviewProblemContext;
  conversation: ConversationMessage[];
  userMessage: string;
  userCode?: string | null;
  questionNumber: number;
  maxQuestions: number;
}

export interface InterviewEvaluation {
  correct: boolean;
  correctnessScore: number;
  clarityScore: number;
  technicalScore: number;
  issues: string[];
}

export interface SendInterviewMessageResult {
  evaluation: InterviewEvaluation;
  response: string;
  nextQuestion: string | null;
  shouldContinue: boolean;
  questionNumber: number;
}

export interface GetInterviewFeedbackParams {
  interviewer: InterviewerInfo;
  problem: InterviewProblemContext;
  conversation: ConversationMessage[];
  correctnessScore: number;
  clarityScore: number;
  speedScore: number;
  communicationScore: number;
  technicalScore: number;
  overallScore: number;
}

export interface GetInterviewFeedbackResult {
  strengths: string[];
  weaknesses: string[];
  feedback: string;
}