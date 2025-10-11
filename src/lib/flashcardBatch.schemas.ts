import { z } from "zod";

// ============================================================================
// Flashcard Generation Schemas
// ============================================================================

export const generateFlashcardsSchema = z.object({
  input_text: z
    .string()
    .min(1000, "Text must be at least 1000 characters")
    .max(10000, "Text must not exceed 10000 characters")
    .trim(),
});

export type GenerateFlashcardsInput = z.infer<typeof generateFlashcardsSchema>;

/**
 * Schema for a single generated flashcard from AI
 */
export const GeneratedFlashcardSchema = z.object({
  question: z
    .string()
    .min(10, "Question must be at least 10 characters")
    .max(500, "Question must not exceed 500 characters"),
  answer: z
    .string()
    .min(10, "Answer must be at least 10 characters")
    .max(1000, "Answer must not exceed 1000 characters"),
});

/**
 * Schema for the AI response containing multiple flashcards
 */
export const FlashcardGenerationResponseSchema = z.object({
  flashcards: z
    .array(GeneratedFlashcardSchema)
    .min(1, "At least one flashcard must be generated")
    .max(50, "Cannot generate more than 50 flashcards at once"),
});

/**
 * Type inference for generated flashcard
 */
export type GeneratedFlashcard = z.infer<typeof GeneratedFlashcardSchema>;

/**
 * Type inference for flashcard generation response
 */
export type FlashcardGenerationResponse = z.infer<typeof FlashcardGenerationResponseSchema>;

/**
 * JSON Schema for structured output from OpenRouter
 * This is the schema that will be sent to the AI model
 */
export const FLASHCARD_GENERATION_JSON_SCHEMA = {
  type: "object" as const,
  properties: {
    flashcards: {
      type: "array" as const,
      items: {
        type: "object" as const,
        properties: {
          question: {
            type: "string" as const,
            minLength: 10,
            maxLength: 500,
            description: "Clear, concise question for the front of the flashcard",
          },
          answer: {
            type: "string" as const,
            minLength: 10,
            maxLength: 1000,
            description: "Comprehensive answer for the back of the flashcard",
          },
        },
        required: ["question", "answer"],
        additionalProperties: false,
      },
      minItems: 1,
      maxItems: 50,
    },
  },
  required: ["flashcards"],
  additionalProperties: false,
};

// ============================================================================
// Flashcard Review Schemas
// ============================================================================

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
