import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types/express';
import {
  startInterview as startInterviewService,
  sendInterviewMessage as sendInterviewMessageService,
  getInterviewFeedback as getInterviewFeedbackService,
} from '../services/interview.service';
import { getRandomProblemForInterview } from '../repositories/problem.repository';
import {
  InterviewPersonality,
  InterviewerInfo,
  InterviewProblemContext,
  ProblemExample,
  ConversationMessage,
} from '../types/interview.types';

const PERSONALITY_NAMES: Record<InterviewPersonality, string> = {
  strict: 'Akash Das',
  friendly: 'Anshu Kumar',
  pressure: 'Hriday Aneja',
};

const isPersonality = (value: unknown): value is InterviewPersonality =>
  value === 'strict' || value === 'friendly' || value === 'pressure';

const toInterviewer = (personality: unknown): InterviewerInfo | null => {
  if (!isPersonality(personality)) return null;
  return {
    name: PERSONALITY_NAMES[personality],
    personality,
  };
};

const normalizeConstraints = (value: unknown): string[] | null => {
  if (!value) return null;
  if (Array.isArray(value)) {
    return value.map((item) => (typeof item === 'string' ? item : JSON.stringify(item)));
  }
  if (typeof value === 'string') {
    return value.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  }
  return null;
};

const normalizeExamples = (value: unknown): ProblemExample[] | null => {
  if (!value || !Array.isArray(value)) return null;
  return value.map((item) => {
    const record = (item ?? {}) as Record<string, unknown>;
    return {
      input: typeof record.input === 'string' ? record.input : JSON.stringify(record.input ?? ''),
      output: typeof record.output === 'string' ? record.output : JSON.stringify(record.output ?? ''),
      explanation: typeof record.explanation === 'string' ? record.explanation : null,
    };
  });
};

const toProblemContext = (problem: {
  title: string;
  description: string;
  topic: string;
  difficulty: string;
  constraints: unknown;
  examples: unknown;
}): InterviewProblemContext => ({
  title: problem.title,
  description: problem.description,
  topic: problem.topic,
  difficulty: problem.difficulty,
  constraints: normalizeConstraints(problem.constraints),
  examples: normalizeExamples(problem.examples),
  expectedComplexity: null,
});

export const startInterview = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = req.auth?.userId;

    if (!userId) {
      res.status(401).json({ status: 'error', message: 'Unauthorized.' });
      return;
    }

    const interviewer = toInterviewer(req.body?.personality);
    if (!interviewer) {
      res.status(400).json({
        status: 'error',
        message: 'personality must be one of: strict, friendly, pressure.',
      });
      return;
    }

    const language = typeof req.body?.language === 'string' ? req.body.language : 'javascript';

    const problem = await getRandomProblemForInterview();
    if (!problem) {
      res.status(503).json({
        status: 'error',
        message: 'No problems are available to build an interview from right now.',
      });
      return;
    }

    const problemContext = toProblemContext(problem);
    const maxQuestions = 7;

    const result = await startInterviewService({
      interviewer,
      problem: problemContext,
      language,
      maxQuestions,
    });

    res.status(200).json({
      status: 'success',
      data: {
        interviewer,
        problem: problemContext,
        message: result.message,
        questionNumber: result.questionNumber,
        maxQuestions: result.maxQuestions,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const sendInterviewMessage = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = req.auth?.userId;

    if (!userId) {
      res.status(401).json({ status: 'error', message: 'Unauthorized.' });
      return;
    }

    const interviewer = toInterviewer(req.body?.interviewer?.personality);
    if (!interviewer) {
      res.status(400).json({
        status: 'error',
        message: 'interviewer.personality must be one of: strict, friendly, pressure.',
      });
      return;
    }

    const problem = req.body?.problem as InterviewProblemContext | undefined;
    if (!problem?.title || !problem?.description) {
      res.status(400).json({ status: 'error', message: 'problem context is required.' });
      return;
    }

    const conversation = Array.isArray(req.body?.conversation)
      ? (req.body.conversation as ConversationMessage[])
      : [];

    const userMessage = typeof req.body?.userMessage === 'string' ? req.body.userMessage : '';
    if (!userMessage.trim()) {
      res.status(400).json({ status: 'error', message: 'userMessage is required.' });
      return;
    }

    const userCode = typeof req.body?.userCode === 'string' ? req.body.userCode : null;
    const questionNumber = Number(req.body?.questionNumber) || 1;
    const maxQuestions = Number(req.body?.maxQuestions) || 7;

    const result = await sendInterviewMessageService({
      interviewer,
      problem,
      conversation,
      userMessage,
      userCode,
      questionNumber,
      maxQuestions,
    });

    res.status(200).json({ status: 'success', data: result });
  } catch (error) {
    next(error);
  }
};

export const getInterviewFeedback = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = req.auth?.userId;

    if (!userId) {
      res.status(401).json({ status: 'error', message: 'Unauthorized.' });
      return;
    }

    const interviewer = toInterviewer(req.body?.interviewer?.personality);
    if (!interviewer) {
      res.status(400).json({
        status: 'error',
        message: 'interviewer.personality must be one of: strict, friendly, pressure.',
      });
      return;
    }

    const problem = req.body?.problem as InterviewProblemContext | undefined;
    if (!problem?.title || !problem?.description) {
      res.status(400).json({ status: 'error', message: 'problem context is required.' });
      return;
    }

    const conversation = Array.isArray(req.body?.conversation)
      ? (req.body.conversation as ConversationMessage[])
      : [];

    const scores = {
      correctnessScore: Number(req.body?.correctnessScore) || 0,
      clarityScore: Number(req.body?.clarityScore) || 0,
      speedScore: Number(req.body?.speedScore) || 0,
      communicationScore: Number(req.body?.communicationScore) || 0,
      technicalScore: Number(req.body?.technicalScore) || 0,
      overallScore: Number(req.body?.overallScore) || 0,
    };

    const result = await getInterviewFeedbackService({
      interviewer,
      problem,
      conversation,
      ...scores,
    });

    res.status(200).json({ status: 'success', data: result });
  } catch (error) {
    next(error);
  }
};