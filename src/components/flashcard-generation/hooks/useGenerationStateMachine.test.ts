import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useGenerationStateMachine } from "./useGenerationStateMachine";
import type { GenerateFlashcardsResponse, ReviewFlashcardsResponse, ApiError } from "../types";

describe("useGenerationStateMachine", () => {
  it("should initialize with idle status", () => {
    // Act
    const { result } = renderHook(() => useGenerationStateMachine());

    // Assert
    expect(result.current.generationState.status).toBe("idle");
  });

  it("should transition to generating state", () => {
    // Arrange
    const { result } = renderHook(() => useGenerationStateMachine());

    // Act
    act(() => {
      result.current.setGenerating();
    });

    // Assert
    expect(result.current.generationState.status).toBe("generating");
  });

  it("should transition to reviewing state with data", () => {
    // Arrange
    const { result } = renderHook(() => useGenerationStateMachine());
    const mockData: GenerateFlashcardsResponse = {
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

    // Act
    act(() => {
      result.current.setReviewing(mockData);
    });

    // Assert
    expect(result.current.generationState.status).toBe("reviewing");
    if (result.current.generationState.status === "reviewing") {
      expect(result.current.generationState.data).toEqual(mockData);
    }
  });

  it("should transition to submitting state", () => {
    // Arrange
    const { result } = renderHook(() => useGenerationStateMachine());

    // Act
    act(() => {
      result.current.setSubmitting();
    });

    // Assert
    expect(result.current.generationState.status).toBe("submitting");
  });

  it("should transition to success state with data", () => {
    // Arrange
    const { result } = renderHook(() => useGenerationStateMachine());
    const mockData: ReviewFlashcardsResponse = {
      batch_id: "test-batch-123",
      cards_accepted: 2,
      cards_rejected: 1,
      cards_edited: 0,
      created_flashcards: [],
    };

    // Act
    act(() => {
      result.current.setSuccess(mockData);
    });

    // Assert
    expect(result.current.generationState.status).toBe("success");
    if (result.current.generationState.status === "success") {
      expect(result.current.generationState.data).toEqual(mockData);
    }
  });

  it("should transition to error state with generation phase", () => {
    // Arrange
    const { result } = renderHook(() => useGenerationStateMachine());
    const mockError: ApiError = {
      error: "Input too short",
      message: "Input text must be at least 1000 characters",
    };

    // Act
    act(() => {
      result.current.setError(mockError, "generation");
    });

    // Assert
    expect(result.current.generationState.status).toBe("error");
    if (result.current.generationState.status === "error") {
      expect(result.current.generationState.error).toEqual(mockError);
      expect(result.current.generationState.phase).toBe("generation");
    }
  });

  it("should transition to error state with review phase", () => {
    // Arrange
    const { result } = renderHook(() => useGenerationStateMachine());
    const mockError: ApiError = {
      error: "Batch not found",
      message: "The specified batch does not exist",
    };

    // Act
    act(() => {
      result.current.setError(mockError, "review");
    });

    // Assert
    expect(result.current.generationState.status).toBe("error");
    if (result.current.generationState.status === "error") {
      expect(result.current.generationState.error).toEqual(mockError);
      expect(result.current.generationState.phase).toBe("review");
    }
  });

  it("should reset to idle state", () => {
    // Arrange
    const { result } = renderHook(() => useGenerationStateMachine());

    act(() => {
      result.current.setGenerating();
    });

    expect(result.current.generationState.status).toBe("generating");

    // Act
    act(() => {
      result.current.reset();
    });

    // Assert
    expect(result.current.generationState.status).toBe("idle");
  });

  it("should handle full workflow transition", () => {
    // Arrange
    const { result } = renderHook(() => useGenerationStateMachine());
    const generateData: GenerateFlashcardsResponse = {
      batch_id: "test-batch-123",
      generated_at: new Date().toISOString(),
      input_text_length: 1000,
      generated_cards: [{ index: 0, front_text: "Q", back_text: "A" }],
      total_cards_generated: 1,
      time_taken_ms: 1000,
      model_used: "openai/gpt-4o-mini",
    };
    const reviewData: ReviewFlashcardsResponse = {
      batch_id: "test-batch-123",
      cards_accepted: 1,
      cards_rejected: 0,
      cards_edited: 0,
      created_flashcards: [],
    };

    // Act & Assert - Full workflow
    expect(result.current.generationState.status).toBe("idle");

    act(() => {
      result.current.setGenerating();
    });
    expect(result.current.generationState.status).toBe("generating");

    act(() => {
      result.current.setReviewing(generateData);
    });
    expect(result.current.generationState.status).toBe("reviewing");

    act(() => {
      result.current.setSubmitting();
    });
    expect(result.current.generationState.status).toBe("submitting");

    act(() => {
      result.current.setSuccess(reviewData);
    });
    expect(result.current.generationState.status).toBe("success");

    act(() => {
      result.current.reset();
    });
    expect(result.current.generationState.status).toBe("idle");
  });
});
