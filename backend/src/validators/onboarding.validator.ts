import { z } from "zod";

const ALLOWED_LEVELS = ["beginner", "intermediate", "advanced"] as const;
const ALLOWED_TOPICS = [
  "arrays",
  "strings",
  "linked-list",
  "stack",
  "queue",
  "hashing",
  "two-pointers",
  "sliding-window",
  "binary-search",
  "recursion",
  "backtracking",
  "trees",
  "bst",
  "heaps",
  "greedy",
  "graphs",
  "dp",
  "trie",
  "bit-manipulation",
] as const;

export const onboardingSchema = z.object({
  experienceLevel: z.enum(ALLOWED_LEVELS),
  goals: z.string().min(3).max(500),
  preferredTopics: z
    .array(z.enum(ALLOWED_TOPICS))
    .min(1)
    .max(10)
    .refine(
      (preferredTopics) =>
        new Set(preferredTopics).size === preferredTopics.length,
      {
        message: "preferredTopics must be unique.",
      },
    ),
});

export const completeDaySchema = z.object({
  day: z.number().int().min(1),
});

export type OnboardingPayload = z.infer<typeof onboardingSchema>;
export type CompleteDayPayload = z.infer<typeof completeDaySchema>;
