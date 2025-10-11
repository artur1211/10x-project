import type { GeneratedCardPreview } from "@/types";

/**
 * Result returned from flashcard generation
 */
export interface GenerationResult {
  cards: GeneratedCardPreview[];
  modelUsed: string;
}
