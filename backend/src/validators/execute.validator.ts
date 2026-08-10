import { z } from "zod";
import { RETURN_DATA_STRUCTURES } from "../types/problem.types";

const executeFileSchema = z.object({
  content: z.string().min(1, "file content is required.").max(200000),
});

// Optional problem metadata the frontend can send so the backend never has
// to guess. All fields are optional so `/api/execute` stays backward
// compatible with older callers (e.g. the plain playground) that only send
// { language, files, stdin }.
export const executeRequestSchema = z.object({
  language: z.string().trim().min(1, "language is required."),
  version: z.string().trim().optional(),
  files: z.array(executeFileSchema).min(1, "at least one file is required."),
  stdin: z.string().optional().default(""),
  args: z.array(z.string()).optional(),
  compile_timeout: z.number().int().positive().max(30000).optional(),
  run_timeout: z.number().int().positive().max(30000).optional(),
  compile_memory_limit: z.number().int().optional(),
  run_memory_limit: z.number().int().optional(),

  // ─── DSA test-harness metadata (optional) ────────────────────────────────
  // When provided, the backend uses this directly instead of regex-guessing
  // the function name out of the user's source. Sourced from
  // `Problem.functionSignatures[language]` on the frontend.
  problemId: z.string().trim().optional(),
  functionName: z.string().trim().min(1).optional(),
  dataStructure: z.enum(RETURN_DATA_STRUCTURES).optional(),
});

export type ExecuteRequestInput = z.infer<typeof executeRequestSchema>;
