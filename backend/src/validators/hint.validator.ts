import { z } from "zod";

export const hintRequestSchema = z.object({
  problemId: z.string().trim().min(1, "problemId is required."),
  problemTitle: z.string().trim().min(1, "problemTitle is required."),
  problemDescription: z.string().trim().min(1, "problemDescription is required."),
  language: z.string().trim().min(1, "language is required."),
  code: z.string().trim().min(1, "code is required."),
});

export type HintRequestInput = z.infer<typeof hintRequestSchema>;