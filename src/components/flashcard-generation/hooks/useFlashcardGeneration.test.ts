import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { useFlashcardGeneration } from "./useFlashcardGeneration";
import type { GenerateFlashcardsResponse, ReviewFlashcardsResponse, ApiError } from "../types";

describe("useFlashcardGeneration", () => {
  beforeEach(() => {
    // Mock fetch for API calls
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("initial state", () => {
    it("should initialize with idle status", () => {
      // Act
      const { result } = renderHook(() => useFlashcardGeneration());

      // Assert
      expect(result.current.generationState.status).toBe("idle");
    });

    it("should initialize with empty input text", () => {
      // Act
      const { result } = renderHook(() => useFlashcardGeneration());

      // Assert
      expect(result.current.inputText).toBe("");
    });

    it("should initialize with empty card reviews", () => {
      // Act
      const { result } = renderHook(() => useFlashcardGeneration());

      // Assert
      expect(result.current.cardReviews).toEqual([]);
    });

    it("should initialize with closed edit modal", () => {
      // Act
      const { result } = renderHook(() => useFlashcardGeneration());

      // Assert
      expect(result.current.editModalState).toEqual({
        isOpen: false,
        cardIndex: null,
      });
    });

    it("should initialize with correct derived state", () => {
      // Act
      const { result } = renderHook(() => useFlashcardGeneration());

      // Assert
      expect(result.current.canSubmitReview).toBe(true); // No pending cards
      expect(result.current.bulkSummary).toEqual({
        total: 0,
        accepted: 0,
        rejected: 0,
        edited: 0,
        pending: 0,
      });
    });
  });

  describe("input text management", () => {
    it("should update input text", () => {
      // Arrange
      const { result } = renderHook(() => useFlashcardGeneration());
      const newText = "a".repeat(5000);

      // Act
      act(() => {
        result.current.setInputText(newText);
      });

      // Assert
      expect(result.current.inputText).toBe(newText);
    });

    it("should update character count when input changes", () => {
      // Arrange
      const { result } = renderHook(() => useFlashcardGeneration());
      const validText = "a".repeat(5000);

      // Act
      act(() => {
        result.current.setInputText(validText);
      });

      // Assert
      expect(result.current.charCount.current).toBe(5000);
      expect(result.current.charCount.isValid).toBe(true);
      expect(result.current.canGenerate).toBe(true);
    });

    it("should not allow generation with invalid text", () => {
      // Arrange
      const { result } = renderHook(() => useFlashcardGeneration());
      const shortText = "Too short";

      // Act
      act(() => {
        result.current.setInputText(shortText);
      });

      // Assert
      expect(result.current.charCount.isValid).toBe(false);
      expect(result.current.canGenerate).toBe(false);
    });
  });

  describe("generateFlashcards - happy path", () => {
    it("should transition to generating status", async () => {
      // Arrange
      const { result } = renderHook(() => useFlashcardGeneration());
      const validText = "a".repeat(5000);
      const mockResponse: GenerateFlashcardsResponse = {
        batch_id: "batch-123",
        generated_at: new Date().toISOString(),
        input_text_length: 5000,
        generated_cards: [
          { index: 0, front_text: "Question 1", back_text: "Answer 1" },
          { index: 1, front_text: "Question 2", back_text: "Answer 2" },
        ],
        total_cards_generated: 2,
        time_taken_ms: 1500,
        model_used: "openai/gpt-4o-mini",
      };

      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      act(() => {
        result.current.setInputText(validText);
      });

      // Act
      let generatePromise: Promise<void>;
      act(() => {
        generatePromise = result.current.generateFlashcards();
      });

      // Assert - Check generating state immediately
      expect(result.current.generationState.status).toBe("generating");

      // Wait for completion
      await act(async () => {
        await generatePromise;
      });
    });

    it("should transition to reviewing status with generated cards", async () => {
      // Arrange
      const { result } = renderHook(() => useFlashcardGeneration());
      const validText = "a".repeat(5000);
      const mockResponse: GenerateFlashcardsResponse = {
        batch_id: "batch-123",
        generated_at: new Date().toISOString(),
        input_text_length: 5000,
        generated_cards: [
          { index: 0, front_text: "Question 1", back_text: "Answer 1" },
          { index: 1, front_text: "Question 2", back_text: "Answer 2" },
        ],
        total_cards_generated: 2,
        time_taken_ms: 1500,
        model_used: "openai/gpt-4o-mini",
      };

      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      act(() => {
        result.current.setInputText(validText);
      });

      // Act
      await act(async () => {
        await result.current.generateFlashcards();
      });

      // Assert
      expect(result.current.generationState).toEqual({
        status: "reviewing",
        data: mockResponse,
      });
    });

    it("should initialize card reviews from generated cards", async () => {
      // Arrange
      const { result } = renderHook(() => useFlashcardGeneration());
      const validText = "a".repeat(5000);
      const mockResponse: GenerateFlashcardsResponse = {
        batch_id: "batch-123",
        generated_at: new Date().toISOString(),
        input_text_length: 5000,
        generated_cards: [
          { index: 0, front_text: "Q1", back_text: "A1" },
          { index: 1, front_text: "Q2", back_text: "A2" },
        ],
        total_cards_generated: 2,
        time_taken_ms: 1500,
        model_used: "openai/gpt-4o-mini",
      };

      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      act(() => {
        result.current.setInputText(validText);
      });

      // Act
      await act(async () => {
        await result.current.generateFlashcards();
      });

      // Assert
      expect(result.current.cardReviews).toHaveLength(2);
      expect(result.current.cardReviews[0]).toEqual({
        index: 0,
        action: "pending",
        originalCard: { index: 0, front_text: "Q1", back_text: "A1" },
        isFlipped: false,
      });
      expect(result.current.cardReviews[1]).toEqual({
        index: 1,
        action: "pending",
        originalCard: { index: 1, front_text: "Q2", back_text: "A2" },
        isFlipped: false,
      });
    });

    it("should call API with correct parameters", async () => {
      // Arrange
      const { result } = renderHook(() => useFlashcardGeneration());
      const validText = "a".repeat(5000);
      const mockResponse: GenerateFlashcardsResponse = {
        batch_id: "batch-123",
        generated_at: new Date().toISOString(),
        input_text_length: 5000,
        generated_cards: [],
        total_cards_generated: 0,
        time_taken_ms: 1500,
        model_used: "openai/gpt-4o-mini",
      };

      const mockFetch = vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      act(() => {
        result.current.setInputText(validText);
      });

      // Act
      await act(async () => {
        await result.current.generateFlashcards();
      });

      // Assert
      expect(mockFetch).toHaveBeenCalledWith("/api/flashcards/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input_text: validText }),
      });
    });
  });

  describe("generateFlashcards - error handling", () => {
    it("should transition to error status on API failure", async () => {
      // Arrange
      const { result } = renderHook(() => useFlashcardGeneration());
      const validText = "a".repeat(5000);
      const mockError: ApiError = {
        error: "Service Unavailable",
        message: "The AI service is temporarily unavailable",
      };

      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: false,
        json: async () => mockError,
      } as Response);

      act(() => {
        result.current.setInputText(validText);
      });

      // Act
      await act(async () => {
        await result.current.generateFlashcards();
      });

      // Assert
      expect(result.current.generationState).toEqual({
        status: "error",
        error: mockError,
        phase: "generation",
      });
    });

    it("should handle validation errors", async () => {
      // Arrange
      const { result } = renderHook(() => useFlashcardGeneration());
      const validText = "a".repeat(5000);
      const mockError: ApiError = {
        error: "VALIDATION_ERROR",
        message: "Input text validation failed",
        details: [
          {
            field: "input_text",
            message: "Text must be at least 1000 characters",
            received_length: 500,
          },
        ],
      };

      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: false,
        json: async () => mockError,
      } as Response);

      act(() => {
        result.current.setInputText(validText);
      });

      // Act
      await act(async () => {
        await result.current.generateFlashcards();
      });

      // Assert
      expect(result.current.generationState.status).toBe("error");
      if (result.current.generationState.status === "error") {
        expect(result.current.generationState.error.error).toBe("VALIDATION_ERROR");
        expect(result.current.generationState.error.details).toBeDefined();
      }
    });

    it("should handle network errors", async () => {
      // Arrange
      const { result } = renderHook(() => useFlashcardGeneration());
      const validText = "a".repeat(5000);

      vi.mocked(global.fetch).mockRejectedValueOnce(new Error("Network error"));

      act(() => {
        result.current.setInputText(validText);
      });

      // Act
      await act(async () => {
        await result.current.generateFlashcards();
      });

      // Assert
      expect(result.current.generationState.status).toBe("error");
    });
  });

  describe("card review actions", () => {
    const setupReviewState = async () => {
      const { result } = renderHook(() => useFlashcardGeneration());
      const mockResponse: GenerateFlashcardsResponse = {
        batch_id: "batch-123",
        generated_at: new Date().toISOString(),
        input_text_length: 5000,
        generated_cards: [
          { index: 0, front_text: "Q1", back_text: "A1" },
          { index: 1, front_text: "Q2", back_text: "A2" },
          { index: 2, front_text: "Q3", back_text: "A3" },
        ],
        total_cards_generated: 3,
        time_taken_ms: 1500,
        model_used: "openai/gpt-4o-mini",
      };

      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      act(() => {
        result.current.setInputText("a".repeat(5000));
      });

      await act(async () => {
        await result.current.generateFlashcards();
      });

      return result;
    };

    it("should accept a card", async () => {
      // Arrange
      const result = await setupReviewState();

      // Act
      act(() => {
        result.current.acceptCard(0);
      });

      // Assert
      expect(result.current.cardReviews[0].action).toBe("accept");
      expect(result.current.cardReviews[0].editedCard).toBeUndefined();
    });

    it("should reject a card", async () => {
      // Arrange
      const result = await setupReviewState();

      // Act
      act(() => {
        result.current.rejectCard(1);
      });

      // Assert
      expect(result.current.cardReviews[1].action).toBe("reject");
      expect(result.current.cardReviews[1].editedCard).toBeUndefined();
    });

    it("should update bulk summary after accept", async () => {
      // Arrange
      const result = await setupReviewState();

      // Act
      act(() => {
        result.current.acceptCard(0);
        result.current.acceptCard(1);
      });

      // Assert
      expect(result.current.bulkSummary).toEqual({
        total: 3,
        accepted: 2,
        rejected: 0,
        edited: 0,
        pending: 1,
      });
    });

    it("should allow changing action from accept to reject", async () => {
      // Arrange
      const result = await setupReviewState();

      // Act
      act(() => {
        result.current.acceptCard(0);
      });
      expect(result.current.cardReviews[0].action).toBe("accept");

      act(() => {
        result.current.rejectCard(0);
      });

      // Assert
      expect(result.current.cardReviews[0].action).toBe("reject");
    });

    it("should clear edited card when accepting after edit", async () => {
      // Arrange
      const result = await setupReviewState();

      // First edit the card
      act(() => {
        result.current.openEditModal(0);
      });
      act(() => {
        result.current.saveEdit(0, "Edited Q", "Edited A");
      });
      expect(result.current.cardReviews[0].action).toBe("edit");

      // Act - Accept the card
      act(() => {
        result.current.acceptCard(0);
      });

      // Assert
      expect(result.current.cardReviews[0].action).toBe("accept");
      expect(result.current.cardReviews[0].editedCard).toBeUndefined();
    });
  });

  describe("bulk actions", () => {
    const setupReviewState = async () => {
      const { result } = renderHook(() => useFlashcardGeneration());
      const mockResponse: GenerateFlashcardsResponse = {
        batch_id: "batch-123",
        generated_at: new Date().toISOString(),
        input_text_length: 5000,
        generated_cards: [
          { index: 0, front_text: "Q1", back_text: "A1" },
          { index: 1, front_text: "Q2", back_text: "A2" },
          { index: 2, front_text: "Q3", back_text: "A3" },
        ],
        total_cards_generated: 3,
        time_taken_ms: 1500,
        model_used: "openai/gpt-4o-mini",
      };

      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      act(() => {
        result.current.setInputText("a".repeat(5000));
      });

      await act(async () => {
        await result.current.generateFlashcards();
      });

      return result;
    };

    it("should accept all pending cards", async () => {
      // Arrange
      const result = await setupReviewState();

      // Act
      act(() => {
        result.current.acceptAll();
      });

      // Assert
      expect(result.current.cardReviews.every((r) => r.action === "accept")).toBe(true);
      expect(result.current.bulkSummary.accepted).toBe(3);
      expect(result.current.bulkSummary.pending).toBe(0);
    });

    it("should reject all pending cards", async () => {
      // Arrange
      const result = await setupReviewState();

      // Act
      act(() => {
        result.current.rejectAll();
      });

      // Assert
      expect(result.current.cardReviews.every((r) => r.action === "reject")).toBe(true);
      expect(result.current.bulkSummary.rejected).toBe(3);
      expect(result.current.bulkSummary.pending).toBe(0);
    });

    it("should only affect pending cards on acceptAll", async () => {
      // Arrange
      const result = await setupReviewState();

      act(() => {
        result.current.rejectCard(0);
      });

      // Act
      act(() => {
        result.current.acceptAll();
      });

      // Assert
      expect(result.current.cardReviews[0].action).toBe("reject"); // Unchanged
      expect(result.current.cardReviews[1].action).toBe("accept");
      expect(result.current.cardReviews[2].action).toBe("accept");
    });

    it("should only affect pending cards on rejectAll", async () => {
      // Arrange
      const result = await setupReviewState();

      act(() => {
        result.current.acceptCard(1);
      });

      // Act
      act(() => {
        result.current.rejectAll();
      });

      // Assert
      expect(result.current.cardReviews[0].action).toBe("reject");
      expect(result.current.cardReviews[1].action).toBe("accept"); // Unchanged
      expect(result.current.cardReviews[2].action).toBe("reject");
    });
  });

  describe("edit modal management", () => {
    const setupReviewState = async () => {
      const { result } = renderHook(() => useFlashcardGeneration());
      const mockResponse: GenerateFlashcardsResponse = {
        batch_id: "batch-123",
        generated_at: new Date().toISOString(),
        input_text_length: 5000,
        generated_cards: [{ index: 0, front_text: "Q1", back_text: "A1" }],
        total_cards_generated: 1,
        time_taken_ms: 1500,
        model_used: "openai/gpt-4o-mini",
      };

      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      act(() => {
        result.current.setInputText("a".repeat(5000));
      });

      await act(async () => {
        await result.current.generateFlashcards();
      });

      return result;
    };

    it("should open edit modal", async () => {
      // Arrange
      const result = await setupReviewState();

      // Act
      act(() => {
        result.current.openEditModal(0);
      });

      // Assert
      expect(result.current.editModalState).toEqual({
        isOpen: true,
        cardIndex: 0,
      });
    });

    it("should close edit modal", async () => {
      // Arrange
      const result = await setupReviewState();

      act(() => {
        result.current.openEditModal(0);
      });

      // Act
      act(() => {
        result.current.closeEditModal();
      });

      // Assert
      expect(result.current.editModalState).toEqual({
        isOpen: false,
        cardIndex: null,
      });
    });

    it("should save edit and update card review", async () => {
      // Arrange
      const result = await setupReviewState();

      // Act
      act(() => {
        result.current.saveEdit(0, "Edited Front", "Edited Back");
      });

      // Assert
      expect(result.current.cardReviews[0]).toEqual({
        index: 0,
        action: "edit",
        originalCard: { index: 0, front_text: "Q1", back_text: "A1" },
        editedCard: {
          index: 0,
          front_text: "Edited Front",
          back_text: "Edited Back",
        },
        isFlipped: false,
      });
      expect(result.current.editModalState.isOpen).toBe(false);
    });

    it("should update bulk summary after edit", async () => {
      // Arrange
      const result = await setupReviewState();

      // Act
      act(() => {
        result.current.saveEdit(0, "Edited Front", "Edited Back");
      });

      // Assert
      expect(result.current.bulkSummary).toEqual({
        total: 1,
        accepted: 0,
        rejected: 0,
        edited: 1,
        pending: 0,
      });
    });
  });

  describe("submitReview - happy path", () => {
    const setupForSubmit = async () => {
      const { result } = renderHook(() => useFlashcardGeneration());
      const mockGenerateResponse: GenerateFlashcardsResponse = {
        batch_id: "batch-123",
        generated_at: new Date().toISOString(),
        input_text_length: 5000,
        generated_cards: [
          { index: 0, front_text: "Q1", back_text: "A1" },
          { index: 1, front_text: "Q2", back_text: "A2" },
        ],
        total_cards_generated: 2,
        time_taken_ms: 1500,
        model_used: "openai/gpt-4o-mini",
      };

      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockGenerateResponse,
      } as Response);

      act(() => {
        result.current.setInputText("a".repeat(5000));
      });

      await act(async () => {
        await result.current.generateFlashcards();
      });

      return result;
    };

    it("should transition to submitting status", async () => {
      // Arrange
      const result = await setupForSubmit();
      act(() => {
        result.current.acceptAll();
      });

      const mockReviewResponse: ReviewFlashcardsResponse = {
        batch_id: "batch-123",
        cards_accepted: 2,
        cards_rejected: 0,
        cards_edited: 0,
        created_flashcards: [],
      };

      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockReviewResponse,
      } as Response);

      // Act
      let submitPromise: Promise<void>;
      act(() => {
        submitPromise = result.current.submitReview();
      });

      // Assert - Check submitting state immediately
      expect(result.current.generationState.status).toBe("submitting");

      // Wait for completion
      await act(async () => {
        await submitPromise;
      });
    });

    it("should transition to success status", async () => {
      // Arrange
      const result = await setupForSubmit();
      act(() => {
        result.current.acceptAll();
      });

      const mockReviewResponse: ReviewFlashcardsResponse = {
        batch_id: "batch-123",
        cards_accepted: 2,
        cards_rejected: 0,
        cards_edited: 0,
        created_flashcards: [],
      };

      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockReviewResponse,
      } as Response);

      // Act
      await act(async () => {
        await result.current.submitReview();
      });

      // Assert
      expect(result.current.generationState).toEqual({
        status: "success",
        data: mockReviewResponse,
      });
    });

    it("should call API with correct decisions", async () => {
      // Arrange
      const result = await setupForSubmit();
      act(() => {
        result.current.acceptCard(0);
        result.current.rejectCard(1);
      });

      const mockReviewResponse: ReviewFlashcardsResponse = {
        batch_id: "batch-123",
        cards_accepted: 1,
        cards_rejected: 1,
        cards_edited: 0,
        created_flashcards: [],
      };

      const mockFetch = vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockReviewResponse,
      } as Response);

      // Act
      await act(async () => {
        await result.current.submitReview();
      });

      // Assert
      expect(mockFetch).toHaveBeenCalledWith("/api/flashcards/batch/batch-123/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          decisions: [
            { index: 0, action: "accept", front_text: "Q1", back_text: "A1" },
            { index: 1, action: "reject", front_text: "Q2", back_text: "A2" },
          ],
        }),
      });
    });
  });

  describe("submitReview - error handling", () => {
    const setupForSubmit = async () => {
      const { result } = renderHook(() => useFlashcardGeneration());
      const mockGenerateResponse: GenerateFlashcardsResponse = {
        batch_id: "batch-123",
        generated_at: new Date().toISOString(),
        input_text_length: 5000,
        generated_cards: [{ index: 0, front_text: "Q1", back_text: "A1" }],
        total_cards_generated: 1,
        time_taken_ms: 1500,
        model_used: "openai/gpt-4o-mini",
      };

      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockGenerateResponse,
      } as Response);

      act(() => {
        result.current.setInputText("a".repeat(5000));
      });

      await act(async () => {
        await result.current.generateFlashcards();
      });

      return result;
    };

    it("should handle API errors and preserve review data", async () => {
      // Arrange
      const result = await setupForSubmit();
      act(() => {
        result.current.acceptAll();
      });

      const mockError: ApiError = {
        error: "BATCH_NOT_FOUND",
        message: "Batch not found",
      };

      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: false,
        json: async () => mockError,
      } as Response);

      // Act
      await act(async () => {
        await result.current.submitReview();
      });

      // Assert
      expect(result.current.generationState.status).toBe("error");
      if (result.current.generationState.status === "error") {
        expect(result.current.generationState.phase).toBe("review");
        expect(result.current.generationState.error).toEqual(mockError);
      }
    });

    it("should do nothing when not in reviewing state", async () => {
      // Arrange
      const { result } = renderHook(() => useFlashcardGeneration());
      const mockFetch = vi.mocked(global.fetch);

      // Act
      await act(async () => {
        await result.current.submitReview();
      });

      // Assert
      expect(mockFetch).not.toHaveBeenCalled();
      expect(result.current.generationState.status).toBe("idle");
    });
  });

  describe("canSubmitReview", () => {
    const setupReviewState = async () => {
      const { result } = renderHook(() => useFlashcardGeneration());
      const mockResponse: GenerateFlashcardsResponse = {
        batch_id: "batch-123",
        generated_at: new Date().toISOString(),
        input_text_length: 5000,
        generated_cards: [
          { index: 0, front_text: "Q1", back_text: "A1" },
          { index: 1, front_text: "Q2", back_text: "A2" },
        ],
        total_cards_generated: 2,
        time_taken_ms: 1500,
        model_used: "openai/gpt-4o-mini",
      };

      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      act(() => {
        result.current.setInputText("a".repeat(5000));
      });

      await act(async () => {
        await result.current.generateFlashcards();
      });

      return result;
    };

    it("should be false when cards are pending", async () => {
      // Arrange
      const result = await setupReviewState();

      // Assert
      expect(result.current.canSubmitReview).toBe(false);
    });

    it("should be true when all cards are reviewed", async () => {
      // Arrange
      const result = await setupReviewState();

      // Act
      act(() => {
        result.current.acceptAll();
      });

      // Assert
      expect(result.current.canSubmitReview).toBe(true);
    });

    it("should be true when some accepted and some rejected", async () => {
      // Arrange
      const result = await setupReviewState();

      // Act
      act(() => {
        result.current.acceptCard(0);
        result.current.rejectCard(1);
      });

      // Assert
      expect(result.current.canSubmitReview).toBe(true);
    });
  });

  describe("error recovery", () => {
    it("should retry generation", async () => {
      // Arrange
      const { result } = renderHook(() => useFlashcardGeneration());
      const validText = "a".repeat(5000);

      act(() => {
        result.current.setInputText(validText);
      });

      // First call fails
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: "Error", message: "Failed" }),
      } as Response);

      await act(async () => {
        await result.current.generateFlashcards();
      });

      expect(result.current.generationState.status).toBe("error");

      // Second call succeeds
      const mockResponse: GenerateFlashcardsResponse = {
        batch_id: "batch-123",
        generated_at: new Date().toISOString(),
        input_text_length: 5000,
        generated_cards: [],
        total_cards_generated: 0,
        time_taken_ms: 1500,
        model_used: "openai/gpt-4o-mini",
      };

      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      // Act
      await act(async () => {
        result.current.retryGeneration();
      });

      // Assert
      await waitFor(() => {
        expect(result.current.generationState.status).toBe("reviewing");
      });
    });

    it("should dismiss generation error and return to idle", async () => {
      // Arrange
      const { result } = renderHook(() => useFlashcardGeneration());
      const validText = "a".repeat(5000);

      act(() => {
        result.current.setInputText(validText);
      });

      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: "Error", message: "Failed" }),
      } as Response);

      await act(async () => {
        await result.current.generateFlashcards();
      });

      // Act
      act(() => {
        result.current.dismissError();
      });

      // Assert
      expect(result.current.generationState.status).toBe("idle");
    });

    it("should dismiss review error and return to idle", async () => {
      // Arrange
      const { result } = renderHook(() => useFlashcardGeneration());
      const validText = "a".repeat(5000);

      act(() => {
        result.current.setInputText(validText);
      });

      // Generate successfully
      const mockGenerateResponse: GenerateFlashcardsResponse = {
        batch_id: "batch-123",
        generated_at: new Date().toISOString(),
        input_text_length: 5000,
        generated_cards: [{ index: 0, front_text: "Q1", back_text: "A1" }],
        total_cards_generated: 1,
        time_taken_ms: 1500,
        model_used: "openai/gpt-4o-mini",
      };

      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockGenerateResponse,
      } as Response);

      await act(async () => {
        await result.current.generateFlashcards();
      });

      // Review fails
      act(() => {
        result.current.acceptAll();
      });

      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: "Error", message: "Failed" }),
      } as Response);

      await act(async () => {
        await result.current.submitReview();
      });

      expect(result.current.generationState.status).toBe("error");

      // Act
      act(() => {
        result.current.dismissError();
      });

      // Assert
      expect(result.current.generationState.status).toBe("idle");
    });
  });

  describe("reset", () => {
    it("should reset to initial state", async () => {
      // Arrange
      const { result } = renderHook(() => useFlashcardGeneration());
      const validText = "a".repeat(5000);
      const mockResponse: GenerateFlashcardsResponse = {
        batch_id: "batch-123",
        generated_at: new Date().toISOString(),
        input_text_length: 5000,
        generated_cards: [{ index: 0, front_text: "Q1", back_text: "A1" }],
        total_cards_generated: 1,
        time_taken_ms: 1500,
        model_used: "openai/gpt-4o-mini",
      };

      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      act(() => {
        result.current.setInputText(validText);
      });

      await act(async () => {
        await result.current.generateFlashcards();
      });

      act(() => {
        result.current.openEditModal(0);
      });

      // Act
      act(() => {
        result.current.reset();
      });

      // Assert
      expect(result.current.inputText).toBe("");
      expect(result.current.generationState.status).toBe("idle");
      expect(result.current.cardReviews).toEqual([]);
      expect(result.current.editModalState).toEqual({
        isOpen: false,
        cardIndex: null,
      });
    });
  });
});
