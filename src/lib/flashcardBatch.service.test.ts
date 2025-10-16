import { describe, it, expect, vi, beforeEach } from "vitest";
import { FlashcardBatchService } from "./flashcardBatch.service";
import { createMockSupabaseClient } from "@/test/mocks/supabase";
import type { SupabaseClient } from "@/db/supabase.client";
import { OpenRouterService } from "./openrouter.service";

// Mock the OpenRouterService module
vi.mock("./openrouter.service");

describe("FlashcardBatchService", () => {
  let service: FlashcardBatchService;
  let mockSupabase: Partial<SupabaseClient>;

  beforeEach(() => {
    mockSupabase = createMockSupabaseClient();
    service = new FlashcardBatchService(mockSupabase as SupabaseClient, "test-api-key");
  });

  describe("generateFlashcardsFromText", () => {
    it("should throw ValidationError for text shorter than 100 characters", async () => {
      const shortText = "This is too short";

      await expect(service.generateFlashcardsFromText(shortText)).rejects.toThrow(
        "Input text must be at least 100 characters long"
      );
    });

    it("should throw ValidationError for empty text", async () => {
      await expect(service.generateFlashcardsFromText("")).rejects.toThrow(
        "Input text must be at least 100 characters long"
      );
    });

    it("should throw ValidationError for text longer than 10000 characters", async () => {
      const longText = "a".repeat(10001);

      await expect(service.generateFlashcardsFromText(longText)).rejects.toThrow(
        "Input text must not exceed 10,000 characters"
      );
    });

    it("should accept text with exactly 100 characters", async () => {
      const text100 = "a".repeat(100);

      // Mock OpenRouterService.chat to return valid flashcards
      const mockChat = vi.fn().mockResolvedValue({
        parsedContent: {
          flashcards: [
            { question: "Question 1", answer: "Answer 1" },
            { question: "Question 2", answer: "Answer 2" },
          ],
        },
        model: "openai/gpt-4o-mini",
      });

      vi.mocked(OpenRouterService).mockImplementation(
        () =>
          ({
            chat: mockChat,
          }) as unknown as OpenRouterService
      );

      const result = await service.generateFlashcardsFromText(text100);

      expect(result.cards).toHaveLength(2);
      expect(result.cards[0].front_text).toBe("Question 1");
      expect(result.modelUsed).toBe("openai/gpt-4o-mini");
    });
  });

  describe("constructor", () => {
    it("should initialize with supabase client", () => {
      expect(service).toBeInstanceOf(FlashcardBatchService);
    });

    it("should store the API key", () => {
      const serviceWithKey = new FlashcardBatchService(mockSupabase as SupabaseClient, "my-api-key");
      expect(serviceWithKey).toBeDefined();
    });
  });
});
