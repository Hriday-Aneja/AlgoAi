import { z } from "zod";

export const hintRequestSchema = z.object({
  problemId: z.string().trim().min(1, "problemId is required."),
});

export type HintRequestInput = z.infer<typeof hintRequestSchema>;
