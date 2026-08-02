// Code execution client (backend /api/execute).
// Backend currently proxies requests to JDoodle.

const viteEnv = (
  import.meta as ImportMeta & {
    env?: Record<string, string | undefined>;
  }
).env;

const API_BASE_URL =
  viteEnv?.VITE_API_URL?.trim()?.replace(/\/+$/, "") ||
  "http://localhost:3001/api";

const EXECUTE_API =
  viteEnv?.VITE_EXECUTE_API?.trim() || `${API_BASE_URL}/execute`;

const normalizeBaseUrl = (url: string): string => url.replace(/\/+$/, "");

const getExecuteUrl = (): string => {
  const base = normalizeBaseUrl(EXECUTE_API);
  return /\/execute$/i.test(base) ? base : `${base}/execute`;
};

const getRuntimesUrl = (): string => {
  const base = normalizeBaseUrl(EXECUTE_API);
  return /\/execute$/i.test(base) ? `${base}/runtimes` : `${base}/runtimes`;
};

export interface ExecuteResult {
  stdout: string;
  stderr: string;
  exitCode: number;
  signal: string | null;
  error: string | null;
}

const extractErrorMessage = (raw: string): string | null => {
  try {
    const parsed = JSON.parse(raw) as { message?: unknown };
    if (
      typeof parsed.message === "string" &&
      parsed.message.trim().length > 0
    ) {
      return parsed.message;
    }
  } catch {
    // Ignore parse failures and fall back to raw text/generic status.
  }

  const trimmed = raw.trim();
  return trimmed.length > 0 ? trimmed : null;
};

// Map from common editor labels to backend execution language keys.
const LANGUAGE_MAP: Record<string, { language: string; version: string }> = {
  javascript: { language: "javascript", version: "18.15.0" },
  js: { language: "javascript", version: "18.15.0" },
  typescript: { language: "typescript", version: "5.0.3" },
  ts: { language: "typescript", version: "5.0.3" },
  python: { language: "python", version: "3.10.0" },
  python3: { language: "python", version: "3.10.0" },
  java: { language: "java", version: "15.0.2" },
  cpp: { language: "c++", version: "10.2.0" },
  "c++": { language: "c++", version: "10.2.0" },
  c: { language: "c", version: "10.2.0" },
  go: { language: "go", version: "1.16.2" },
  rust: { language: "rust", version: "1.50.0" },
  ruby: { language: "ruby", version: "3.0.1" },
  kotlin: { language: "kotlin", version: "1.6.20" },
  swift: { language: "swift", version: "5.3.3" },
};

export const executeCode = async (
  code: string,
  language: string,
  stdin: string = "",
): Promise<ExecuteResult> => {
  const langConfig = LANGUAGE_MAP[language.toLowerCase()];

  if (!langConfig) {
    return {
      stdout: "",
      stderr: "",
      exitCode: 1,
      signal: null,
      error: `Language "${language}" is not supported. Supported: ${Object.keys(LANGUAGE_MAP).join(", ")}`,
    };
  }

  try {
    const response = await fetch(getExecuteUrl(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        language: langConfig.language,
        version: langConfig.version,
        files: [{ content: code }],
        stdin,
        args: [],
        compile_timeout: 10000,
        run_timeout: 5000,
        compile_memory_limit: -1,
        run_memory_limit: -1,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      const detailedMessage = extractErrorMessage(errorText);

      return {
        stdout: "",
        stderr: errorText,
        exitCode: 1,
        signal: null,
        error:
          detailedMessage ||
          `Execution API error: ${response.status} ${response.statusText}`,
      };
    }

    const data = await response.json();
    const run = data.run;

    return {
      stdout: run.stdout || "",
      stderr: run.stderr || "",
      exitCode: run.code ?? 0,
      signal: run.signal || null,
      error: null,
    };
  } catch (err) {
    return {
      stdout: "",
      stderr: "",
      exitCode: 1,
      signal: null,
      error:
        err instanceof Error
          ? err.message
          : "Network error - could not reach execution API",
    };
  }
};

// Fetch available runtimes (useful for showing supported languages)
export const getAvailableRuntimes = async (): Promise<
  { language: string; version: string }[]
> => {
  try {
    const response = await fetch(getRuntimesUrl());
    const data = await response.json();
    return data;
  } catch {
    return [];
  }
};
