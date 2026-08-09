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

// ─── Language-specific DSA test harnesses ────────────────────────────────

const parseInputAssignments = (stdin: string): string[] => {
  const input = stdin.replace(/\r?\n/g, " ").trim();

  const args: string[] = [];
  let current = "";
  let depth = 0;

  for (const char of input) {
    if (char === "[" || char === "{" || char === "(") {
      depth++;
    }

    if (char === "]" || char === "}" || char === ")") {
      depth--;
    }

    if (char === "," && depth === 0) {
      args.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }

  if (current.trim()) {
    args.push(current.trim());
  }

  return args.map((arg) =>
    arg.replace(/^[A-Za-z_$][\w$]*\s*=\s*/, "").trim()
  );
};
const buildJavaScriptHarness = (
  functionName: string,
  stdin: string,
): string => {
  const escapedInput = JSON.stringify(stdin);
  const escapedFn = JSON.stringify(functionName);

  return `

// --- AlgoAI JS Test Harness ---
const __algoInput = ${escapedInput};
const __algoFnName = ${escapedFn};

const __algoNormalized = __algoInput
  .replace(/([A-Za-z_$][\\w$]*\\s*=\\s*)/g, "")
  .trim();

const __algoArgs =
  __algoNormalized.length > 0
    ? eval("[" + __algoNormalized + "]")
    : [];

const __algoFn = eval(__algoFnName);
const __algoResult = __algoFn(...__algoArgs);

if (typeof __algoResult === "string") {
  console.log(__algoResult);
} else {
  console.log(JSON.stringify(__algoResult));
}
`;
};

const buildPythonHarness = (
  functionName: string,
  stdin: string,
): string => {
  const args = parseInputAssignments(stdin);

  return `

# --- AlgoAI Python Test Harness ---
__algo_result = ${functionName}(${args.join(", ")})

if isinstance(__algo_result, str):
    print(__algo_result)
else:
    import json
    print(json.dumps(__algo_result))
`;
};

const getCppReturnType = (source: string, functionName: string): string => {
  const escapedFn = functionName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  // Match the type token(s) that sit on the SAME line, immediately before
  // "functionName(". This avoids accidentally slurping "public:" from a
  // previous line.
  const lineRegex = new RegExp(
  `^[ \\t]*([A-Za-z_][\\w<>,\\s\\*&]*?)\\s+${escapedFn}\\s*\\(`,
  "m",
);

  const match = source.match(lineRegex);
  if (!match) return "int";

  return match[1]
    .replace(/\b(public|private|protected|static|virtual|inline)\b/g, "")
    .replace(/\s+/g, " ")
    .trim();
};
const getCppParameterTypes = (
  source: string,
  functionName: string,
): string[] => {
  const escapedFn = functionName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  const match = source.match(
    new RegExp(
      `${escapedFn}\\s*\\(([^)]*)\\)`,
      "m",
    ),
  );

  if (!match) return [];

  const params = match[1].trim();

  if (!params) return [];

  return params
    .split(",")
    .map((param) => {
      // Remove parameter name:
      // vector<int>& nums -> vector<int>&
      // int target -> int
      // long long x -> long long
      return param
        .trim()
        .replace(
          /\s+[A-Za-z_][A-Za-z0-9_]*\s*$/,
          "",
        )
        .trim();
    });
};
const getJavaReturnType = (
  source: string,
  functionName: string,
): string => {
  const escapedFn = functionName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  const match = source.match(
    new RegExp(
      `(?:public|private|protected)?\\s*(?:static\\s+)?([A-Za-z_][\\w<>,\\[\\]]*)\\s+${escapedFn}\\s*\\(`,
      "m",
    ),
  );

  return match?.[1]?.trim() || "int";
};

const buildCppHarness = (
  source: string,
  functionName: string,
  stdin: string,
  returnType: string,
): string => {
  const args = parseInputAssignments(stdin);
  const parameterTypes = getCppParameterTypes(source, functionName);

  const declarations: string[] = [];
  const callArgs: string[] = [];

  args.forEach((arg, index) => {
    const trimmed = arg.trim();
    const expectedType = (parameterTypes[index] || "").trim();

    if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
      const cleanType = expectedType
        .replace(/\bconst\b/g, "")
        .replace(/&/g, "")
        .trim();

      let vectorType = cleanType;

      if (!/^(std::)?vector\s*</.test(vectorType)) {
        if (trimmed.includes('"')) {
          vectorType = "vector<string>";
        } else if (/\d+\.\d+/.test(trimmed)) {
          vectorType = "vector<double>";
        } else {
          vectorType = "vector<int>";
        }
      }

      const initializer = trimmed
        .replace(/^\[/, "{")
        .replace(/\]$/, "}");

      declarations.push(
        `${vectorType} __algo_arg${index} = ${vectorType}${initializer};`,
      );

      callArgs.push(`__algo_arg${index}`);
    } else {
      callArgs.push(trimmed);
    }
  });

  const normalizedReturnType = returnType.replace(/\s+/g, " ").trim();

  let outputCode: string;

  if (/^bool$/.test(normalizedReturnType)) {
  outputCode = `cout << (__algo_result ? "true" : "false");`;
} else if (/^(string|std::string)$/.test(normalizedReturnType)) {
  outputCode = 'cout << "\\\"" << __algo_result << "\\\"";';
} else if (
  /^(int|long long|long|double|float|unsigned|size_t)$/.test(
    normalizedReturnType,
  )
) {
  outputCode = `cout << __algo_result;`;
} else if (/vector\s*<\s*vector\s*</.test(normalizedReturnType)) {
    outputCode = `
    cout << "[";
    for (size_t i = 0; i < __algo_result.size(); i++) {
        if (i > 0) cout << ",";
        cout << "[";
        for (size_t j = 0; j < __algo_result[i].size(); j++) {
            if (j > 0) cout << ",";
            cout << __algo_result[i][j];
        }
        cout << "]";
    }
    cout << "]";
`;
  } else if (
    /vector\s*<\s*(string|std::string)\s*>/.test(normalizedReturnType)
  ) {
    outputCode = `
    cout << "[";
    for (size_t i = 0; i < __algo_result.size(); i++) {
        if (i > 0) cout << ",";
        cout << "\\"" << __algo_result[i] << "\\"";
    }
    cout << "]";
`;
  } else if (/vector\s*</.test(normalizedReturnType)) {
    outputCode = `
    cout << "[";
    for (size_t i = 0; i < __algo_result.size(); i++) {
        if (i > 0) cout << ",";
        cout << __algo_result[i];
    }
    cout << "]";
`;
  } else {
    outputCode = `cout << __algo_result;`;
  }

  return `
// --- AlgoAI C++ Test Harness ---

int main() {
    Solution solution;

    ${declarations.join("\n    ")}

    auto __algo_result = solution.${functionName}(
        ${callArgs.join(", ")}
    );

    ${outputCode}

    return 0;
}
`;
};

const buildJavaHarness = (
  source: string,
  functionName: string,
  stdin: string,
): string => {
  const args = parseInputAssignments(stdin);
  const returnType = getJavaReturnType(source, functionName);

  const javaArgs = args.map((arg) => {
    const trimmed = arg.trim();

    if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
      return `new int[]${trimmed
        .replace(/^\[/, "{")
        .replace(/\]$/, "}")}`;
    }

    return trimmed;
  });

  const normalizedReturnType = returnType
    .replace(/\s+/g, " ")
    .trim();

  let outputCode: string;

  if (normalizedReturnType === "boolean") {
    outputCode = `
        System.out.print(__algo_result ? "true" : "false");
`;
  } else if (normalizedReturnType === "String") {
    outputCode = `
        System.out.print("\\"" + __algo_result + "\\"");
`;
  } else if (normalizedReturnType.endsWith("[]")) {
    outputCode = `
        System.out.print("[");
        for (int i = 0; i < __algo_result.length; i++) {
            if (i > 0) {
                System.out.print(",");
            }
            System.out.print(__algo_result[i]);
        }
        System.out.print("]");
`;
  } else {
    outputCode = `
        System.out.print(__algo_result);
`;
  }

  return `
// --- AlgoAI Java Test Harness ---

class Main {
    public static void main(String[] args) {

        Solution solution = new Solution();

        ${normalizedReturnType} __algo_result = solution.${functionName}(
            ${javaArgs.join(", ")}
        );

        ${outputCode}
    }
}
`;
};
// ─── Function name detection (per language) ───────────────────────────────

const getPrimaryFunctionName = (
  source: string,
  language: string,
): string | null => {
  if (["javascript", "js", "typescript", "ts"].includes(language)) {
    const match = source.match(/function\s+([A-Za-z_$][\w$]*)\s*\(/);
    return match?.[1] || null;
  }

  if (language === "python" || language === "python3") {
    const match = source.match(/def\s+([A-Za-z_][A-Za-z0-9_]*)\s*\(/);
    return match?.[1] || null;
  }

  if (language === "java") {
    const match = source.match(
      /(?:public|private|protected)?\s*(?:static\s+)?[\w<>\[\]]+\s+([A-Za-z_][A-Za-z0-9_]*)\s*\([^)]*\)\s*\{/,
    );
    return match?.[1] || null;
  }

  if (language === "c++" || language === "cpp") {
    const match = source.match(
      /(?:vector\s*<[^>]+>|int|long long|string|bool|void)\s+([A-Za-z_][A-Za-z0-9_]*)\s*\([^)]*\)\s*\{/,
    );
    return match?.[1] || null;
  }

  return null;
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

    const fnName = getPrimaryFunctionName(userSource, normalizedLanguage);

    const isJsOrTsLanguage = ["javascript", "js", "typescript", "ts"].includes(
      normalizedLanguage,
    );
    const isPython = ["python", "python3"].includes(normalizedLanguage);
    const isCpp = ["c++", "cpp"].includes(normalizedLanguage);
    const isJava = normalizedLanguage === "java";

    const hasExistingMain = /\bmain\s*\(/.test(userSource);

    const hasDirectOutput =
      /console\.log|process\.stdout\.write|print\s*\(|System\.out\.print|cout\s*<</.test(
        userSource,
      );

    const shouldInjectHarness =
      Boolean(payload.stdin?.trim()) &&
      Boolean(fnName) &&
      !hasExistingMain &&
      !hasDirectOutput;

    // 2. Inject language-specific test-case harness if needed
    if (shouldInjectHarness && fnName) {
  if (isJsOrTsLanguage) {
    finalCode += buildJavaScriptHarness(
      fnName,
      payload.stdin || "",
    );
  }

  else if (isPython) {
    finalCode += buildPythonHarness(
      fnName,
      payload.stdin || "",
    );
  }

  else if (isCpp) {
    const cppReturnType = fnName ? getCppReturnType(userSource, fnName) : "int";
    console.log("FUNCTION:", fnName);
console.log("RETURN TYPE:", cppReturnType);

    // C++ headers MUST come before Solution class
    finalCode =
      `#include <bits/stdc++.h>
using namespace std;

` +
      userSource +
      buildCppHarness(
  userSource,
  fnName,
  payload.stdin || "",
  cppReturnType,
)
  }

  else if (isJava) {
    // Java imports MUST come before Solution class
    finalCode =
      `import java.util.*;

` +
      userSource +
      buildJavaHarness(
  userSource,
  fnName,
  payload.stdin || "",
)
  }
}

    // 3. Send to Judge0
    if (isCpp) {
  console.log("===== GENERATED CPP =====");
  console.log(finalCode);
  console.log("========================");
}
    const encodedSourceCode = Buffer
  .from(finalCode, "utf8")
  .toString("base64");

const response = await axios.post(
  `${JUDGE0_API_URL}/submissions/?base64_encoded=true&wait=true`,
  {
    source_code: encodedSourceCode,
    language_id: languageId,
    stdin:
      shouldInjectHarness && fnName
        ? ""
        : payload.stdin || "",
  },
  { timeout: 20000 },
);

 const {
    stdout,
    stderr,
    compile_output,
    message,
    status,
    time,
    memory,
  } = response.data;

  if (!status) {
    throw new Error(
      `Judge0 returned an unexpected response: ${JSON.stringify(response.data)}`
    );
  }

  const hasError = status.id !== 3;

  const decodeBase64Field = (value: string | null | undefined): string => {
    if (!value) return "";
    try {
      return Buffer.from(value, "base64").toString("utf8");
    } catch {
      return value;
    }
  };

  const decodedStdout = decodeBase64Field(stdout);
  const decodedStderr = decodeBase64Field(stderr);
  const decodedCompileOutput = decodeBase64Field(compile_output);
  const decodedMessage = decodeBase64Field(message);

  res.status(200).json({
    success: true,
    run: {
      stdout: hasError ? "" : decodedStdout,
      stderr: hasError
        ? decodedStderr || decodedCompileOutput || decodedMessage || status.description
        : "",
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
