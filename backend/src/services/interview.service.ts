import {
  StartInterviewParams,
  StartInterviewResult,
  SendInterviewMessageParams,
  SendInterviewMessageResult,
  GetInterviewFeedbackParams,
  GetInterviewFeedbackResult,
} from '../types/interview.types';

type HttpError = Error & { statusCode?: number };

const createHttpError = (statusCode: number, message: string): HttpError => {
  const error = new Error(message) as HttpError;
  error.statusCode = statusCode;
  return error;
};

const getFastApiUrl = (): string => {
  return process.env.FASTAPI_URL || 'http://localhost:8000';
};

const postJson = async <T>(path: string, body: unknown, errorMessage: string): Promise<T> => {
  const fastApiUrl = getFastApiUrl();

  try {
    const response = await fetch(`${fastApiUrl}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorBody = await response.text().catch(() => '');
      throw new Error(
        `FastAPI ${path} responded with status ${response.status}: ${errorBody}`,
      );
    }

    return (await response.json()) as T;
  } catch (error) {
    console.error(`[interview.service] FastAPI ${path} call failed:`, error);
    throw createHttpError(502, errorMessage);
  }
};

export const startInterview = async (
  params: StartInterviewParams,
): Promise<StartInterviewResult> => {
  const result = await postJson<StartInterviewResult>(
    '/interview/start',
    {
      interviewer: params.interviewer,
      problem: params.problem,
      language: params.language,
      maxQuestions: params.maxQuestions ?? 7,
    },
    'Failed to start interview from AI service.',
  );

  if (!result?.message) {
    throw createHttpError(502, 'AI service returned an empty interview opening.');
  }

  return result;
};

export const sendInterviewMessage = async (
  params: SendInterviewMessageParams,
): Promise<SendInterviewMessageResult> => {
  const result = await postJson<SendInterviewMessageResult>(
    '/interview/message',
    {
      interviewer: params.interviewer,
      problem: params.problem,
      conversation: params.conversation,
      userMessage: params.userMessage,
      userCode: params.userCode ?? null,
      questionNumber: params.questionNumber,
      maxQuestions: params.maxQuestions,
    },
    'Failed to send interview message to AI service.',
  );

  if (!result?.response) {
    throw createHttpError(502, 'AI service returned an empty interview response.');
  }

  return result;
};

export const getInterviewFeedback = async (
  params: GetInterviewFeedbackParams,
): Promise<GetInterviewFeedbackResult> => {
  const result = await postJson<GetInterviewFeedbackResult>(
    '/interview/feedback',
    {
      interviewer: params.interviewer,
      problem: params.problem,
      conversation: params.conversation,
      correctnessScore: params.correctnessScore,
      clarityScore: params.clarityScore,
      speedScore: params.speedScore,
      communicationScore: params.communicationScore,
      technicalScore: params.technicalScore,
      overallScore: params.overallScore,
    },
    'Failed to get interview feedback from AI service.',
  );

  if (!result?.feedback) {
    throw createHttpError(502, 'AI service returned empty interview feedback.');
  }

  return result;
};