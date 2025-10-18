import type {
  GenerateFlashcardsCommand,
  GenerateFlashcardsResponse,
  ReviewFlashcardsCommand,
  ReviewFlashcardsResponse,
  ReviewDecision,
  ApiError,
} from "../types";

/**
 * API service for flashcard generation operations
 * Separates API communication from React state management
 */
export const flashcardApi = {
  /**
   * Generate flashcards from input text
   */
  async generateFlashcards(inputText: string): Promise<GenerateFlashcardsResponse> {
    const response = await fetch("/api/flashcards/batch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        input_text: inputText.trim(),
      } satisfies GenerateFlashcardsCommand),
    });

    if (!response.ok) {
      const error: ApiError = await response.json();
      throw error;
    }

    return await response.json();
  },

  /**
   * Submit review decisions for a batch of flashcards
   */
  async submitReview(batchId: string, decisions: ReviewDecision[]): Promise<ReviewFlashcardsResponse> {
    const response = await fetch(`/api/flashcards/batch/${batchId}/review`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        decisions,
      } satisfies ReviewFlashcardsCommand),
    });

    if (!response.ok) {
      const error: ApiError = await response.json();
      throw error;
    }

    return await response.json();
  },
};
