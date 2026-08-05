import { z } from "zod";

export const submissionRequestSchema = z.object({
  problemId: z.string().trim().min(1, "problemId is required."),
  status: z.enum(["passed", "failed"]),
});

export type SubmissionRequestInput = z.infer<typeof submissionRequestSchema>;