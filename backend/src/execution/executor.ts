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

function __vizTrack(line, variables) {
  __vizState.step += 1;
  if (__vizState.step > __vizState.maxSteps) {
    throw new Error("STEP_LIMIT_EXCEEDED");
  }

  __vizState.events.push({
    step: __vizState.step,
    line,
    variables: variables || {},
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
  const memoryLimitKb = params.memoryLimitKb ?? 128000;
  const maxSteps = params.maxSteps ?? 200;
  const pistonUrl =
    process.env.PISTON_URL || "https://emkc.org/api/v2/piston/execute";

  const runTimeout = Math.max(1, Math.floor(timeoutMs / 1000));
  const runnerCode = buildRunnerCode(
    params.instrumentedCode,
    params.input,
    maxSteps,
  );

  const response = await fetch(pistonUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      language: "javascript",
      version: "18.15.0",
      files: [{ content: runnerCode }],
      run_timeout: runTimeout,
      run_memory_limit: memoryLimitKb,
    }),
  });

  if (!response.ok) {
    throw createHttpError(
      502,
      `Sandbox execution failed with status ${response.status}.`,
    );
  }

  const data = (await response.json()) as {
    run?: { stdout?: string; stderr?: string; code?: number; signal?: string };
  };

  const stdout = data.run?.stdout ?? "";
  const stderr = data.run?.stderr ?? "";
  const exitCode = data.run?.code ?? 1;

  const payload = extractVisualizationPayload(stdout);
  const events = Array.isArray(payload.events) ? payload.events : [];

  if (payload.runtimeError === "STEP_LIMIT_EXCEEDED") {
    throw createHttpError(
      400,
      `Execution stopped because step limit (${maxSteps}) was exceeded. Possible infinite loop.`,
    );
  }

  if (payload.runtimeError && payload.runtimeError !== "STEP_LIMIT_EXCEEDED") {
    throw createHttpError(400, `Runtime error: ${payload.runtimeError}`);
  }

  return {
    events,
    stdout: payload.stdout ?? "",
    stderr,
    exitCode,
  };
};
