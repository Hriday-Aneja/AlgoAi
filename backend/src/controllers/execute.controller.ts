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

      let initializer = trimmed
  .replace(/\[/g, "{")
  .replace(/\]/g, "}");

if (/^vector\s*<\s*vector\s*<\s*char\s*>\s*>$/i.test(vectorType)) {
  initializer = initializer.replace(
    /(?<!['"])(\b[01]\b)(?!['"])/g,
    "'$1'"
  );
}
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

const getJavaParameterTypes = (source: string, functionName: string): string[] => {
  const escapedFn = functionName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = source.match(new RegExp(
    `(?:public|private|protected)?\\s*(?:static\\s+)?[A-Za-z_][\\w<>,\\[\\]]*\\s+${escapedFn}\\s*\\(([^)]*)\\)`,
    "m",
  ));
  if (!match || !match[1].trim()) return [];
  return match[1].split(",").map((param) =>
    param.trim()
      .replace(/\bfinal\b\s*/g, "")
      .replace(/\s+[A-Za-z_$][\w$]*\s*$/, "")
      .trim(),
  );
};

const javaLiteralFromInput = (raw: string, expectedType: string): string => {
  const trimmed = raw.trim();
  const type = expectedType.replace(/\s+/g, "");
  if (!type.includes("[]")) return trimmed;

  let value = trimmed.replace(/\[/g, "{").replace(/\]/g, "}");

  if (/^String(?:\[\])+$/.test(type)) {
    value = value.replace(/(?<!["'])\b\d+\b(?!["'])/g, '"$&"');
  } else if (/^char(?:\[\])+$/.test(type)) {
    value = value.replace(/"([^"\\\\])"/g, "'$1'");
  } else if (/^boolean(?:\[\])+$/.test(type)) {
    value = value.replace(/"?(true|false)"?/gi, "$1");
  }

  return `new ${type}${value}`;
};

const buildJavaHarness = (
  source: string,
  functionName: string,
  stdin: string,
): string => {
  const args = parseInputAssignments(stdin);
  const returnType = getJavaReturnType(source, functionName);

  const parameterTypes = getJavaParameterTypes(source, functionName);

  const javaArgs = args.map((arg, index) => {
    const trimmed = arg.trim();
    const expectedType = parameterTypes[index] || "";

    if (trimmed.startsWith("[") && trimmed.endsWith("]") && expectedType.includes("[]")) {
      return javaLiteralFromInput(trimmed, expectedType);
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
        System.out.print(__algoSerializeArray(__algo_result));
`;
  } else {
    outputCode = `
        System.out.print(__algo_result);
`;
  }

  return `
// --- AlgoAI Java Test Harness ---

class Main {
    private static String __algoSerializeArray(Object value) {
    if (value == null) return "null";
    if (!value.getClass().isArray()) {
        if (value instanceof String || value instanceof Character) return "\\"" + value + "\\"";
        return String.valueOf(value);
    }
    int length = java.lang.reflect.Array.getLength(value);
    StringBuilder out = new StringBuilder("[");
    for (int i = 0; i < length; i++) {
        if (i > 0) out.append(",");
        out.append(__algoSerializeArray(java.lang.reflect.Array.get(value, i)));
    }
    out.append("]");
    return out.toString();
}

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

const isNodeDataStructure = (
  value: ReturnDataStructure | undefined,
): value is Extract<ReturnDataStructure, "linked-list" | "tree" | "graph"> =>
  value === "linked-list" || value === "tree" || value === "graph";

const hasClassDefinition = (source: string, className: string): boolean =>
  new RegExp(`\\b(?:class|struct)\\s+${className}\\b`).test(source);

const buildJavaScriptNodeHarness = (
  source: string,
  functionName: string,
  stdin: string,
  dataStructure: Extract<ReturnDataStructure, "linked-list" | "tree" | "graph">,
): string => {
  const escapedInput = JSON.stringify(stdin);
  const prelude: string[] = [];

  if (!hasClassDefinition(source, "ListNode")) {
    prelude.push(`class ListNode {
  constructor(val = 0, next = null) {
    this.val = val;
    this.next = next;
  }
}`);
  }

  if (!hasClassDefinition(source, "TreeNode")) {
    prelude.push(`class TreeNode {
  constructor(val = 0, left = null, right = null) {
    this.val = val;
    this.left = left;
    this.right = right;
  }
}`);
  }

  if (!hasClassDefinition(source, "Node")) {
    prelude.push(`class Node {
  constructor(val = 0, neighbors = []) {
    this.val = val;
    this.neighbors = neighbors;
  }
}`);
  }

  const buildArgExpr =
    dataStructure === "linked-list"
      ? `Array.isArray(arg) ? __algoBuildList(arg) : arg`
      : dataStructure === "tree"
      ? `Array.isArray(arg) ? __algoBuildTree(arg) : arg`
      : `Array.isArray(arg) ? __algoBuildGraph(arg) : arg`;

  const serializeExpr =
    dataStructure === "linked-list"
      ? `__algoSerializeList(__algoResult)`
      : dataStructure === "tree"
      ? `__algoSerializeTree(__algoResult)`
      : `__algoSerializeGraph(__algoResult)`;

  return `${prelude.join("\n\n")}

// --- AlgoAI JS Node Harness ---
const __algoInput = ${escapedInput};
const __algoFnName = ${JSON.stringify(functionName)};

const __algoNormalized = __algoInput
  .replace(/([A-Za-z_$][\\w$]*\\s*=\\s*)/g, "")
  .trim();

const __algoArgs =
  __algoNormalized.length > 0
    ? eval("[" + __algoNormalized + "]")
    : [];

const __algoBuildList = (values) => {
  if (!Array.isArray(values) || values.length === 0) return null;
  const head = new ListNode(values[0]);
  let current = head;
  for (let i = 1; i < values.length; i++) {
    current.next = new ListNode(values[i]);
    current = current.next;
  }
  return head;
};

const __algoBuildTree = (values) => {
  if (!Array.isArray(values) || values.length === 0 || values[0] == null) return null;
  const root = new TreeNode(values[0]);
  const queue = [root];
  let index = 1;

  while (queue.length > 0 && index < values.length) {
    const node = queue.shift();
    if (!node) continue;

    if (index < values.length) {
      const leftValue = values[index++];
      if (leftValue != null) {
        node.left = new TreeNode(leftValue);
        queue.push(node.left);
      }
    }

    if (index < values.length) {
      const rightValue = values[index++];
      if (rightValue != null) {
        node.right = new TreeNode(rightValue);
        queue.push(node.right);
      }
    }
  }

  return root;
};

const __algoBuildGraph = (adjacency) => {
  if (!Array.isArray(adjacency) || adjacency.length === 0) return null;
  const nodes = adjacency.map((_, index) => new Node(index + 1, []));

  adjacency.forEach((neighbors, index) => {
    if (!Array.isArray(neighbors)) return;
    nodes[index].neighbors = neighbors
      .map((neighborValue) => nodes[(neighborValue || 0) - 1])
      .filter(Boolean);
  });

  return nodes[0] ?? null;
};

const __algoSerializeList = (head) => {
  const values = [];
  const seen = new Set();
  let current = head;

  while (current && !seen.has(current)) {
    seen.add(current);
    values.push(current.val);
    current = current.next;
  }

  return values;
};

const __algoSerializeTree = (root) => {
  if (!root) return [];
  const values = [];
  const queue = [root];

  while (queue.length > 0) {
    const node = queue.shift();
    if (!node) {
      values.push(null);
      continue;
    }

    values.push(node.val);
    queue.push(node.left);
    queue.push(node.right);
  }

  while (values.length > 0 && values[values.length - 1] == null) {
    values.pop();
  }

  return values;
};

const __algoSerializeGraph = (node) => {
  if (!node) return [];
  const queue = [node];
  const seen = new Set([node]);
  const order = [];

  while (queue.length > 0) {
    const current = queue.shift();
    order.push(current);
    for (const neighbor of current.neighbors || []) {
      if (neighbor && !seen.has(neighbor)) {
        seen.add(neighbor);
        queue.push(neighbor);
      }
    }
  }

  return order.map((current) => (current.neighbors || []).map((neighbor) => neighbor?.val ?? null));
};

const __algoFn = eval(__algoFnName);
const __algoResult = __algoFn(
  ...__algoArgs.map((arg) => ${buildArgExpr})
);

console.log(JSON.stringify(${serializeExpr}));
`;
};

const buildPythonNodeHarness = (
  source: string,
  functionName: string,
  stdin: string,
  dataStructure: Extract<ReturnDataStructure, "linked-list" | "tree" | "graph">,
): string => {
  const escaped = JSON.stringify(stdin);
  const prelude: string[] = [];

  if (!hasClassDefinition(source, "ListNode")) {
    prelude.push(`class ListNode:
    def __init__(self, val=0, next=None):
        self.val = val
        self.next = next`);
  }

  if (!hasClassDefinition(source, "TreeNode")) {
    prelude.push(`class TreeNode:
    def __init__(self, val=0, left=None, right=None):
        self.val = val
        self.left = left
        self.right = right`);
  }

  if (!hasClassDefinition(source, "Node")) {
    prelude.push(`class Node:
    def __init__(self, val=0, neighbors=None):
        self.val = val
        self.neighbors = neighbors or []`);
  }

  const buildArgExpr =
    dataStructure === "linked-list"
      ? `__algo_build_list(arg) if isinstance(arg, list) else arg`
      : dataStructure === "tree"
      ? `__algo_build_tree(arg) if isinstance(arg, list) else arg`
      : `__algo_build_graph(arg) if isinstance(arg, list) else arg`;

  const serializeExpr =
    dataStructure === "linked-list"
      ? `__algo_serialize_list(__algo_result)`
      : dataStructure === "tree"
      ? `__algo_serialize_tree(__algo_result)`
      : `__algo_serialize_graph(__algo_result)`;

  return `${prelude.join("\n\n")}

# --- AlgoAI Python Node Harness ---
import ast
import json

__algo_input = ${escaped}
__algo_args = ast.literal_eval("[" + __algo_input + "]") if __algo_input.strip() else []

def __algo_build_list(values):
    if not isinstance(values, list) or not values:
        return None
    head = ListNode(values[0])
    current = head
    for value in values[1:]:
        current.next = ListNode(value)
        current = current.next
    return head

def __algo_build_tree(values):
    if not isinstance(values, list) or not values or values[0] is None:
        return None
    root = TreeNode(values[0])
    queue = [root]
    index = 1
    while queue and index < len(values):
        node = queue.pop(0)
        if node is None:
            continue
        if index < len(values):
            left_value = values[index]
            index += 1
            if left_value is not None:
                node.left = TreeNode(left_value)
                queue.append(node.left)
        if index < len(values):
            right_value = values[index]
            index += 1
            if right_value is not None:
                node.right = TreeNode(right_value)
                queue.append(node.right)
    return root

def __algo_build_graph(adjacency):
    if not isinstance(adjacency, list) or not adjacency:
        return None
    nodes = [Node(i + 1, []) for i in range(len(adjacency))]
    for index, neighbors in enumerate(adjacency):
        if not isinstance(neighbors, list):
            continue
        nodes[index].neighbors = [nodes[neighbor - 1] for neighbor in neighbors if isinstance(neighbor, int) and 1 <= neighbor <= len(nodes)]
    return nodes[0]

def __algo_serialize_list(head):
    values = []
    seen = set()
    current = head
    while current is not None and id(current) not in seen:
        seen.add(id(current))
        values.append(current.val)
        current = current.next
    return values

def __algo_serialize_tree(root):
    if root is None:
        return []
    values = []
    queue = [root]
    while queue:
        node = queue.pop(0)
        if node is None:
            values.append(None)
            continue
        values.append(node.val)
        queue.append(node.left)
        queue.append(node.right)
    while values and values[-1] is None:
        values.pop()
    return values

def __algo_serialize_graph(node):
    if node is None:
        return []
    queue = [node]
    seen = {id(node)}
    order = []
    while queue:
        current = queue.pop(0)
        order.append(current)
        for neighbor in current.neighbors or []:
            if neighbor is not None and id(neighbor) not in seen:
                seen.add(id(neighbor))
                queue.append(neighbor)
    return [[neighbor.val for neighbor in current.neighbors or [] if neighbor is not None] for current in order]

__algo_fn = eval(${JSON.stringify(functionName)})
__algo_result = __algo_fn(*[${buildArgExpr} for arg in __algo_args])

print(json.dumps(${serializeExpr}))
`;
};

const buildJavaNodeHarness = (
  source: string,
  functionName: string,
  stdin: string,
  dataStructure: Extract<ReturnDataStructure, "linked-list" | "tree" | "graph">,
): string => {
  const escaped = JSON.stringify(stdin);
  const helperClasses: string[] = [];

  if (!hasClassDefinition(source, "ListNode")) {
    helperClasses.push(`class ListNode {
  int val;
  ListNode next;
  ListNode(int val) { this.val = val; }
  ListNode(int val, ListNode next) { this.val = val; this.next = next; }
}`);
  }

  if (!hasClassDefinition(source, "TreeNode")) {
    helperClasses.push(`class TreeNode {
  int val;
  TreeNode left;
  TreeNode right;
  TreeNode(int val) { this.val = val; }
  TreeNode(int val, TreeNode left, TreeNode right) {
    this.val = val;
    this.left = left;
    this.right = right;
  }
}`);
  }

  if (!hasClassDefinition(source, "Node")) {
    helperClasses.push(`class Node {
  int val;
  java.util.List<Node> neighbors;
  Node(int val) {
    this.val = val;
    this.neighbors = new java.util.ArrayList<>();
  }
}`);
  }

  const nodeType =
    dataStructure === "linked-list"
      ? "ListNode"
      : dataStructure === "tree"
      ? "TreeNode"
      : "Node";

  const serializer =
    dataStructure === "linked-list"
      ? "serializeList"
      : dataStructure === "tree"
      ? "serializeTree"
      : "serializeGraph";

  const serializedResultExpr =
    dataStructure === "linked-list"
      ? `__AlgoDS.serializeList((ListNode) __algo_result)`
      : dataStructure === "tree"
      ? `__AlgoDS.serializeTree((TreeNode) __algo_result)`
      : `__AlgoDS.serializeGraph((Node) __algo_result)`;

  return `${helperClasses.join("\n\n")}

class __AlgoDS {
   static java.util.List<String> parseArguments(String raw) {
    java.util.List<String> values = new java.util.ArrayList<>();
    if (raw == null) return values;

    String text = raw.trim();
    if (text.isEmpty()) return values;

    StringBuilder current = new StringBuilder();
    int depth = 0;
    boolean inString = false;
    for (int i = 0; i < text.length(); i++) {
      char ch = text.charAt(i);
      if (ch == '"' && (i == 0 || text.charAt(i - 1) != '\\\\')) {
        inString = !inString;
      }
      if (!inString) {
        if (ch == '[' || ch == '{' || ch == '(') depth++;
        if (ch == ']' || ch == '}' || ch == ')') depth--;
      }
      if (ch == ',' && depth == 0 && !inString) {
        String token = current.toString().trim();
        if (!token.isEmpty()) values.add(token);
        current.setLength(0);
      } else {
        current.append(ch);
      }
    }

    String token = current.toString().trim();
    if (!token.isEmpty()) values.add(token);
    return values;
  }

  private static java.util.List<String> parseElements(String raw) {
    java.util.List<String> values = new java.util.ArrayList<>();
    if (raw == null) return values;

    String text = raw.trim();
    if (text.isEmpty()) return values;
    if (text.startsWith("[") && text.endsWith("]")) {
      text = text.substring(1, text.length() - 1);
    }

    StringBuilder current = new StringBuilder();
    int depth = 0;
    boolean inString = false;
    for (int i = 0; i < text.length(); i++) {
      char ch = text.charAt(i);
      if (ch == '"' && (i == 0 || text.charAt(i - 1) != '\\\\')) {
        inString = !inString;
      }
      if (!inString) {
        if (ch == '[' || ch == '{' || ch == '(') depth++;
        if (ch == ']' || ch == '}' || ch == ')') depth--;
      }
      if (ch == ',' && depth == 0 && !inString) {
        String element = current.toString().trim();
        if (!element.isEmpty()) values.add(element);
        current.setLength(0);
      } else {
        current.append(ch);
      }
    }

    String element = current.toString().trim();
    if (!element.isEmpty()) values.add(element);
    return values;
  }

  private static Integer parseNullableInt(String token) {
    String value = token.trim();
    if (value.equalsIgnoreCase("null")) return null;
    if (value.length() >= 2 && value.charAt(0) == '"' && value.charAt(value.length() - 1) == '"') {
      value = value.substring(1, value.length() - 1);
    }
    return Integer.parseInt(value);
  }

  static ListNode buildList(String raw) {
    java.util.List<String> values = parseElements(raw);
    if (values.isEmpty()) return null;
    ListNode dummy = new ListNode(0);
    ListNode current = dummy;
    for (String token : values) {
      Integer value = parseNullableInt(token);
      if (value == null) continue;
      current.next = new ListNode(value);
      current = current.next;
    }
    return dummy.next;
  }

  static TreeNode buildTree(String raw) {
    java.util.List<String> values = parseElements(raw);
    if (values.isEmpty()) return null;
    Integer rootValue = parseNullableInt(values.get(0));
    if (rootValue == null) return null;
    TreeNode root = new TreeNode(rootValue);
    java.util.Queue<TreeNode> queue = new java.util.ArrayDeque<>();
    queue.add(root);
    int index = 1;
    while (!queue.isEmpty() && index < values.size()) {
      TreeNode node = queue.poll();
      if (index < values.size()) {
        Integer leftValue = parseNullableInt(values.get(index++));
        if (leftValue != null) {
          node.left = new TreeNode(leftValue);
          queue.add(node.left);
        }
      }
      if (index < values.size()) {
        Integer rightValue = parseNullableInt(values.get(index++));
        if (rightValue != null) {
          node.right = new TreeNode(rightValue);
          queue.add(node.right);
        }
      }
    }
    return root;
  }

  static Node buildGraph(String raw) {
    java.util.List<String> rows = parseElements(raw);
    if (rows.isEmpty()) return null;
    java.util.List<Node> nodes = new java.util.ArrayList<>();
    for (int i = 0; i < rows.size(); i++) {
      nodes.add(new Node(i + 1));
    }
    for (int i = 0; i < rows.size(); i++) {
      java.util.List<String> neighbors = parseElements(rows.get(i));
      for (String token : neighbors) {
        Integer value = parseNullableInt(token);
        if (value != null && value >= 1 && value <= nodes.size()) {
          nodes.get(i).neighbors.add(nodes.get(value - 1));
        }
      }
    }
    return nodes.get(0);
  }

  static String serializeList(ListNode head) {
    java.util.List<Integer> values = new java.util.ArrayList<>();
    java.util.Set<ListNode> seen = java.util.Collections.newSetFromMap(new java.util.IdentityHashMap<>());
    while (head != null && !seen.contains(head)) {
      seen.add(head);
      values.add(head.val);
      head = head.next;
    }
    return values.toString();
  }

  static String serializeTree(TreeNode root) {
    if (root == null) return "[]";
    java.util.List<Integer> values = new java.util.ArrayList<>();
    java.util.Queue<TreeNode> queue = new java.util.ArrayDeque<>();
    queue.add(root);
    while (!queue.isEmpty()) {
      TreeNode node = queue.poll();
      if (node == null) {
        values.add(null);
        continue;
      }
      values.add(node.val);
      queue.add(node.left);
      queue.add(node.right);
    }
    int last = values.size() - 1;
    while (last >= 0 && values.get(last) == null) last--;
    return values.subList(0, last + 1).toString();
  }

  static String serializeGraph(Node node) {
    if (node == null) return "[]";
    java.util.List<Node> order = new java.util.ArrayList<>();
    java.util.Queue<Node> queue = new java.util.ArrayDeque<>();
    java.util.Set<Node> seen = java.util.Collections.newSetFromMap(new java.util.IdentityHashMap<>());
    queue.add(node);
    seen.add(node);
    while (!queue.isEmpty()) {
      Node current = queue.poll();
      order.add(current);
      for (Node neighbor : current.neighbors) {
        if (neighbor != null && !seen.contains(neighbor)) {
          seen.add(neighbor);
          queue.add(neighbor);
        }
      }
    }
    java.util.List<java.util.List<Integer>> adjacency = new java.util.ArrayList<>();
    for (Node current : order) {
      java.util.List<Integer> row = new java.util.ArrayList<>();
      for (Node neighbor : current.neighbors) {
        if (neighbor != null) row.add(neighbor.val);
      }
      adjacency.add(row);
    }
    return adjacency.toString();
  }
}

// --- AlgoAI Java Node Harness ---
class Main {
  public static void main(String[] args) {
    Solution solution = new Solution();
    String input = ${escaped};

    java.util.List<String> rawArgs = __AlgoDS.parseArguments(input);
    Object[] callArgs = new Object[rawArgs.size()];

    for (int i = 0; i < rawArgs.size(); i++) {
      String trimmed = rawArgs.get(i).trim();
      int equalsIndex = trimmed.indexOf('=');
      if (equalsIndex >= 0) {
        trimmed = trimmed.substring(equalsIndex + 1).trim();
      }

      if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
        if ("${dataStructure}".equals("linked-list")) {
          callArgs[i] = __AlgoDS.buildList(trimmed);
        } else if ("${dataStructure}".equals("tree")) {
          callArgs[i] = __AlgoDS.buildTree(trimmed);
        } else {
          callArgs[i] = __AlgoDS.buildGraph(trimmed);
        }
      } else if (trimmed.length() >= 2 && trimmed.charAt(0) == '"' && trimmed.charAt(trimmed.length() - 1) == '"') {
        callArgs[i] = trimmed.substring(1, trimmed.length() - 1);
      } else if (trimmed.equalsIgnoreCase("true") || trimmed.equalsIgnoreCase("false")) {
        callArgs[i] = Boolean.parseBoolean(trimmed);
      } else {
        try {
          callArgs[i] = Integer.parseInt(trimmed);
        } catch (NumberFormatException ex) {
          try {
            callArgs[i] = Double.parseDouble(trimmed);
          } catch (NumberFormatException ex2) {
            callArgs[i] = trimmed;
          }
        }
      }
    }

    Object __algo_result = null;
    try {
      java.lang.reflect.Method target = null;
      for (java.lang.reflect.Method method : Solution.class.getDeclaredMethods()) {
        if (method.getName().equals("${functionName}") && method.getParameterCount() == callArgs.length) {
          target = method;
          break;
        }
      }

      if (target == null) {
        throw new RuntimeException("Unable to find matching method for ${functionName}");
      }

      target.setAccessible(true);
      __algo_result = target.invoke(solution, callArgs);
    } catch (Exception error) {
      throw new RuntimeException(error);
    }

    System.out.print(${serializedResultExpr});
  }
}
`;
};

const buildCppNodeHarness = (
  source: string,
  functionName: string,
  stdin: string,
  dataStructure: Extract<ReturnDataStructure, "linked-list" | "tree" | "graph">,
): string => {
  const args = parseInputAssignments(stdin);
  const helperPrelude: string[] = [];

  if (!hasClassDefinition(source, "ListNode")) {
    helperPrelude.push(`struct ListNode {
    int val;
    ListNode* next;
    ListNode(int x = 0) : val(x), next(nullptr) {}
};`);
  }

  if (!hasClassDefinition(source, "TreeNode")) {
    helperPrelude.push(`struct TreeNode {
    int val;
    TreeNode* left;
    TreeNode* right;
    TreeNode(int x = 0) : val(x), left(nullptr), right(nullptr) {}
};`);
  }

  if (!hasClassDefinition(source, "Node")) {
    helperPrelude.push(`class Node {
public:
    int val;
    std::vector<Node*> neighbors;
    Node() : val(0), neighbors() {}
    Node(int _val) : val(_val), neighbors() {}
};`);
  }

  const nodeType =
    dataStructure === "linked-list"
      ? "ListNode*"
      : dataStructure === "tree"
      ? "TreeNode*"
      : "Node*";

  const mappedArgs = args.map((arg) => {
    const trimmed = arg.trim();
    if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
      if (dataStructure === "linked-list") {
        return `__algoBuildList(${JSON.stringify(trimmed)})`;
      }
      if (dataStructure === "tree") {
        return `__algoBuildTree(${JSON.stringify(trimmed)})`;
      }
      return `__algoBuildGraph(${JSON.stringify(trimmed)})`;
    }
    return trimmed;
  });

  const serializer =
    dataStructure === "linked-list"
      ? "__algoSerializeList"
      : dataStructure === "tree"
      ? "__algoSerializeTree"
      : "__algoSerializeGraph";

    return `${helperPrelude.join("\n\n")}

  ${source}

  static string __algoTrim(const string& s) {
    size_t start = 0;
    while (start < s.size() && isspace(static_cast<unsigned char>(s[start]))) {
      ++start;
    }

    size_t end = s.size();
    while (end > start && isspace(static_cast<unsigned char>(s[end - 1]))) {
      --end;
    }

    return s.substr(start, end - start);
  }

  static vector<string> __algoParseElements(const string& raw) {
    vector<string> values;
    string text = __algoTrim(raw);

    if (text.size() >= 2 && text.front() == '[' && text.back() == ']') {
      text = text.substr(1, text.size() - 2);
    }

    string current;
    int depth = 0;

    for (char ch : text) {
      if (ch == '[') {
        depth++;
      } else if (ch == ']') {
        depth--;
      }

      if (ch == ',' && depth == 0) {
        string token = __algoTrim(current);
        if (!token.empty()) values.push_back(token);
        current.clear();
      } else {
        current.push_back(ch);
      }
    }

    string token = __algoTrim(current);
    if (!token.empty()) values.push_back(token);
    return values;
  }

  static int __algoParseInt(const string& token) {
    return stoi(__algoTrim(token));
  }

  static ListNode* __algoBuildList(const string& raw) {
    vector<string> values = __algoParseElements(raw);
    if (values.empty()) return nullptr;

    ListNode dummy(0);
    ListNode* current = &dummy;

    for (const string& token : values) {
      if (token == "null") continue;
      current->next = new ListNode(__algoParseInt(token));
      current = current->next;
    }

    return dummy.next;
  }

  static TreeNode* __algoBuildTree(const string& raw) {
    vector<string> values = __algoParseElements(raw);
    if (values.empty() || values[0] == "null") return nullptr;

    TreeNode* root = new TreeNode(__algoParseInt(values[0]));
    queue<TreeNode*> nodes;
    nodes.push(root);

    size_t index = 1;
    while (!nodes.empty() && index < values.size()) {
      TreeNode* node = nodes.front();
      nodes.pop();

      if (index < values.size() && values[index] != "null") {
        node->left = new TreeNode(__algoParseInt(values[index]));
        nodes.push(node->left);
      }
      ++index;

      if (index < values.size() && values[index] != "null") {
        node->right = new TreeNode(__algoParseInt(values[index]));
        nodes.push(node->right);
      }
      ++index;
    }

    return root;
  }

  static Node* __algoBuildGraph(const string& raw) {
    vector<string> rows = __algoParseElements(raw);
    if (rows.empty()) return nullptr;

    vector<Node*> nodes;
    nodes.reserve(rows.size());
    for (size_t i = 0; i < rows.size(); ++i) {
      nodes.push_back(new Node(static_cast<int>(i + 1)));
    }

    for (size_t i = 0; i < rows.size(); ++i) {
      vector<string> neighbors = __algoParseElements(rows[i]);
      for (const string& token : neighbors) {
        if (token == "null") continue;
        int index = __algoParseInt(token) - 1;
        if (index >= 0 && static_cast<size_t>(index) < nodes.size()) {
          nodes[i]->neighbors.push_back(nodes[index]);
        }
      }
    }

    return nodes.front();
  }

  static string __algoSerializeList(ListNode* head) {
    vector<int> values;
    unordered_set<ListNode*> seen;

    while (head && !seen.count(head)) {
      seen.insert(head);
      values.push_back(head->val);
      head = head->next;
    }

    ostringstream out;
    out << "[";
    for (size_t i = 0; i < values.size(); ++i) {
      if (i > 0) out << ",";
      out << values[i];
    }
    out << "]";
    return out.str();
  }

  static string __algoSerializeTree(TreeNode* root) {
    if (!root) return "[]";

    vector<string> values;
    queue<TreeNode*> nodes;
    nodes.push(root);

    while (!nodes.empty()) {
      TreeNode* node = nodes.front();
      nodes.pop();

      if (!node) {
        values.push_back("null");
        continue;
      }

      values.push_back(to_string(node->val));
      nodes.push(node->left);
      nodes.push(node->right);
    }

    while (!values.empty() && values.back() == "null") {
      values.pop_back();
    }

    ostringstream out;
    out << "[";
    for (size_t i = 0; i < values.size(); ++i) {
      if (i > 0) out << ",";
      out << values[i];
    }
    out << "]";
    return out.str();
  }

  static string __algoSerializeGraph(Node* node) {
    if (!node) return "[]";

    vector<Node*> order;
    queue<Node*> nodes;
    unordered_set<Node*> seen;
    nodes.push(node);
    seen.insert(node);

    while (!nodes.empty()) {
      Node* current = nodes.front();
      nodes.pop();
      order.push_back(current);

      for (Node* neighbor : current->neighbors) {
        if (neighbor && !seen.count(neighbor)) {
          seen.insert(neighbor);
          nodes.push(neighbor);
        }
      }
    }

    ostringstream out;
    out << "[";
    for (size_t i = 0; i < order.size(); ++i) {
      if (i > 0) out << ",";
      out << "[";
      for (size_t j = 0; j < order[i]->neighbors.size(); ++j) {
        if (j > 0) out << ",";
        out << order[i]->neighbors[j]->val;
      }
      out << "]";
    }
    out << "]";
    return out.str();
  }

  int main() {
    Solution solution;

    ${nodeType} __algo_result = solution.${functionName}(
      ${mappedArgs.join(", ")}
    );

    cout << ${serializer}(__algo_result);
    return 0;
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
  } else if (isNodeDataStructure(dataStructure) && fnName) {
    if (isJsOrTsLanguage) {
      finalCode += buildJavaScriptNodeHarness(
        userSource,
        fnName,
        payload.stdin || "",
        dataStructure,
      );
    } else if (isPython) {
      finalCode += buildPythonNodeHarness(
        userSource,
        fnName,
        payload.stdin || "",
        dataStructure,
      );
    } else if (isCpp) {
      finalCode = `#include <bits/stdc++.h>
    using namespace std;
    ` + buildCppNodeHarness(
        userSource,
        fnName,
        payload.stdin || "",
        dataStructure,
      );
    } else if (isJava) {
      finalCode = `import java.util.*;
` + userSource + buildJavaNodeHarness(
        userSource,
        fnName,
        payload.stdin || "",
        dataStructure,
      );
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