import { parse } from "acorn";

export type ParsedProgram = ReturnType<typeof parse>;

type HttpError = Error & { statusCode?: number };

const createHttpError = (statusCode: number, message: string): HttpError => {
  const error = new Error(message) as HttpError;
  error.statusCode = statusCode;
  return error;
};

export const parseJavaScriptCode = (code: string): ParsedProgram => {
  try {
    const ast = parse(code, {
      ecmaVersion: "latest",
      sourceType: "script",
      locations: true,
      allowAwaitOutsideFunction: false,
      allowReturnOutsideFunction: false,
    });

    return ast;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unsupported JavaScript syntax.";
    throw createHttpError(400, `Failed to parse JavaScript code: ${message}`);
  }
};

const UNSUPPORTED_NODE_TYPES = new Set<string>([
  "ImportDeclaration",
  "ExportDefaultDeclaration",
  "ExportNamedDeclaration",
  "ExportAllDeclaration",
  "AwaitExpression",
  "ForAwaitStatement",
]);

export const validateSupportedJavaScriptAst = (ast: ParsedProgram): void => {
  const stack: any[] = [ast];

  while (stack.length > 0) {
    const node = stack.pop();

    if (!node || typeof node !== "object") {
      continue;
    }

    if (typeof node.type === "string") {
      if (UNSUPPORTED_NODE_TYPES.has(node.type)) {
        throw createHttpError(
          400,
          `Unsupported syntax for visualizer: ${node.type}.`,
        );
      }

      if (
        (node.type === "FunctionDeclaration" ||
          node.type === "FunctionExpression" ||
          node.type === "ArrowFunctionExpression") &&
        (node as any).async
      ) {
        throw createHttpError(
          400,
          "Async functions are not supported yet for visualization.",
        );
      }
    }

    for (const value of Object.values(node)) {
      if (Array.isArray(value)) {
        for (const child of value) {
          if (child && typeof child === "object") {
            stack.push(child);
          }
        }
      } else if (value && typeof value === "object") {
        stack.push(value);
      }
    }
  }
};
