import axios from "axios";
interface SandboxExecutionResult {
  events: any[];
  stdout: string;
  stderr: string;
  exitCode: number;
}

type HttpError = Error & { statusCode?: number };

const createHttpError = (statusCode: number, message: string): HttpError => {
  const error = new Error(message) as HttpError;
  error.statusCode = statusCode;
  return error;
};

const VIZ_START = "__VIZ_JSON_START__";
const VIZ_END = "__VIZ_JSON_END__";

const buildRunnerCode = (
  instrumentedCode: string,
  input: string,
  maxSteps: number,
): string => {
  const safeInput = JSON.stringify(input ?? "");

  return `
const __vizState = { step: 0, maxSteps: ${maxSteps}, events: [], stack: [] };
const __vizOutput = [];
const __vizOriginalLog = console.log.bind(console);

function __vizSnapshot(value) {
  if (value === undefined) return undefined;

  try {
    return JSON.parse(JSON.stringify(value));
  } catch {
    return String(value);
  }
}

function __vizTrack(line, variables) {
  __vizState.step += 1;

  if (__vizState.step > __vizState.maxSteps) {
    throw new Error("STEP_LIMIT_EXCEEDED");
  }

  const snapshot = {};

  for (const [key, value] of Object.entries(variables || {})) {
    snapshot[key] = __vizSnapshot(value);
  }

  __vizState.events.push({
    step: __vizState.step,
    line,
    variables: snapshot,
    stack: [...__vizState.stack],
  });
}

function __vizLoop(line, variables) {
  __vizTrack(line, variables);
}

function __vizCondition(line, value) {
  __vizTrack(line, { __condition: value });
  return value;
}

function __vizEnter(name, line) {
  __vizState.stack.push(String(name));
  __vizTrack(line, { __call: String(name) });
}

function __vizExit(name, line) {
  __vizTrack(line, { __return: String(name) });
  __vizState.stack.pop();
}

console.log = (...args) => {
  const output = args.map((item) => {
    if (typeof item === "string") {
      return item;
    }

    try {
      return JSON.stringify(item);
    } catch {
      return String(item);
    }
  }).join(" ");

  __vizOutput.push(output);
  __vizState.events.push({
    step: __vizState.step,
    line: -1,
    variables: {},
    output,
    stack: [...__vizState.stack],
  });
};

const input = ${safeInput};
globalThis.__input = input;

afterExecution = () => {
  const payload = JSON.stringify({ events: __vizState.events, stdout: __vizOutput.join("\\n") });
  __vizOriginalLog("${VIZ_START}" + payload + "${VIZ_END}");
};

try {
${instrumentedCode}
  afterExecution();
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  __vizOriginalLog("${VIZ_START}" + JSON.stringify({ events: __vizState.events, runtimeError: message, stdout: __vizOutput.join("\\n") }) + "${VIZ_END}");
  throw error;
}
`;
};

const extractVisualizationPayload = (stdout: string): any => {
  const start = stdout.indexOf(VIZ_START);
  const end = stdout.lastIndexOf(VIZ_END);

  if (start === -1 || end === -1 || end <= start) {
    throw createHttpError(
      500,
      "Execution trace markers were not found in sandbox output.",
    );
  }

  const json = stdout.slice(start + VIZ_START.length, end).trim();

  try {
    return JSON.parse(json);
  } catch {
    throw createHttpError(
      500,
      "Failed to parse execution trace from sandbox output.",
    );
  }
};

export const executeInstrumentedJavaScript = async (params: {
  instrumentedCode: string;
  input: string;
  timeoutMs?: number;
  memoryLimitKb?: number;
  maxSteps?: number;
}): Promise<SandboxExecutionResult> => {
  const timeoutMs = params.timeoutMs ?? 3000;
  const maxSteps = params.maxSteps ?? 200;

  const JUDGE0_API_URL = (
    process.env.JUDGE0_API_URL || "http://34.131.178.174:2358"
  ).replace(/\/+$/, "");

  const runnerCode = buildRunnerCode(
  params.instrumentedCode,
  params.input,
  maxSteps,
);
  try {
    console.log("[visualizer] Sending to Judge0...");
    console.log("[visualizer] URL:", JUDGE0_API_URL);
    console.log("[visualizer] Code length:", runnerCode.length);

    const response = await axios.post(
      `${JUDGE0_API_URL}/submissions/?base64_encoded=false&wait=true`,
      {
        source_code: runnerCode,
        language_id: 63,
        stdin: params.input || "",
      },
      {
        timeout: timeoutMs + 10000,
      },
    );

    const data = response.data;

    console.log("[visualizer] Judge0 status:", data.status);

    

const stdout = data.stdout ?? "";
const stderr = data.stderr ?? "";
const compileOutput = data.compile_output ?? "";
const status = data.status;
const exitCode = status?.id === 3 ? 0 : 1;

console.log("[visualizer] Judge0 status:", status);
console.log("[visualizer] stdout:", stdout);
console.log("[visualizer] stderr:", stderr);
console.log("[visualizer] compile_output:", compileOutput);

if (status?.id !== 3) {
  const errorMessage =
    stderr ||
    compileOutput ||
    status?.description ||
    "Judge0 execution failed.";

  throw createHttpError(
    400,
    `Visualizer execution error: ${errorMessage.trim()}`
  );
}

const payload = extractVisualizationPayload(stdout);
    const events = Array.isArray(payload.events)
      ? payload.events
      : [];

    if (payload.runtimeError === "STEP_LIMIT_EXCEEDED") {
      throw createHttpError(
        400,
        `Execution stopped because step limit (${maxSteps}) was exceeded. Possible infinite loop.`,
      );
    }

    if (payload.runtimeError) {
      throw createHttpError(
        400,
        `Runtime error: ${payload.runtimeError}`,
      );
    }

    return {
      events,
      stdout: payload.stdout ?? "",
      stderr,
      exitCode,
    };
  } catch (error: any) {
    // Apne createHttpError ko preserve karo
    if (error?.statusCode) {
      throw error;
    }

    console.error(
      "[visualizer] Judge0 request failed:",
      error?.response?.status,
      error?.response?.data || error?.message,
    );

    throw createHttpError(
      502,
      `Judge0 visualization execution failed: ${
        error?.response?.data?.message ||
        error?.message ||
        "Unknown error"
      }`,
    );
  }
};