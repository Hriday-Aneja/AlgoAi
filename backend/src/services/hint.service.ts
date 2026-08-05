import {
  createHint,
  getHintsByUserAndProblem,
  getSubmissionSnapshot,
} from "../repositories/hint.repository";
import {
  HintRequestPayload,
  HintResponse,
  NextHintContext,
  StuckAnalysis,
} from "../types/hint.types";

const FAILED_ATTEMPTS_THRESHOLD = 3;
const STUCK_TIME_THRESHOLD_MINUTES = 20;
const MAX_HINT_LEVEL = 3;

type HttpError = Error & { statusCode?: number };

const createHttpError = (statusCode: number, message: string): HttpError => {
  const error = new Error(message) as HttpError;
  error.statusCode = statusCode;
  return error;
};

const getFastApiUrl = (): string => {
  return process.env.FASTAPI_URL || "http://localhost:8000";
};

const analyzeStuckCondition = (
  failedAttempts: number,
  firstSubmissionAt: Date | string | null,
): StuckAnalysis => {

  const firstSubmissionTime = firstSubmissionAt
    ? new Date(firstSubmissionAt).getTime()
    : null;

  const elapsedMinutes =
    firstSubmissionTime !== null && !Number.isNaN(firstSubmissionTime)
      ? Math.floor(
          (Date.now() - firstSubmissionTime) / (1000 * 60)
        )
      : 0;

  const isStuck =
    failedAttempts >= FAILED_ATTEMPTS_THRESHOLD ||
    elapsedMinutes >= STUCK_TIME_THRESHOLD_MINUTES;

  return {
    isStuck,
    failedAttempts,
    elapsedMinutes,
  };
};

const getNextHintContext = (
  existingHints: { hintLevel: number; hintText: string }[],
): NextHintContext => {
  const currentMaxLevel = existingHints.reduce(
    (maxLevel, hint) => Math.max(maxLevel, hint.hintLevel),
    0,
  );

  return {
    nextHintLevel: currentMaxLevel + 1,
    existingHints,
  };
};

const generateHintFromFastApi = async (params: {
  problemTitle: string;
  problemDescription: string;
  language: string;
  code: string;
  hintLevel: number;
}): Promise<string> => {
  const fastApiUrl = getFastApiUrl();

  try {
    const response = await fetch(`${fastApiUrl}/hint`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        problem_title: params.problemTitle,
        problem_description: params.problemDescription,
        language: params.language,
        code: params.code,
        hint_level: params.hintLevel,
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text().catch(() => "");
      throw new Error(
        `FastAPI /hint responded with status ${response.status}: ${errorBody}`,
      );
    }

    const data = (await response.json()) as any;
    const generatedHint = (data?.hint ?? "").toString().trim();

    if (!generatedHint) {
      throw new Error("FastAPI /hint returned empty hint content.");
    }

    return generatedHint;
  } catch (error) {
    console.error("[hint.service] FastAPI call failed:", error);
    throw createHttpError(502, "Failed to generate hint from AI service.");
  }
};

export const generateSmartHint = async (
  userId: string,
  payload: HintRequestPayload,
): Promise<HintResponse> => {
  const { problemId, problemTitle, problemDescription, language, code } = payload;

  const submissionSnapshot = await getSubmissionSnapshot(userId, problemId);
  console.log("DEBUG submissionSnapshot:", submissionSnapshot);

  const stuck = analyzeStuckCondition(
    submissionSnapshot.failedAttempts,
    submissionSnapshot.firstSubmissionAt,
  );

  if (!stuck.isStuck) {
    return {
      success: false,
      message:
        "You are not stuck yet. Keep trying; hints unlock after enough failures or time spent.",
    };
  }

  const existingHints = await getHintsByUserAndProblem(userId, problemId);
  console.log("DEBUG userId:", userId);
console.log("DEBUG problemId:", problemId);
console.log("DEBUG existingHints:", existingHints);

  const nextHintContext = getNextHintContext(existingHints);
  console.log("DEBUG nextHintLevel:", nextHintContext.nextHintLevel);

  if (nextHintContext.nextHintLevel > MAX_HINT_LEVEL) {
    return {
      success: false,
      message: "Maximum hint level reached for this problem.",
    };
  }
  

  const generatedHint = await generateHintFromFastApi({
    problemTitle,
    problemDescription,
    language,
    code,
    hintLevel: nextHintContext.nextHintLevel,
  });

  const createdHint = await createHint(
    userId,
    problemId,
    nextHintContext.nextHintLevel,
    generatedHint,
  );

  return {
    success: true,
    hintLevel: createdHint.hintLevel,
    hint: createdHint.hintText,
  };
};