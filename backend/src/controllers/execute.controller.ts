import { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import {
  ExecuteRequestInput,
  executeRequestSchema,
} from "../validators/execute.validator";

const JDOODLE_EXECUTE_URL = "https://api.jdoodle.com/v1/execute";

type JdoodleCandidate = {
  language: string;
  versionIndex: string;
};

const LANGUAGE_CANDIDATES: Record<string, JdoodleCandidate[]> = {
  javascript: [
    { language: "nodejs", versionIndex: "4" },
    { language: "nodejs", versionIndex: "3" },
    { language: "nodejs", versionIndex: "0" },
  ],
  js: [
    { language: "nodejs", versionIndex: "4" },
    { language: "nodejs", versionIndex: "3" },
    { language: "nodejs", versionIndex: "0" },
  ],
  typescript: [
    { language: "typescript", versionIndex: "5" },
    { language: "typescript", versionIndex: "4" },
    { language: "typescript", versionIndex: "0" },
  ],
  ts: [
    { language: "typescript", versionIndex: "5" },
    { language: "typescript", versionIndex: "4" },
    { language: "typescript", versionIndex: "0" },
  ],
  python: [
    { language: "python3", versionIndex: "5" },
    { language: "python3", versionIndex: "4" },
    { language: "python3", versionIndex: "3" },
    { language: "python3", versionIndex: "0" },
  ],
  python3: [
    { language: "python3", versionIndex: "5" },
    { language: "python3", versionIndex: "4" },
    { language: "python3", versionIndex: "3" },
    { language: "python3", versionIndex: "0" },
  ],
  java: [
    { language: "java", versionIndex: "5" },
    { language: "java", versionIndex: "4" },
    { language: "java", versionIndex: "3" },
    { language: "java", versionIndex: "0" },
  ],
  c: [
    { language: "c", versionIndex: "5" },
    { language: "c", versionIndex: "4" },
    { language: "c", versionIndex: "0" },
  ],
  "c++": [
    { language: "cpp17", versionIndex: "0" },
    { language: "cpp14", versionIndex: "0" },
    { language: "cpp", versionIndex: "5" },
    { language: "cpp", versionIndex: "4" },
    { language: "cpp", versionIndex: "0" },
  ],
  cpp: [
    { language: "cpp17", versionIndex: "0" },
    { language: "cpp14", versionIndex: "0" },
    { language: "cpp", versionIndex: "5" },
    { language: "cpp", versionIndex: "4" },
    { language: "cpp", versionIndex: "0" },
  ],
  go: [
    { language: "go", versionIndex: "5" },
    { language: "go", versionIndex: "4" },
    { language: "go", versionIndex: "0" },
  ],
  rust: [
    { language: "rust", versionIndex: "5" },
    { language: "rust", versionIndex: "4" },
    { language: "rust", versionIndex: "0" },
  ],
  ruby: [
    { language: "ruby", versionIndex: "3" },
    { language: "ruby", versionIndex: "0" },
  ],
  kotlin: [
    { language: "kotlin", versionIndex: "4" },
    { language: "kotlin", versionIndex: "0" },
  ],
  swift: [
    { language: "swift", versionIndex: "5" },
    { language: "swift", versionIndex: "4" },
    { language: "swift", versionIndex: "0" },
  ],
};

const getJdoodleCredentials = () => {
  const clientId = process.env.JDOODLE_CLIENT_ID?.trim();
  const clientSecret = process.env.JDOODLE_CLIENT_SECRET?.trim();

  if (!clientId || !clientSecret) {
    const error = new Error(
      "JDoodle is not configured. Set JDOODLE_CLIENT_ID and JDOODLE_CLIENT_SECRET in backend/.env.",
    ) as Error & { statusCode?: number };
    error.statusCode = 500;
    throw error;
  }

  return { clientId, clientSecret };
};

const getCandidateRuntimes = (
  language: string,
  requestedVersion?: string,
): JdoodleCandidate[] => {
  const normalized = language.trim().toLowerCase();
  const defaults = LANGUAGE_CANDIDATES[normalized] || [];

  if (!requestedVersion || !requestedVersion.trim()) {
    return defaults;
  }

  const version = requestedVersion.trim();
  const versionCandidate = defaults.find(
    (item) => item.versionIndex === version,
  );
  return versionCandidate ? [versionCandidate, ...defaults] : defaults;
};

const transpileTypeScriptToJavaScript = async (
  source: string,
): Promise<{ code: string; error: string | null }> => {
  try {
    const ts = await import("typescript");

    const result = ts.transpileModule(source, {
      compilerOptions: {
        target: ts.ScriptTarget.ES2020,
        module: ts.ModuleKind.CommonJS,
      },
      reportDiagnostics: true,
    });

    const diagnostics = result.diagnostics || [];
    const hasError = diagnostics.some(
      (diagnostic) => diagnostic.category === ts.DiagnosticCategory.Error,
    );

    if (hasError) {
      const message = diagnostics
        .map((diagnostic) =>
          ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n"),
        )
        .join("\n");

      return {
        code: "",
        error: `TypeScript transpile error: ${message}`,
      };
    }

    return {
      code: result.outputText,
      error: null,
    };
  } catch {
    return {
      code: "",
      error:
        "TypeScript runtime support is unavailable on server. Please run code in JavaScript mode.",
    };
  }
};

const safeParseJson = (raw: string): unknown => {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

const getPrimaryFunctionName = (source: string): string | null => {
  const match = source.match(/function\s+([A-Za-z_$][\w$]*)\s*\(/);
  return match?.[1] || null;
};

const buildHarness = (functionName: string, stdin: string): string => {
  const escapedInput = JSON.stringify(stdin);
  const escapedFn = JSON.stringify(functionName);

  return `
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

export const proxyExecute = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const payload = executeRequestSchema.parse(req.body);
    const { clientId, clientSecret } = getJdoodleCredentials();

    const normalizedLanguage = payload.language.trim().toLowerCase();
    let executionLanguage = payload.language;
    const userSource = payload.files.map((file) => file.content).join("\n");
    let script = userSource;

    const fnName = getPrimaryFunctionName(userSource);
    const shouldInjectHarness =
      Boolean(payload.stdin?.trim()) &&
      Boolean(fnName) &&
      !/console\.log|process\.stdout\.write/.test(userSource);

    if (normalizedLanguage === "typescript" || normalizedLanguage === "ts") {
      const transpiled = await transpileTypeScriptToJavaScript(script);

      if (transpiled.error) {
        res.status(400).json({
          status: "error",
          message: transpiled.error,
        });
        return;
      }

      script = transpiled.code;
      executionLanguage = "javascript";

      if (shouldInjectHarness && fnName) {
        script += buildHarness(fnName, payload.stdin || "");
      }
    } else if (shouldInjectHarness && fnName) {
      script += buildHarness(fnName, payload.stdin || "");
    }

    const candidates = getCandidateRuntimes(executionLanguage, payload.version);
    if (candidates.length === 0) {
      res.status(400).json({
        status: "error",
        message: `Unsupported language for JDoodle: ${payload.language}.`,
      });
      return;
    }

    let lastHttpStatus = 502;
    let lastErrorMessage = "JDoodle execution failed.";

    for (const runtime of candidates) {
      const response = await fetch(JDOODLE_EXECUTE_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId,
          clientSecret,
          script,
          language: runtime.language,
          versionIndex: runtime.versionIndex,
          stdin: payload.stdin || "",
          compileOnly: false,
        }),
      });

      const rawBody = await response.text();
      const parsed = safeParseJson(rawBody) as {
        output?: string;
        error?: string;
        statusCode?: number;
        memory?: string;
        cpuTime?: string;
      } | null;

      if (!response.ok) {
        lastHttpStatus = response.status;
        lastErrorMessage =
          rawBody || `JDoodle request failed with status ${response.status}.`;
        continue;
      }

      const output = parsed?.output || "";
      const statusCode = parsed?.statusCode ?? 200;
      const hasError = Boolean(parsed?.error) || statusCode >= 400;

      // Try another runtime/version if this candidate is invalid/unavailable.
      if (
        hasError &&
        /language|version|unsupported|not found|invalid/i.test(output)
      ) {
        lastHttpStatus = 502;
        lastErrorMessage = output;
        continue;
      }

      res.status(200).json({
        run: {
          stdout: hasError ? "" : output,
          stderr: hasError ? parsed?.error || output : "",
          code: hasError ? 1 : 0,
          signal: null,
        },
        meta: {
          memory: parsed?.memory || null,
          cpuTime: parsed?.cpuTime || null,
          provider: "jdoodle",
          requestedLanguage: payload.language,
          language: runtime.language,
          versionIndex: runtime.versionIndex,
        },
      });
      return;
    }

    res.status(lastHttpStatus).json({
      status: "error",
      message: `JDoodle execution failed for all runtime candidates: ${lastErrorMessage}`,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({
        status: "error",
        message: "Validation failed.",
        errors: error.flatten(),
      });
      return;
    }

    next(error);
  }
};

export const proxyRuntimes = async (
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const seen = new Set<string>();
    const runtimes = Object.entries(LANGUAGE_CANDIDATES).flatMap(
      ([inputLanguage, candidates]) =>
        candidates
          .map((candidate) => {
            const key = `${inputLanguage}:${candidate.language}:${candidate.versionIndex}`;
            if (seen.has(key)) {
              return null;
            }
            seen.add(key);

            return {
              language: inputLanguage,
              providerLanguage: candidate.language,
              version: candidate.versionIndex,
            };
          })
          .filter(
            (
              item,
            ): item is {
              language: string;
              providerLanguage: string;
              version: string;
            } => item !== null,
          ),
    );

    res.status(200).json(runtimes);
  } catch (error) {
    next(error);
  }
};
