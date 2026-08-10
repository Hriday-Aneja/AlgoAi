// ─── Multi-language problem metadata (frontend mirror) ─────────────────────
//
// Mirrors backend/src/types/problem.types.ts — keep the two in sync. This is
// the shared shape for `Problem.starterCodeByLang` / `Problem.functionSignatures`
// as returned by GET /api/problems/:id, consumed by the language selector and
// the Run/Submit flow in ProblemDetail.tsx.

export const SUPPORTED_LANGUAGES = [
  "javascript",
  "typescript",
  "python",
  "java",
  "cpp",
] as const;

export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

// ─── Return-shape / data-structure extension point ─────────────────────────
//
// "primitive" | "array" | "array2d" | "string" | "boolean" are supported by
// the backend harness today. "linked-list" | "tree" | "graph" are reserved
// for later — the UI/types already model them so adding real support later
// doesn't require another schema/type migration, but there is no execution
// support for them yet (the backend returns a clear 400 if selected).
export const RETURN_DATA_STRUCTURES = [
  "primitive",
  "array",
  "array2d",
  "string",
  "boolean",
  "linked-list",
  "tree",
  "graph",
] as const;

export type ReturnDataStructure = (typeof RETURN_DATA_STRUCTURES)[number];

export interface FunctionSignature {
  functionName: string;
  returnType?: string;
  paramTypes?: string[];
  dataStructure?: ReturnDataStructure;
}

export type StarterCodeMap = Partial<Record<SupportedLanguage, string>>;
export type FunctionSignatureMap = Partial<
  Record<SupportedLanguage, FunctionSignature>
>;

/** Normalizes whatever the language <select> / draft storage holds into a SupportedLanguage, defaulting to "javascript". */
export const normalizeLanguage = (language: string | null | undefined): SupportedLanguage => {
  const key = (language || "").trim().toLowerCase();
  if ((SUPPORTED_LANGUAGES as readonly string[]).includes(key)) {
    return key as SupportedLanguage;
  }
  if (key === "js") return "javascript";
  if (key === "ts") return "typescript";
  if (key === "c++") return "cpp";
  if (key === "python3" || key === "py") return "python";
  return "javascript";
};

/** Resolves starter code for a language, falling back to the legacy single-language `starterCode` field. */
export const resolveStarterCode = (
  starterCodeByLang: StarterCodeMap | undefined | null,
  legacyStarterCode: string | undefined | null,
  language: SupportedLanguage,
): string => starterCodeByLang?.[language] ?? legacyStarterCode ?? "";

/** Resolves the expected function signature for a language, or null if the problem has no per-language metadata (older/unmigrated problems). */
export const resolveFunctionSignature = (
  functionSignatures: FunctionSignatureMap | undefined | null,
  language: SupportedLanguage,
): FunctionSignature | null => functionSignatures?.[language] ?? null;
