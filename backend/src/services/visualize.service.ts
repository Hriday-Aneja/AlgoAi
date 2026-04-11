import { executeInstrumentedJavaScript } from "../execution/executor";
import { instrumentJavaScriptCode } from "../execution/instrumenter";
import {
  parseJavaScriptCode,
  validateSupportedJavaScriptAst,
} from "../execution/parser";
import { createVisualizationHistory } from "../repositories/visualization.repository";
import { ExecutionStep, VisualizeResponse } from "../types/visualize.types";

type HttpError = Error & { statusCode?: number };

const createHttpError = (statusCode: number, message: string): HttpError => {
  const error = new Error(message) as HttpError;
  error.statusCode = statusCode;
  return error;
};

const MAX_TRACE_STEPS = 200;

const computeChangedVariables = (
  previous: Record<string, unknown>,
  current: Record<string, unknown>,
): string[] => {
  const keys = new Set([...Object.keys(previous), ...Object.keys(current)]);
  const changed: string[] = [];

  for (const key of keys) {
    const prev = previous[key];
    const curr = current[key];

    if (JSON.stringify(prev) !== JSON.stringify(curr)) {
      changed.push(key);
    }
  }

  return changed;
};

const normalizeExecution = (events: any[]): ExecutionStep[] => {
  const execution: ExecutionStep[] = [];
  let previousVariables: Record<string, unknown> = {};

  for (const event of events) {
    if (!event || typeof event !== "object") {
      continue;
    }

    const variables =
      event.variables && typeof event.variables === "object"
        ? (event.variables as Record<string, unknown>)
        : {};

    const step: ExecutionStep = {
      step: Number(event.step ?? 0),
      line: Number(event.line ?? -1),
      variables,
    };

    if (typeof event.output === "string" && event.output.length > 0) {
      step.output = event.output;
    }

    if (Array.isArray(event.stack)) {
      step.stack = event.stack.map((item: unknown) => String(item));
    }

    step.changedVariables = computeChangedVariables(
      previousVariables,
      variables,
    );
    previousVariables = variables;

    execution.push(step);

    if (execution.length >= MAX_TRACE_STEPS) {
      break;
    }
  }

  return execution;
};

export const visualizeCodeExecution = async (params: {
  userId: string;
  code: string;
  language: string;
  input: string;
}): Promise<VisualizeResponse> => {
  if (params.language !== "javascript") {
    throw createHttpError(400, "Only javascript is supported right now.");
  }

  const ast = parseJavaScriptCode(params.code);
  validateSupportedJavaScriptAst(ast);

  const { instrumentedCode } = instrumentJavaScriptCode(ast);
  const sandboxResult = await executeInstrumentedJavaScript({
    instrumentedCode,
    input: params.input,
    timeoutMs: 3000,
    memoryLimitKb: 128000,
    maxSteps: MAX_TRACE_STEPS,
  });

  const execution = normalizeExecution(sandboxResult.events);

  if (execution.length === 0) {
    throw createHttpError(
      400,
      "No execution trace generated for the submitted code.",
    );
  }

  await createVisualizationHistory({
    userId: params.userId,
    code: params.code,
    input: params.input,
    output: execution,
  });

  return {
    success: true,
    execution,
  };
};
