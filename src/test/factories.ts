import { vi } from "vitest";

/**
 * Factory functions for creating test data
 */

export const createTestFlashcard = (overrides = {}) => ({
  id: "test-flashcard-id",
  front: "Test Question",
  back: "Test Answer",
  user_id: "test-user-id",
  deck_id: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  next_review: new Date().toISOString(),
  interval: 1,
  easiness_factor: 2.5,
  repetitions: 0,
  ...overrides,
});

export const createTestBatch = (overrides = {}) => ({
  id: "test-batch-id",
  user_id: "test-user-id",
  input_text: "Test input text for flashcard generation",
  status: "pending" as const,
  created_at: new Date().toISOString(),
  reviewed_at: null,
  ...overrides,
});

export const createTestUser = (overrides = {}) => ({
  id: "test-user-id",
  email: "test@example.com",
  created_at: new Date().toISOString(),
  app_metadata: {},
  user_metadata: {},
  aud: "authenticated" as const,
  role: "authenticated" as const,
  ...overrides,
});

/**
 * Helper to create a mock API response
 */
export const createMockResponse = (data: unknown, status = 200) => {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: vi.fn().mockResolvedValue(data),
    text: vi.fn().mockResolvedValue(JSON.stringify(data)),
    headers: new Headers(),
  } as unknown as Response;
};

/**
 * Helper to mock successful fetch calls
 */
export const mockFetchSuccess = (data: unknown) => {
  (global.fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce(createMockResponse(data));
};

/**
 * Helper to mock failed fetch calls
 */
export const mockFetchError = (status = 500, message = "Server Error") => {
  (global.fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
    createMockResponse({ error: message }, status)
  );
};

/**
 * Factory for creating generated card preview
 */
export const createGeneratedCardPreview = (
  overrides: Partial<{ index: number; front_text: string; back_text: string }> = {}
) => ({
  index: 0,
  front_text: "Test Question",
  back_text: "Test Answer",
  ...overrides,
});

/**
 * Factory for creating GenerateFlashcardsResponse
 */
export const createGenerateFlashcardsResponse = (
  overrides: Partial<{
    batch_id: string;
    generated_at: string;
    input_text_length: number;
    generated_cards: { index: number; front_text: string; back_text: string }[];
    total_cards_generated: number;
    time_taken_ms: number | null;
    model_used: string | null;
  }> = {}
) => ({
  batch_id: "test-batch-id",
  generated_at: new Date().toISOString(),
  input_text_length: 5000,
  generated_cards: [
    { index: 0, front_text: "Question 1", back_text: "Answer 1" },
    { index: 1, front_text: "Question 2", back_text: "Answer 2" },
  ],
  total_cards_generated: 2,
  time_taken_ms: 1500,
  model_used: "openai/gpt-4o-mini",
  ...overrides,
});

/**
 * Factory for creating ReviewFlashcardsResponse
 */
export const createReviewFlashcardsResponse = (
  overrides: Partial<{
    batch_id: string;
    cards_accepted: number;
    cards_rejected: number;
    cards_edited: number;
    created_flashcards: unknown[];
  }> = {}
) => ({
  batch_id: "test-batch-id",
  cards_accepted: 1,
  cards_rejected: 0,
  cards_edited: 0,
  created_flashcards: [],
  ...overrides,
});

/**
 * Factory for creating ApiError
 */
export const createApiError = (
  overrides: Partial<{
    error: string;
    message: string;
    details?: { field: string; message: string; received_length?: number }[];
    current_count?: number;
    limit?: number;
    suggestion?: string;
  }> = {}
) => ({
  error: "Error",
  message: "An error occurred",
  ...overrides,
});

/**
 * Factory for creating CardReviewState
 */
export const createCardReviewState = (
  overrides: Partial<{
    index: number;
    action: "pending" | "accept" | "reject" | "edit";
    originalCard: { index: number; front_text: string; back_text: string };
    editedCard?: { index: number; front_text: string; back_text: string };
    isFlipped: boolean;
  }> = {}
) => ({
  index: 0,
  action: "pending" as const,
  originalCard: { index: 0, front_text: "Q1", back_text: "A1" },
  isFlipped: false,
  ...overrides,
});
