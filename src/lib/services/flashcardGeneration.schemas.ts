import { z } from "zod";

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
