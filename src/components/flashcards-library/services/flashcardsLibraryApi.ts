import type {
  FlashcardsListResponse,
  FlashcardDTO,
  CreateFlashcardCommand,
  UpdateFlashcardCommand,
  ApiError,
} from "@/types";
import type { QueryParams } from "../types";

/**
 * API service for flashcard library operations
 * Separates API communication from React state management
 */
export const flashcardsLibraryApi = {
  /**
   * Fetch flashcards with pagination, search, and sorting
   */
  async fetchFlashcards(queryParams: QueryParams): Promise<FlashcardsListResponse> {
    const params = new URLSearchParams();
    params.set("page", queryParams.page.toString());
    params.set("limit", queryParams.limit.toString());
    if (queryParams.search) {
      params.set("search", queryParams.search);
    }
    params.set("sort_by", queryParams.sort_by);
    params.set("sort_order", queryParams.sort_order);

    const response = await fetch(`/api/flashcards?${params.toString()}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const error: ApiError = await response.json();
      throw error;
    }

    return await response.json();
  },

  /**
   * Create a new flashcard
   */
  async createFlashcard(data: CreateFlashcardCommand): Promise<FlashcardDTO> {
    const response = await fetch("/api/flashcards", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error: ApiError = await response.json();
      throw error;
    }

    return await response.json();
  },

  /**
   * Update an existing flashcard
   */
  async updateFlashcard(id: string, data: UpdateFlashcardCommand): Promise<FlashcardDTO> {
    const response = await fetch(`/api/flashcards/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error: ApiError = await response.json();
      throw error;
    }

    return await response.json();
  },

  /**
   * Delete a single flashcard
   */
  async deleteFlashcard(id: string): Promise<void> {
    const response = await fetch(`/api/flashcards/${id}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      const error: ApiError = await response.json();
      throw error;
    }
  },

  /**
   * Delete multiple flashcards
   */
  async bulkDeleteFlashcards(ids: string[]): Promise<void> {
    const idsParam = ids.join(",");
    const response = await fetch(`/api/flashcards?ids=${idsParam}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      const error: ApiError = await response.json();
      throw error;
    }
  },
};
