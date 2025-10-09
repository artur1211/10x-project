import { z } from "zod";

/**
 * Schema for a single review decision
 * Validates the structure of each decision in the review array
 */
export const reviewDecisionSchema = z.object({
  index: z.number().int().nonnegative({
    message: "Index must be a non-negative integer",
  }),
  action: z.enum(["accept", "reject", "edit"], {
    errorMap: () => ({ message: "Action must be 'accept', 'reject', or 'edit'" }),
  }),
  front_text: z
    .string()
    .min(10, "Front text must be at least 10 characters")
    .max(500, "Front text must not exceed 500 characters")
    .trim(),
  back_text: z
    .string()
    .min(10, "Back text must be at least 10 characters")
    .max(1000, "Back text must not exceed 1000 characters")
    .trim(),
});

/**
 * Schema for the review flashcards request body
 * Validates the array of decisions and ensures it's not empty
 */
export const reviewFlashcardsSchema = z.object({
  decisions: z
    .array(reviewDecisionSchema)
    .min(1, "At least one decision is required")
    .refine(
      (decisions) => {
        const indices = decisions.map((d) => d.index);
        return new Set(indices).size === indices.length;
      },
      {
        message: "Duplicate indices found in decisions array",
      }
    ),
});

export type ReviewFlashcardsInput = z.infer<typeof reviewFlashcardsSchema>;
export type ReviewDecisionInput = z.infer<typeof reviewDecisionSchema>;
