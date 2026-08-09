import {
  startInterview as startInterviewService,
  sendInterviewMessage as sendInterviewMessageService,
} from "../services/interview.service";

export interface InterviewMessage {
  role: "user" | "assistant";
  content: string;
}

export interface StartInterviewParams {
  topic: string;
  difficulty: string;
  language: string;
}

export interface SendInterviewMessageParams {
  history: InterviewMessage[];
  userMessage: string;
}

export interface InterviewTurnResponse {
  history: InterviewMessage[];
  reply: string;
  interview_ended: boolean;
}

type HttpError = Error & { statusCode?: number };

const createHttpError = (
  statusCode: number,
  message: string
): HttpError => {
  const error = new Error(message) as HttpError;
  error.statusCode = statusCode;
  return error;
};

const getFastApiUrl = (): string => {
  return process.env.FASTAPI_URL || "http://localhost:8000";
};

export const startInterview = async (
  params: StartInterviewParams
): Promise<InterviewTurnResponse> => {
  const fastApiUrl = getFastApiUrl();

  try {
    const response = await fetch(`${fastApiUrl}/interview/start`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        topic: params.topic,
        difficulty: params.difficulty,
        language: params.language,
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text().catch(() => "");

      throw new Error(
        `FastAPI /interview/start responded with status ${response.status}: ${errorBody}`
      );
    }

    const data = (await response.json()) as InterviewTurnResponse;

    if (!data?.reply) {
      throw new Error(
        "FastAPI /interview/start returned empty reply content."
      );
    }

    return data;
  } catch (error) {
    console.error(
      "[interview.service] FastAPI /interview/start call failed:",
      error
    );

    throw createHttpError(
      502,
      "Failed to start interview from AI service."
    );
  }
};

export const sendInterviewMessage = async (
  params: SendInterviewMessageParams
): Promise<InterviewTurnResponse> => {
  const fastApiUrl = getFastApiUrl();

  try {
    const response = await fetch(`${fastApiUrl}/interview/message`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        history: params.history,
        user_message: params.userMessage,
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text().catch(() => "");

      throw new Error(
        `FastAPI /interview/message responded with status ${response.status}: ${errorBody}`
      );
    }

    const data = (await response.json()) as InterviewTurnResponse;

    if (!data?.reply) {
      throw new Error(
        "FastAPI /interview/message returned empty reply content."
      );
    }

    return data;
  } catch (error) {
    console.error(
      "[interview.service] FastAPI /interview/message call failed:",
      error
    );

    throw createHttpError(
      502,
      "Failed to send interview message to AI service."
    );
  }
};

