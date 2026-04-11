import { z } from "zod";

const executeFileSchema = z.object({
  content: z.string().min(1, "file content is required.").max(200000),
});

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
});

export type ExecuteRequestInput = z.infer<typeof executeRequestSchema>;
