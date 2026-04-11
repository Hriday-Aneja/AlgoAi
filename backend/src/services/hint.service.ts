import OpenAI from "openai";
import { getProblemById } from "../repositories/problem.repository";
import {
  createHint,
  getHintsByUserAndProblem,
  getSubmissionSnapshot,
} from "../repositories/hint.repository";
import {
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

const getOpenAIClient = (): OpenAI => {
  const apiKey = process.env.OPENAI_API_KEY || process.env.AI_API_KEY;

  if (!apiKey) {
    throw createHttpError(
      500,
      "OPENAI_API_KEY (or AI_API_KEY) is not configured.",
    );
  }

  return new OpenAI({ apiKey });
};

const analyzeStuckCondition = (
  failedAttempts: number,
  firstSubmissionAt: Date | null,
): StuckAnalysis => {
  const elapsedMinutes = firstSubmissionAt
    ? Math.floor((Date.now() - firstSubmissionAt.getTime()) / (1000 * 60))
    : 0;

  const isStuck =
    failedAttempts > FAILED_ATTEMPTS_THRESHOLD ||
    elapsedMinutes > STUCK_TIME_THRESHOLD_MINUTES;

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

const buildHintPrompt = (params: {
  problemTitle: string;
  topic: string;
  difficulty: string;
  problemUrl: string;
  nextHintLevel: number;
  existingHints: { hintLevel: number; hintText: string }[];
}): string => {
  const previousHintsText =
    params.existingHints.length > 0
      ? params.existingHints
          .map((hint) => `Hint ${hint.hintLevel}: ${hint.hintText}`)
          .join("\n")
      : "None";

  return [
    "You are a DSA mentor. Generate exactly one progressive hint.",
    "Do not provide full solution, complete code, or final answer.",
    "Keep the hint concise (2-4 sentences), actionable, and step-by-step.",
    "",
    `Problem title: ${params.problemTitle}`,
    `Topic: ${params.topic}`,
    `Difficulty: ${params.difficulty}`,
    `Reference URL: ${params.problemUrl}`,
    "",
    `Target hint level: ${params.nextHintLevel}`,
    "Hint style by level:",
    "1 -> small clue on direction",
    "2 -> deeper guidance on approach/data structure",
    "3 -> near-solution idea without writing full algorithm/code",
    "",
    "Previous hints:",
    previousHintsText,
    "",
    "Output only the hint text. No JSON. No markdown.",
  ].join("\n");
};

const generateHintWithOpenAI = async (params: {
  problemTitle: string;
  topic: string;
  difficulty: string;
  problemUrl: string;
  nextHintLevel: number;
  existingHints: { hintLevel: number; hintText: string }[];
}): Promise<string> => {
  const client = getOpenAIClient();
  const model = process.env.OPENAI_MODEL || "gpt-4o-mini";

  const prompt = buildHintPrompt(params);

  try {
    const completion = await client.chat.completions.create({
      model,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.5,
      max_tokens: 220,
    });

    const generatedHint = completion.choices[0]?.message?.content?.trim();

    if (!generatedHint) {
      throw new Error("OpenAI returned empty hint content.");
    }

    return generatedHint;
  } catch {
    throw createHttpError(502, "Failed to generate hint from AI provider.");
  }
};

export const generateSmartHint = async (
  userId: string,
  problemId: string,
): Promise<HintResponse> => {
  const problem = getProblemById(problemId);

  if (!problem) {
    throw createHttpError(404, "Problem not found.");
  }

  const submissionSnapshot = await getSubmissionSnapshot(userId, problemId);
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
  const nextHintContext = getNextHintContext(existingHints);

  if (nextHintContext.nextHintLevel > MAX_HINT_LEVEL) {
    return {
      success: false,
      message: "Maximum hint level reached for this problem.",
    };
  }

  const generatedHint = await generateHintWithOpenAI({
    problemTitle: problem.title,
    topic: problem.topic,
    difficulty: problem.difficulty,
    problemUrl: problem.url,
    nextHintLevel: nextHintContext.nextHintLevel,
    existingHints: nextHintContext.existingHints,
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
