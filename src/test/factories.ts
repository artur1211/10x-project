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
