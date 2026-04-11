import { z } from "zod";

const SUPPORTED_LANGUAGES = ["javascript"] as const;

export const visualizeRequestSchema = z.object({
  code: z.string().min(1, "code is required.").max(20000, "code is too large."),
  language: z.enum(SUPPORTED_LANGUAGES),
  input: z.string().max(5000, "input is too large."),
});

export type VisualizeRequestInput = z.infer<typeof visualizeRequestSchema>;
