// ─── Multi-language problem metadata ───────────────────────────────────────
//
// A `Problem` used to store one generic `starterCode` string and infer the
// user's function name by regex-scanning whatever they typed. That breaks
// down the moment a problem supports more than one language (each language
// needs its own starter scaffold AND its own expected function name/casing —
// e.g. `twoSum` in JS/Python/Java vs `twoSum` in a C++ `Solution` class).
//
// This file is the single source of truth for that per-language shape, on
// both the DB row (`Problem.starterCodeByLang` / `Problem.functionSignatures`
// in prisma/schema.prisma) and anything that consumes it (execute controller,
// problem repository, seed script).
//
// Mirrors `frontend/src/types/problem.ts` — keep the two in sync.

export const SUPPORTED_LANGUAGES = [
  "javascript",
  "typescript",
  "python",
  "java",
  "cpp",
] as const;

export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

// Aliases users/editors may send that should resolve to a SupportedLanguage.
export const LANGUAGE_ALIASES: Record<string, SupportedLanguage> = {
  javascript: "javascript",
  js: "javascript",
  typescript: "typescript",
  ts: "typescript",
  python: "python",
  python3: "python",
  py: "python",
  java: "java",
  cpp: "cpp",
  "c++": "cpp",
};

export const normalizeLanguage = (
  language: string,
): SupportedLanguage | null => {
  const key = language.trim().toLowerCase();
  return LANGUAGE_ALIASES[key] ?? null;
};

// ─── Return-shape / data-structure extension point ─────────────────────────
//
// `dataStructure` classifies what the user's function returns, which is what
// the harness needs to know to print the result in a comparable format.
//
// Return shapes used by the problem catalogue.
// Function/array/string/boolean outputs are handled by the existing
// function harnesses. Class/design, linked-list, tree and object/graph
// problems are handled by dedicated harness branches in execute.controller.ts.
export const RETURN_DATA_STRUCTURES = [
  "primitive",
  "array",
  "array2d",
  "string",
  "boolean",
  "class",
  "object",
  "linked-list",
  "tree",
  "graph",
] as const;

export type ReturnDataStructure = (typeof RETURN_DATA_STRUCTURES)[number];

export const IMPLEMENTED_DATA_STRUCTURES: ReturnDataStructure[] = [
  "primitive",
  "array",
  "array2d",
  "string",
  "boolean",
  "class",
  "object",
  "linked-list",
  "tree",
  "graph",
];

export const isImplementedDataStructure = (
  value: ReturnDataStructure | undefined,
): boolean =>
  !value || IMPLEMENTED_DATA_STRUCTURES.includes(value);

// ─── Function signature (per language) ──────────────────────────────────────

export interface FunctionSignature {
  /** The exact identifier the user's code must define, e.g. "twoSum". */
  functionName: string;
  /** Language-native return type hint, e.g. "vector<int>", "boolean". Optional — harnesses fall back to source inspection when omitted (C++/Java). */
  returnType?: string;
  /** Ordered, language-native parameter type hints. Currently informational; harnesses infer arg shape from stdin. */
  paramTypes?: string[];
  /** What the function returns, for harness output formatting. Defaults to "primitive" when omitted. */
  dataStructure?: ReturnDataStructure;
}

export type StarterCodeMap = Partial<Record<SupportedLanguage, string>>;
export type FunctionSignatureMap = Partial<
  Record<SupportedLanguage, FunctionSignature>
>;

// ─── Row-level helpers ──────────────────────────────────────────────────────
//
// Problem rows store these as `Json?` columns, so callers get `unknown` back
// from Prisma. These narrow that safely instead of trusting a cast.

export const parseStarterCodeMap = (value: unknown): StarterCodeMap => {
  if (!value || typeof value !== "object") return {};
  return value as StarterCodeMap;
};

export const parseFunctionSignatureMap = (
  value: unknown,
): FunctionSignatureMap => {
  if (!value || typeof value !== "object") return {};
  return value as FunctionSignatureMap;
};

/**
 * Resolves the starter code for a language, falling back to the legacy
 * single-language `starterCode` column for problems that predate per-language
 * data (backward compatibility).
 */
export const resolveStarterCode = (
  starterCodeByLang: unknown,
  legacyStarterCode: string | null | undefined,
  language: SupportedLanguage,
): string => {
  const map = parseStarterCodeMap(starterCodeByLang);
  return map[language] ?? legacyStarterCode ?? "";
};

/**
 * Resolves the expected function signature for a language. Returns null when
 * nothing is configured — callers should fall back to regex-based detection
 * on the submitted source for old problems (see execute.controller.ts).
 */
export const resolveFunctionSignature = (
  functionSignatures: unknown,
  language: SupportedLanguage,
): FunctionSignature | null => {
  const map = parseFunctionSignatureMap(functionSignatures);
  return map[language] ?? null;
};
