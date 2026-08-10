import { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import axios from "axios";
import { executeRequestSchema } from "../validators/execute.validator";
import {
  isImplementedDataStructure,
  ReturnDataStructure,
} from "../types/problem.types";

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
//
// FALLBACK ONLY. The preferred path is the frontend sending an explicit
// `functionName` (sourced from `Problem.functionSignatures[language]` — see
// backend/src/types/problem.types.ts), which this file uses as-is without
// ever regex-guessing it. This regex scan only kicks in for requests that
// don't send `functionName` — e.g. older/other callers of `/api/execute`, or
// problems seeded before per-language metadata existed.


const getPrimaryClassName = (source: string, fallback?: string | null): string | null => {
  const match = source.match(/\bclass\s+([A-Za-z_$][\w$]*)/);
  return match?.[1] || fallback?.trim() || null;
};

const buildJavaScriptClassHarness = (className: string, stdin: string): string => {
  const escapedInput = JSON.stringify(stdin);
  const escapedClass = JSON.stringify(className);

  return `\n// --- AlgoAI JS Class/Design Harness ---
const __algoOps = ${escapedInput}
  .split(";")
  .map(x => x.trim())
  .filter(Boolean);
const __algoClass = eval(${escapedClass});
let __algoObj;
const __algoOut = [];

for (const __algoOp of __algoOps) {
  const __m = __algoOp.match(/^([A-Za-z_$][\\w$]*)\\s*(?:\\((.*)\\))?$/);
  if (!__m) continue;
  const __name = __m[1];
  const __raw = (__m[2] || "").trim();
  const __args = __raw ? eval("[" + __raw + "]") : [];

  if (__name === ${JSON.stringify(className)} || __name === "${className}" && !__algoObj) {
    __algoObj = new __algoClass(...__args);
    continue;
  }
  if (!__algoObj) __algoObj = new __algoClass();
  const __result = __algoObj[__name](...__args);
  if (__result !== undefined) __algoOut.push(__result);
}
console.log(__algoOut.join("; "));
`;
};

const buildPythonClassHarness = (className: string, stdin: string): string => {
  const escaped = JSON.stringify(stdin);
  return `\n# --- AlgoAI Python Class/Design Harness ---
import ast, json, re
__algo_ops = [x.strip() for x in ${escaped}.split(";") if x.strip()]
__algo_cls = ${className}
__algo_obj = None
__algo_out = []

for __op in __algo_ops:
    __m = re.match(r"^([A-Za-z_][A-Za-z0-9_]*)\\s*(?:\\((.*)\\))?$", __op)
    if not __m:
        continue
    __name, __raw = __m.group(1), (__m.group(2) or "").strip()
    __args = list(ast.literal_eval("[" + __raw + "]")) if __raw else []
    if __name == "${className}" and __algo_obj is None:
        __algo_obj = __algo_cls(*__args)
        continue
    if __algo_obj is None:
        __algo_obj = __algo_cls()
    __result = getattr(__algo_obj, __name)(*__args)
    if __result is not None:
        __algo_out.append(__result)

print(json.dumps(__algo_out))
`;
};

const buildCppClassHarness = (
  className: string,
  stdin: string,
): string => {
  const escaped = JSON.stringify(stdin)
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"');

  // LRUCache needs constructor(capacity) and only get/put methods.
  if (className === "LRUCache") {
    return `
#include <regex>
#include <sstream>

static string __algo_trim(string s) {
    while (!s.empty() && isspace((unsigned char)s.front()))
        s.erase(s.begin());

    while (!s.empty() && isspace((unsigned char)s.back()))
        s.pop_back();

    return s;
}

static vector<string> __algo_split_ops(const string& s) {
    vector<string> out;
    string cur;
    int depth = 0;

    for (char c : s) {
        if (c == '(') {
            depth++;
            cur += c;
        }
        else if (c == ')') {
            depth--;
            cur += c;
        }
        else if ((c == ',' || c == ';') && depth == 0) {
            string trimmed = __algo_trim(cur);

            if (!trimmed.empty()) {
                out.push_back(trimmed);
            }

            cur.clear();
        }
        else {
            cur += c;
        }
    }

    string trimmed = __algo_trim(cur);

    if (!trimmed.empty()) {
        out.push_back(trimmed);
    }

    return out;
}


static vector<string> __algo_args(const string& raw) {
    vector<string> out;
    string cur;
    int depth = 0;
    bool quote = false;

    for (char c : raw) {
        if (c == '"') quote = !quote;

        if (!quote && (c == '[' || c == '(' || c == '{'))
            depth++;

        if (!quote && (c == ']' || c == ')' || c == '}'))
            depth--;

        if (c == ',' && !quote && depth == 0) {
            out.push_back(__algo_trim(cur));
            cur.clear();
        } else {
            cur += c;
        }
    }

    if (!__algo_trim(cur).empty())
        out.push_back(__algo_trim(cur));

    return out;
}

static int __algo_int(const string& s) {
    return stoi(__algo_trim(s));
}

int main() {
    string __input = "${escaped}";

    vector<string> __ops = __algo_split_ops(__input);

    // First operation must be LRUCache(capacity)
   int __capacity = 0;

size_t __capPos = __input.find("capacity=");

if (__capPos != string::npos) {
    __capPos += 9;

    while (__capPos < __input.size() &&
           isspace((unsigned char)__input[__capPos])) {
        __capPos++;
    }

    while (__capPos < __input.size() &&
           isdigit((unsigned char)__input[__capPos])) {
        __capacity = __capacity * 10 +
                     (__input[__capPos] - '0');
        __capPos++;
    }
}

    ${className} __obj(__capacity);

    vector<string> __out;

    // Start from operation 1 because operation 0 was constructor.
    for (size_t __i = 1; __i < __ops.size(); ++__i) {

        string __op = __algo_trim(__ops[__i]);

        if (__op.empty())
            continue;

        auto __lp = __op.find('(');
        auto __rp = __op.rfind(')');

        string __name =
            __lp == string::npos
                ? __op
                : __op.substr(0, __lp);

        string __raw =
            (__lp == string::npos || __rp == string::npos)
                ? ""
                : __op.substr(
                    __lp + 1,
                    __rp - __lp - 1
                  );

        auto __a = __algo_args(__raw);

        if (__name == "get") {
            int __key = __algo_int(__a[0]);
            __out.push_back(to_string(__obj.get(__key)));
        }

        else if (__name == "put") {
            int __key = __algo_int(__a[0]);
            int __value = __algo_int(__a[1]);

            __obj.put(__key, __value);
        }
    }

    for (size_t i = 0; i < __out.size(); ++i) {
        if (i) cout << "; ";
        cout << __out[i];
    }

    return 0;
}
`;
  }

  // MyQueue
  if (className === "MyQueue") {
    return `
#include <regex>
#include <sstream>

static vector<string> __algo_split_ops(const string& s) {
    vector<string> out;
    string cur;

    for (char c : s) {
        if (c == ';') {
            if (!cur.empty()) out.push_back(cur);
            cur.clear();
        } else {
            cur += c;
        }
    }

    if (!cur.empty()) out.push_back(cur);
    return out;
}

static string __algo_trim(string s) {
    while (!s.empty() && isspace((unsigned char)s.front()))
        s.erase(s.begin());

    while (!s.empty() && isspace((unsigned char)s.back()))
        s.pop_back();

    return s;
}

int main() {
    string __input = "${escaped}";
    ${className} __obj;

    vector<string> __out;

    for (string __op : __algo_split_ops(__input)) {

        __op = __algo_trim(__op);

        auto __lp = __op.find('(');
        auto __rp = __op.rfind(')');

        string __name =
            __op.substr(0, __lp);

        string __raw =
            __op.substr(__lp + 1, __rp - __lp - 1);

        if (__name == "push") {
            __obj.push(stoi(__raw));
        }

        else if (__name == "pop") {
            __out.push_back(to_string(__obj.pop()));
        }

        else if (__name == "peek") {
            __out.push_back(to_string(__obj.peek()));
        }

        else if (__name == "empty") {
            __out.push_back(
                __obj.empty() ? "true" : "false"
            );
        }
    }

    for (size_t i = 0; i < __out.size(); ++i) {
        if (i) cout << "; ";
        cout << __out[i];
    }

    return 0;
}
`;
  }

  // MyHashSet
  if (className === "MyHashSet") {
    return `
static vector<string> __algo_split_ops(const string& s) {
    vector<string> out;
    string cur;

    for (char c : s) {
        if (c == ';') {
            if (!cur.empty()) out.push_back(cur);
            cur.clear();
        } else {
            cur += c;
        }
    }

    if (!cur.empty()) out.push_back(cur);
    return out;
}

static string __algo_trim(string s) {
    while (!s.empty() && isspace((unsigned char)s.front()))
        s.erase(s.begin());

    while (!s.empty() && isspace((unsigned char)s.back()))
        s.pop_back();

    return s;
}

int main() {
    string __input = "${escaped}";
    ${className} __obj;

    vector<string> __out;

    for (string __op : __algo_split_ops(__input)) {

        __op = __algo_trim(__op);

        auto __lp = __op.find('(');
        auto __rp = __op.rfind(')');

        string __name = __op.substr(0, __lp);

        string __raw =
            __op.substr(__lp + 1, __rp - __lp - 1);

        int __key = stoi(__raw);

        if (__name == "add") {
            __obj.add(__key);
        }

        else if (__name == "remove") {
            __obj.remove(__key);
        }

        else if (__name == "contains") {
            __out.push_back(
                __obj.contains(__key) ? "true" : "false"
            );
        }
    }

    for (size_t i = 0; i < __out.size(); ++i) {
        if (i) cout << "; ";
        cout << __out[i];
    }

    return 0;
}
`;
  }

  // Fallback for other class problems.
  return `
int main() {
    ${className} __obj;
    return 0;
}
`;
};

const buildJavaClassHarness = (className: string, stdin: string): string => {
  const escaped = JSON.stringify(stdin);
  return `\n// --- AlgoAI Java Class/Design Harness ---
class Main {
  public static void main(String[] args) {
    ${className} obj = new ${className}();
    String input = ${escaped};
    String[] ops = input.split("\\\\s*;\\\\s*");
    StringBuilder out = new StringBuilder("[");
    boolean first = true;
    for (String op : ops) {
      op = op.trim(); if (op.isEmpty()) continue;
      int lp = op.indexOf('('); int rp = op.lastIndexOf(')');
      String name = lp >= 0 ? op.substring(0, lp).trim() : op;
      String raw = lp >= 0 && rp > lp ? op.substring(lp + 1, rp).trim() : "";
      String[] a = raw.isEmpty() ? new String[0] : raw.split("\\\\s*,\\\\s*");
      Object r = null;
      if (name.equals("push")) { obj.push(Integer.parseInt(a[0])); }
      else if (name.equals("pop")) { r = obj.pop(); }
      else if (name.equals("peek")) { r = obj.peek(); }
      else if (name.equals("empty")) { r = obj.empty(); }
      else if (name.equals("insert")) { obj.insert(Integer.parseInt(a[0])); }
      else if (name.equals("extractMin")) { r = obj.extractMin(); }
      else if (name.equals("addNum")) { obj.addNum(Double.parseDouble(a[0])); }
      else if (name.equals("findMedian")) { r = obj.findMedian(); }
      else if (name.equals("put")) { obj.put(Integer.parseInt(a[0]), Integer.parseInt(a[1])); }
      else if (name.equals("get")) { r = obj.get(Integer.parseInt(a[0])); }
      else if (name.equals("remove")) { obj.remove(Integer.parseInt(a[0])); }
      else if (name.equals("contains")) { r = obj.contains(Integer.parseInt(a[0])); }
      else if (name.equals("search")) { r = obj.search(a[0].replaceAll("^\\\"|\\\"$", "")); }
      else if (name.equals("startsWith")) { r = obj.startsWith(a[0].replaceAll("^\\\"|\\\"$", "")); }
      if (r != null) {
        if (!first) out.append(',');
        first = false;
        if (r instanceof Boolean) out.append(r);
        else out.append(r);
      }
    }
    out.append(']'); System.out.print(out);
  }
}
`;
};

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

    const dataStructure = payload.dataStructure as ReturnDataStructure | undefined;
    if (!isImplementedDataStructure(dataStructure)) {
      res.status(400).json({
        success: false,
        status: "error",
        message: `Unsupported data structure: ${dataStructure}`,
      });
      return;
    }

    // Prefer the function name the frontend sent us (from the problem's
    // per-language `functionSignatures`). Only fall back to regex-guessing
    // it out of the user's source for requests that don't send one.
    const fnName =
      payload.functionName?.trim() ||
      getPrimaryFunctionName(userSource, normalizedLanguage);
    const className =
      dataStructure === "class"
        ? getPrimaryClassName(userSource, payload.functionName)
        : null;

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
      Boolean(fnName || className) &&
      !hasExistingMain &&
      !hasDirectOutput;

    // 2. Inject language-specific test-case harness if needed
    if (shouldInjectHarness && (fnName || className)) {
  if (dataStructure === "class" && className) {
    if (isJsOrTsLanguage) {
      finalCode += buildJavaScriptClassHarness(className, payload.stdin || "");
    } else if (isPython) {
      finalCode += buildPythonClassHarness(className, payload.stdin || "");
    } else if (isCpp) {
      finalCode = `#include <bits/stdc++.h>
using namespace std;
` + userSource + buildCppClassHarness(className, payload.stdin || "");
    } else if (isJava) {
      finalCode = `import java.util.*;
` + userSource + buildJavaClassHarness(className, payload.stdin || "");
    }
  } else if (fnName && isJsOrTsLanguage) {
    finalCode += buildJavaScriptHarness(
      fnName,
      payload.stdin || "",
    );
  }

  else if (fnName && isPython) {
    finalCode += buildPythonHarness(
      fnName,
      payload.stdin || "",
    );
  }

  else if (fnName && isCpp) {
    const cppReturnType = getCppReturnType(userSource, fnName);
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

  else if (fnName && isJava) {
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
