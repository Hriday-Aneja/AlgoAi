import { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import axios from "axios";
import { executeRequestSchema } from "../validators/execute.validator";

// ─── Judge0 Configuration ──────────────────────────────────────────────────
// Self-hosted Judge0 instance (set JUDGE0_API_URL in backend/.env).
// Falls back to the GCP instance used during development/testing.
const JUDGE0_API_URL = (
  process.env.JUDGE0_API_URL || "http://34.131.167.198:2358"
).replace(/\/+$/, "");

// Judge0 Language IDs (https://ce.judge0.com/#statuses-and-languages-language-get)
const LANGUAGE_MAPPING: Record<string, number> = {
  javascript: 63, // JavaScript (Node.js 12.14.0)
  js: 63,
  typescript: 74, // TypeScript (3.7.4)
  ts: 74,
  python: 71, // Python (3.8.1)
  python3: 71,
  java: 62, // Java (OpenJDK 13.0.1)
  c: 50, // C (GCC 9.2.0)
  "c++": 54, // C++ (GCC 9.2.0)
  cpp: 54,
};

// ─── Harness: auto-invoke the user's function against stdin-style test input ──
const buildHarness = (functionName: string, stdin: string): string => {
  const escapedInput = JSON.stringify(stdin);
  const escapedFn = JSON.stringify(functionName);

  return `
// --- Auto-injected test harness ---
const __algoInput = ${escapedInput};
const __algoFnName = ${escapedFn};
const __algoNormalized = __algoInput.replace(/([A-Za-z_$][\\w$]*\\s*=\\s*)/g, "").trim();
const __algoArgs = __algoNormalized.length > 0 ? eval('[' + __algoNormalized + ']') : [];
const __algoFn = eval(__algoFnName);
const __algoResult = __algoFn(...__algoArgs);
if (typeof __algoResult === "string") {
  console.log(__algoResult);
} else {
  console.log(JSON.stringify(__algoResult));
}
`;
};

const getPrimaryFunctionName = (source: string): string | null => {
  const match = source.match(/function\s+([A-Za-z_$][\w$]*)\s*\(/);
  return match?.[1] || null;
};

export const proxyExecute = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    // 1. Validate payload
    const payload = executeRequestSchema.parse(req.body);

    const normalizedLanguage = payload.language.trim().toLowerCase();
    const languageId = LANGUAGE_MAPPING[normalizedLanguage] || 93; // default to JS
    const userSource = payload.files.map((file) => file.content).join("\n");

    let finalCode = userSource;
    const fnName = getPrimaryFunctionName(userSource);
    const shouldInjectHarness =
      Boolean(payload.stdin?.trim()) &&
      Boolean(fnName) &&
      !/console\.log|process\.stdout\.write/.test(userSource);

    // 2. Inject test-case harness if needed (only for JS/TS)
    // 2. Inject test-case harness if needed (only for JS/TS)
const isJsOrTsLanguage = ["javascript", "js", "typescript", "ts"].includes(normalizedLanguage);

if (shouldInjectHarness && fnName && isJsOrTsLanguage) {
  finalCode += buildHarness(fnName, payload.stdin || "");
}
    // 3. Send to Judge0
    const response = await axios.post(
      `${JUDGE0_API_URL}/submissions/?base64_encoded=false&wait=true`,
      {
        source_code: finalCode,
        language_id: languageId,
        stdin: payload.stdin || "",
      },
      { timeout: 20000 },
    );

    const { stdout, stderr, compile_output, status, time, memory } =
      response.data;
    const hasError = status.id !== 3; // 3 is "Accepted"

    // 4. Return formatted response (matches the shape the frontend already expects)
    res.status(200).json({
      success: true,
      run: {
        stdout: hasError ? "" : stdout || "",
        stderr: hasError ? stderr || compile_output || status.description : "",
        code: hasError ? 1 : 0,
        signal: null,
      },
      meta: {
        memory: memory || null,
        cpuTime: time || null,
        provider: "judge0",
        status,
      },
    });
  } catch (error: any) {
    if (error instanceof ZodError) {
      res.status(400).json({
        success: false,
        status: "error",
        message: "Validation failed.",
        errors: error.flatten(),
      });
      return;
    }

    console.error("Judge0 Execution Error:", error?.response?.data || error.message);
    res.status(502).json({
      success: false,
      status: "error",
      message: `Execution engine failed: ${error.message}`,
    });
  }
};

// Runtime list endpoint (kept for frontend's getAvailableRuntimes()).
export const proxyRuntimes = async (
  _req: Request,
  res: Response,
): Promise<void> => {
  res
    .status(200)
    .json(Object.keys(LANGUAGE_MAPPING).map((lang) => ({ language: lang })));
};  