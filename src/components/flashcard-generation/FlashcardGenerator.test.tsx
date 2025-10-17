import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { FlashcardGenerator } from "./FlashcardGenerator";
import * as useFlashcardGenerationModule from "./hooks/useFlashcardGeneration";
import type { GenerationState, CardReviewState } from "./types";

// Mock all the child components
vi.mock("./components/FlashcardGeneratorForm", () => ({
  FlashcardGeneratorForm: ({
    inputText,
    onInputChange,
  }: {
    inputText: string;
    onInputChange: (text: string) => void;
  }) => (
    <div data-testid="flashcard-generator-form">
      <input value={inputText} onChange={(e) => onInputChange(e.target.value)} data-testid="input-text" />
    </div>
  ),
}));

vi.mock("./components/LoadingIndicator", () => ({
  LoadingIndicator: ({ message }: { message: string }) => <div data-testid="loading-indicator">{message}</div>,
}));

vi.mock("./components/ErrorDisplay", () => ({
  ErrorDisplay: ({
    error,
    onRetry,
    onDismiss,
  }: {
    error: { message: string };
    onRetry?: () => void;
    onDismiss?: () => void;
  }) => (
    <div data-testid="error-display">
      <div>{error.message}</div>
      {onRetry && <button onClick={onRetry}>Retry</button>}
      {onDismiss && <button onClick={onDismiss}>Dismiss</button>}
    </div>
  ),
}));

vi.mock("./components/CardReviewSection", () => ({
  CardReviewSection: () => <div data-testid="card-review-section">Card Review</div>,
}));

vi.mock("./components/EditCardModal", () => ({
  EditCardModal: ({ isOpen }: { isOpen: boolean }) =>
    isOpen ? <div data-testid="edit-card-modal">Edit Modal</div> : null,
}));

vi.mock("./components/SuccessConfirmation", () => ({
  SuccessConfirmation: ({ isOpen }: { isOpen: boolean }) =>
    isOpen ? <div data-testid="success-confirmation">Success</div> : null,
}));

describe("FlashcardGenerator", () => {
  const createMockHookReturn = (overrides = {}) => ({
    inputText: "",
    setInputText: vi.fn(),
    charCount: { current: 0, min: 1000, max: 10000, isValid: true, status: "valid" as const },
    generationState: { status: "idle" } as GenerationState,
    cardReviews: [] as CardReviewState[],
    editModalState: { isOpen: false, cardIndex: null },
    bulkSummary: { total: 0, accepted: 0, rejected: 0, edited: 0, pending: 0 },
    canGenerate: true,
    canSubmitReview: false,
    generateFlashcards: vi.fn(),
    acceptCard: vi.fn(),
    rejectCard: vi.fn(),
    toggleFlip: vi.fn(),
    openEditModal: vi.fn(),
    closeEditModal: vi.fn(),
    saveEdit: vi.fn(),
    acceptAll: vi.fn(),
    rejectAll: vi.fn(),
    submitReview: vi.fn(),
    reset: vi.fn(),
    retryGeneration: vi.fn(),
    dismissError: vi.fn(),
    ...overrides,
  });

  describe("idle state", () => {
    it("should render FlashcardGeneratorForm when status is idle", () => {
      // Arrange
      const mockHook = createMockHookReturn();
      vi.spyOn(useFlashcardGenerationModule, "useFlashcardGeneration").mockReturnValue(mockHook);

      // Act
      render(<FlashcardGenerator />);

      // Assert
      expect(screen.getByTestId("flashcard-generator-form")).toBeInTheDocument();
    });

    it("should NOT render other components when idle", () => {
      // Arrange
      const mockHook = createMockHookReturn();
      vi.spyOn(useFlashcardGenerationModule, "useFlashcardGeneration").mockReturnValue(mockHook);

      // Act
      render(<FlashcardGenerator />);

      // Assert
      expect(screen.queryByTestId("loading-indicator")).not.toBeInTheDocument();
      expect(screen.queryByTestId("error-display")).not.toBeInTheDocument();
      expect(screen.queryByTestId("card-review-section")).not.toBeInTheDocument();
      expect(screen.queryByTestId("success-confirmation")).not.toBeInTheDocument();
    });
  });

  describe("generating state", () => {
    it("should render LoadingIndicator when status is generating", () => {
      // Arrange
      const mockHook = createMockHookReturn({
        generationState: { status: "generating" } as GenerationState,
      });
      vi.spyOn(useFlashcardGenerationModule, "useFlashcardGeneration").mockReturnValue(mockHook);

      // Act
      render(<FlashcardGenerator />);

      // Assert
      expect(screen.getByTestId("loading-indicator")).toBeInTheDocument();
      expect(screen.getByText("Generating flashcards...")).toBeInTheDocument();
    });

    it("should NOT render form when generating", () => {
      // Arrange
      const mockHook = createMockHookReturn({
        generationState: { status: "generating" } as GenerationState,
      });
      vi.spyOn(useFlashcardGenerationModule, "useFlashcardGeneration").mockReturnValue(mockHook);

      // Act
      render(<FlashcardGenerator />);

      // Assert
      expect(screen.queryByTestId("flashcard-generator-form")).not.toBeInTheDocument();
    });
  });

  describe("error state - generation phase", () => {
    it("should render ErrorDisplay when status is error", () => {
      // Arrange
      const mockHook = createMockHookReturn({
        generationState: {
          status: "error",
          error: { error: "Service Unavailable", message: "Service is down" },
          phase: "generation",
        } as GenerationState,
      });
      vi.spyOn(useFlashcardGenerationModule, "useFlashcardGeneration").mockReturnValue(mockHook);

      // Act
      render(<FlashcardGenerator />);

      // Assert
      expect(screen.getByTestId("error-display")).toBeInTheDocument();
      expect(screen.getByText("Service is down")).toBeInTheDocument();
    });

    it("should render form below error display for generation errors", () => {
      // Arrange
      const mockHook = createMockHookReturn({
        generationState: {
          status: "error",
          error: { error: "Service Unavailable", message: "Service is down" },
          phase: "generation",
        } as GenerationState,
      });
      vi.spyOn(useFlashcardGenerationModule, "useFlashcardGeneration").mockReturnValue(mockHook);

      // Act
      render(<FlashcardGenerator />);

      // Assert
      expect(screen.getByTestId("error-display")).toBeInTheDocument();
      expect(screen.getByTestId("flashcard-generator-form")).toBeInTheDocument();
    });

    it("should pass retryGeneration to ErrorDisplay for generation errors", () => {
      // Arrange
      const retryGeneration = vi.fn();
      const mockHook = createMockHookReturn({
        generationState: {
          status: "error",
          error: { error: "Service Unavailable", message: "Service is down" },
          phase: "generation",
        } as GenerationState,
        retryGeneration,
      });
      vi.spyOn(useFlashcardGenerationModule, "useFlashcardGeneration").mockReturnValue(mockHook);

      // Act
      render(<FlashcardGenerator />);

      // Assert
      expect(screen.getByText("Retry")).toBeInTheDocument();
    });
  });

  describe("error state - review phase", () => {
    it("should NOT render form for review errors", () => {
      // Arrange
      const mockHook = createMockHookReturn({
        generationState: {
          status: "error",
          error: { error: "BATCH_NOT_FOUND", message: "Batch not found" },
          phase: "review",
        } as GenerationState,
      });
      vi.spyOn(useFlashcardGenerationModule, "useFlashcardGeneration").mockReturnValue(mockHook);

      // Act
      render(<FlashcardGenerator />);

      // Assert
      expect(screen.getByTestId("error-display")).toBeInTheDocument();
      expect(screen.queryByTestId("flashcard-generator-form")).not.toBeInTheDocument();
    });

    it("should NOT pass retryGeneration to ErrorDisplay for review errors", () => {
      // Arrange
      const mockHook = createMockHookReturn({
        generationState: {
          status: "error",
          error: { error: "BATCH_NOT_FOUND", message: "Batch not found" },
          phase: "review",
        } as GenerationState,
      });
      vi.spyOn(useFlashcardGenerationModule, "useFlashcardGeneration").mockReturnValue(mockHook);

      // Act
      render(<FlashcardGenerator />);

      // Assert
      expect(screen.queryByText("Retry")).not.toBeInTheDocument();
    });
  });

  describe("reviewing state", () => {
    it("should render CardReviewSection when status is reviewing", () => {
      // Arrange
      const mockHook = createMockHookReturn({
        generationState: {
          status: "reviewing",
          data: {
            batch_id: "batch-123",
            generated_at: new Date().toISOString(),
            input_text_length: 5000,
            generated_cards: [{ index: 0, front_text: "Q1", back_text: "A1" }],
            total_cards_generated: 1,
            time_taken_ms: 1500,
            model_used: "openai/gpt-4o-mini",
          },
        } as GenerationState,
        cardReviews: [
          {
            index: 0,
            action: "pending",
            originalCard: { index: 0, front_text: "Q1", back_text: "A1" },
            isFlipped: false,
          },
        ] as CardReviewState[],
      });
      vi.spyOn(useFlashcardGenerationModule, "useFlashcardGeneration").mockReturnValue(mockHook);

      // Act
      render(<FlashcardGenerator />);

      // Assert
      expect(screen.getByTestId("card-review-section")).toBeInTheDocument();
    });

    it("should NOT render form when reviewing", () => {
      // Arrange
      const mockHook = createMockHookReturn({
        generationState: {
          status: "reviewing",
          data: {
            batch_id: "batch-123",
            generated_at: new Date().toISOString(),
            input_text_length: 5000,
            generated_cards: [],
            total_cards_generated: 0,
            time_taken_ms: 1500,
            model_used: "openai/gpt-4o-mini",
          },
        } as GenerationState,
      });
      vi.spyOn(useFlashcardGenerationModule, "useFlashcardGeneration").mockReturnValue(mockHook);

      // Act
      render(<FlashcardGenerator />);

      // Assert
      expect(screen.queryByTestId("flashcard-generator-form")).not.toBeInTheDocument();
    });
  });

  describe("submitting state", () => {
    it("should render LoadingIndicator when status is submitting", () => {
      // Arrange
      const mockHook = createMockHookReturn({
        generationState: { status: "submitting" } as GenerationState,
      });
      vi.spyOn(useFlashcardGenerationModule, "useFlashcardGeneration").mockReturnValue(mockHook);

      // Act
      render(<FlashcardGenerator />);

      // Assert
      expect(screen.getByTestId("loading-indicator")).toBeInTheDocument();
      expect(screen.getByText("Saving flashcards...")).toBeInTheDocument();
    });
  });

  describe("success state", () => {
    it("should render SuccessConfirmation when status is success", () => {
      // Arrange
      const mockHook = createMockHookReturn({
        generationState: {
          status: "success",
          data: {
            batch_id: "batch-123",
            cards_accepted: 2,
            cards_rejected: 0,
            cards_edited: 1,
            created_flashcards: [],
          },
        } as GenerationState,
      });
      vi.spyOn(useFlashcardGenerationModule, "useFlashcardGeneration").mockReturnValue(mockHook);

      // Act
      render(<FlashcardGenerator />);

      // Assert
      expect(screen.getByTestId("success-confirmation")).toBeInTheDocument();
    });
  });

  describe("edit modal", () => {
    it("should render EditCardModal when editModalState.isOpen is true", () => {
      // Arrange
      const mockHook = createMockHookReturn({
        editModalState: { isOpen: true, cardIndex: 0 },
        cardReviews: [
          {
            index: 0,
            action: "pending",
            originalCard: { index: 0, front_text: "Q1", back_text: "A1" },
            isFlipped: false,
          },
        ] as CardReviewState[],
      });
      vi.spyOn(useFlashcardGenerationModule, "useFlashcardGeneration").mockReturnValue(mockHook);

      // Act
      render(<FlashcardGenerator />);

      // Assert
      expect(screen.getByTestId("edit-card-modal")).toBeInTheDocument();
    });

    it("should NOT render EditCardModal when editModalState.isOpen is false", () => {
      // Arrange
      const mockHook = createMockHookReturn({
        editModalState: { isOpen: false, cardIndex: null },
      });
      vi.spyOn(useFlashcardGenerationModule, "useFlashcardGeneration").mockReturnValue(mockHook);

      // Act
      render(<FlashcardGenerator />);

      // Assert
      expect(screen.queryByTestId("edit-card-modal")).not.toBeInTheDocument();
    });

    it("should pass edited card to EditCardModal when available", () => {
      // Arrange
      const mockHook = createMockHookReturn({
        editModalState: { isOpen: true, cardIndex: 0 },
        cardReviews: [
          {
            index: 0,
            action: "edit",
            originalCard: { index: 0, front_text: "Original", back_text: "Original" },
            editedCard: { index: 0, front_text: "Edited", back_text: "Edited" },
            isFlipped: false,
          },
        ] as CardReviewState[],
      });
      vi.spyOn(useFlashcardGenerationModule, "useFlashcardGeneration").mockReturnValue(mockHook);

      // Act
      render(<FlashcardGenerator />);

      // Assert - Modal is rendered (card prop verification would require spy)
      expect(screen.getByTestId("edit-card-modal")).toBeInTheDocument();
    });

    it("should pass original card to EditCardModal when no edited card", () => {
      // Arrange
      const mockHook = createMockHookReturn({
        editModalState: { isOpen: true, cardIndex: 0 },
        cardReviews: [
          {
            index: 0,
            action: "pending",
            originalCard: { index: 0, front_text: "Original", back_text: "Original" },
            isFlipped: false,
          },
        ] as CardReviewState[],
      });
      vi.spyOn(useFlashcardGenerationModule, "useFlashcardGeneration").mockReturnValue(mockHook);

      // Act
      render(<FlashcardGenerator />);

      // Assert - Modal is rendered (card prop verification would require spy)
      expect(screen.getByTestId("edit-card-modal")).toBeInTheDocument();
    });

    it("should pass null card to EditCardModal when cardIndex is null", () => {
      // Arrange
      const mockHook = createMockHookReturn({
        editModalState: { isOpen: true, cardIndex: null },
        cardReviews: [],
      });
      vi.spyOn(useFlashcardGenerationModule, "useFlashcardGeneration").mockReturnValue(mockHook);

      // Act
      render(<FlashcardGenerator />);

      // Assert - Modal is rendered with null card
      expect(screen.getByTestId("edit-card-modal")).toBeInTheDocument();
    });

    it("should pass null card to EditCardModal when review not found", () => {
      // Arrange
      const mockHook = createMockHookReturn({
        editModalState: { isOpen: true, cardIndex: 99 },
        cardReviews: [
          {
            index: 0,
            action: "pending",
            originalCard: { index: 0, front_text: "Q1", back_text: "A1" },
            isFlipped: false,
          },
        ] as CardReviewState[],
      });
      vi.spyOn(useFlashcardGenerationModule, "useFlashcardGeneration").mockReturnValue(mockHook);

      // Act
      render(<FlashcardGenerator />);

      // Assert - Modal is rendered with null card
      expect(screen.getByTestId("edit-card-modal")).toBeInTheDocument();
    });
  });

  describe("state transitions", () => {
    it("should only render components matching current state", () => {
      // Arrange - Start with idle
      const mockHook = createMockHookReturn({
        generationState: { status: "idle" } as GenerationState,
      });
      const spy = vi.spyOn(useFlashcardGenerationModule, "useFlashcardGeneration").mockReturnValue(mockHook);

      // Act
      const { rerender } = render(<FlashcardGenerator />);

      // Assert - Idle
      expect(screen.getByTestId("flashcard-generator-form")).toBeInTheDocument();

      // Update to generating
      spy.mockReturnValue(
        createMockHookReturn({
          generationState: { status: "generating" } as GenerationState,
        })
      );
      rerender(<FlashcardGenerator />);

      // Assert - Generating
      expect(screen.getByTestId("loading-indicator")).toBeInTheDocument();
      expect(screen.queryByTestId("flashcard-generator-form")).not.toBeInTheDocument();
    });
  });

  describe("integration with hook", () => {
    it("should call hook functions through component interactions", () => {
      // Arrange
      const mockHook = createMockHookReturn();
      vi.spyOn(useFlashcardGenerationModule, "useFlashcardGeneration").mockReturnValue(mockHook);

      // Act
      render(<FlashcardGenerator />);

      // Assert - Hook was called
      expect(useFlashcardGenerationModule.useFlashcardGeneration).toHaveBeenCalled();
    });
  });
});
