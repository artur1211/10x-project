import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { flashcardApi } from "./flashcardApi";
import type { GenerateFlashcardsResponse, ReviewFlashcardsResponse, ApiError } from "../types";

describe("flashcardApi", () => {
  beforeEach(() => {
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("generateFlashcards", () => {
    it("should successfully generate flashcards", async () => {
      // Arrange
      const mockResponse: GenerateFlashcardsResponse = {
        batch_id: "test-batch-123",
        generated_at: new Date().toISOString(),
        input_text_length: 1000,
        generated_cards: [
          { index: 0, front_text: "Question 1", back_text: "Answer 1" },
          { index: 1, front_text: "Question 2", back_text: "Answer 2" },
        ],
        total_cards_generated: 2,
        time_taken_ms: 1500,
        model_used: "openai/gpt-4o-mini",
      };

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      // Act
      const result = await flashcardApi.generateFlashcards("Sample input text");

      // Assert
      expect(global.fetch).toHaveBeenCalledWith("/api/flashcards/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input_text: "Sample input text" }),
      });
      expect(result).toEqual(mockResponse);
    });

    it("should trim input text before sending", async () => {
      // Arrange
      const mockResponse: GenerateFlashcardsResponse = {
        batch_id: "test-batch-123",
        generated_at: new Date().toISOString(),
        input_text_length: 1000,
        generated_cards: [],
        total_cards_generated: 0,
        time_taken_ms: 1000,
        model_used: "openai/gpt-4o-mini",
      };

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      // Act
      await flashcardApi.generateFlashcards("  Sample input text  ");

      // Assert
      expect(global.fetch).toHaveBeenCalledWith("/api/flashcards/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input_text: "Sample input text" }),
      });
    });

    it("should throw API error when request fails", async () => {
      // Arrange
      const mockError: ApiError = {
        error: "Input too short",
        message: "Input text must be at least 1000 characters",
      };

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        json: async () => mockError,
      });

      // Act & Assert
      await expect(flashcardApi.generateFlashcards("Short")).rejects.toEqual(mockError);
    });
  });

  describe("submitReview", () => {
    it("should successfully submit review", async () => {
      // Arrange
      const batchId = "test-batch-123";
      const decisions = [
        { index: 0, action: "accept" as const, front_text: "Q1", back_text: "A1" },
        { index: 1, action: "reject" as const, front_text: "Q2", back_text: "A2" },
      ];

      const mockResponse: ReviewFlashcardsResponse = {
        batch_id: "test-batch-123",
        cards_accepted: 1,
        cards_rejected: 1,
        cards_edited: 0,
        created_flashcards: [],
      };

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      // Act
      const result = await flashcardApi.submitReview(batchId, decisions);

      // Assert
      expect(global.fetch).toHaveBeenCalledWith(`/api/flashcards/batch/${batchId}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decisions }),
      });
      expect(result).toEqual(mockResponse);
    });

    it("should throw API error when submit fails", async () => {
      // Arrange
      const batchId = "test-batch-123";
      const decisions = [{ index: 0, action: "accept" as const, front_text: "Q1", back_text: "A1" }];

      const mockError: ApiError = {
        error: "Batch not found",
        message: "The specified batch does not exist",
      };

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        json: async () => mockError,
      });

      // Act & Assert
      await expect(flashcardApi.submitReview(batchId, decisions)).rejects.toEqual(mockError);
    });
  });
});
