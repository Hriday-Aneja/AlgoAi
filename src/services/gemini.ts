import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY as string;
const ENV_MODEL = (
  import.meta.env.VITE_GEMINI_MODEL as string | undefined
)?.trim();

if (!API_KEY) {
  console.error("VITE_GEMINI_API_KEY is not set in .env file");
}

const genAI = new GoogleGenerativeAI(API_KEY);

const MODEL_CANDIDATES = [
  ENV_MODEL,
  "gemini-2.0-flash",
  "gemini-1.5-flash",
].filter(
  (value, index, arr): value is string =>
    Boolean(value) && arr.indexOf(value) === index,
);

const getModel = (modelName: string) =>
  genAI.getGenerativeModel({
    model: modelName,
    systemInstruction: `You are AlgoAI, an expert DSA (Data Structures & Algorithms) tutor and coding interview coach. 

Your personality:
- Friendly, encouraging, and clear
- Give structured answers with examples
- Use markdown formatting: **bold**, \`code\`, bullet points, numbered lists
- Always include time/space complexity when discussing algorithms
- Give actual runnable code examples when relevant
- Keep responses focused and not too long (aim for 150-300 words unless a detailed explanation is needed)

You help with:
- DSA concepts and problem approaches
- Code review and debugging
- Interview preparation
- Time/space complexity analysis
- Choosing the right data structure or algorithm

When given a topic context (arrays, trees, dp, etc.), focus your answers on that domain.
Never say you are built on Gemini or mention Google. You are AlgoAI.`,
  });

let activeModelIndex = 0;
let model = getModel(MODEL_CANDIDATES[activeModelIndex]);

const isModelNotFoundError = (error: unknown): boolean => {
  const message = error instanceof Error ? error.message : String(error);
  return /404|not found|model.*not.*found/i.test(message);
};

const isRateLimitError = (error: unknown): boolean => {
  const message = error instanceof Error ? error.message : String(error);
  return /429|too many requests|quota|rate limit|resource exhausted/i.test(
    message,
  );
};

const wait = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

const tryNextModel = (): boolean => {
  if (activeModelIndex >= MODEL_CANDIDATES.length - 1) {
    return false;
  }

  activeModelIndex += 1;
  model = getModel(MODEL_CANDIDATES[activeModelIndex]);
  chatSession = model.startChat({ history: [] });

  console.warn(
    `Switching Gemini model to "${MODEL_CANDIDATES[activeModelIndex]}" after model lookup failure.`,
  );

  return true;
};

// Maintain chat history for multi-turn conversation
let chatSession = model.startChat({ history: [] });

export const sendMessageToGemini = async (
  message: string,
  topicContext: string = "general",
): Promise<string> => {
  const MAX_RATE_LIMIT_RETRIES_PER_MODEL = 2;

  const contextPrefix =
    topicContext !== "general"
      ? `[Context: User is asking about ${topicContext}] `
      : "";

  const fullMessage = contextPrefix + message;

  for (
    let modelAttempt = 0;
    modelAttempt < MODEL_CANDIDATES.length;
    modelAttempt += 1
  ) {
    for (
      let rateRetry = 0;
      rateRetry <= MAX_RATE_LIMIT_RETRIES_PER_MODEL;
      rateRetry += 1
    ) {
      try {
        const result = await chatSession.sendMessage(fullMessage);
        const response = result.response;
        return response.text();
      } catch (error) {
        if (isRateLimitError(error)) {
          if (rateRetry < MAX_RATE_LIMIT_RETRIES_PER_MODEL) {
            const delayMs = 800 * 2 ** rateRetry;
            await wait(delayMs);
            continue;
          }

          // Move to another model after repeated rate-limit hits.
          if (tryNextModel()) {
            break;
          }

          return "AlgoAI is currently rate-limited by the Gemini API. Please wait about a minute and try again.";
        }

        if (!isModelNotFoundError(error) || !tryNextModel()) {
          throw error;
        }

        break;
      }
    }
  }

  throw new Error("No available Gemini model found for this API key.");
};

export const resetGeminiChat = (): void => {
  chatSession = model.startChat({ history: [] });
};
