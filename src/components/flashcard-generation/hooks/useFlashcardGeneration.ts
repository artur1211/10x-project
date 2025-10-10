import { useState, useMemo, useCallback } from "react";
import type {
  GenerationState,
  CardReviewState,
  GenerateFlashcardsResponse,
  ReviewFlashcardsResponse,
  GenerateFlashcardsCommand,
  ReviewFlashcardsCommand,
  ApiError,
} from "../types";
import { calculateBulkSummary, buildReviewDecisions, initializeCardReviews } from "../utils";
import { useCharacterCount } from "./useCharacterCount";

/**
 * Main hook for flashcard generation workflow
 */
export function useFlashcardGeneration() {
  // Core state
  const [inputText, setInputText] = useState<string>("");
  const [generationState, setGenerationState] = useState<GenerationState>({
    status: "idle",
  });
  const [cardReviews, setCardReviews] = useState<CardReviewState[]>([]);
  const [editModalState, setEditModalState] = useState<{
    isOpen: boolean;
    cardIndex: number | null;
  }>({
    isOpen: false,
    cardIndex: null,
  });

  // Derived state
  const charCount = useCharacterCount(inputText, 1000, 10000);
  const bulkSummary = useMemo(() => calculateBulkSummary(cardReviews), [cardReviews]);
  const canGenerate = charCount.isValid && generationState.status === "idle";
  const canSubmitReview = bulkSummary.pending === 0; // All cards must be reviewed

  // API function: Generate flashcards
  const generateFlashcards = useCallback(async () => {
    try {
      setGenerationState({ status: "generating" });

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

      const data: GenerateFlashcardsResponse = await response.json();

      // Initialize card review states
      const initialReviews = initializeCardReviews(data.generated_cards);
      setCardReviews(initialReviews);
      setGenerationState({ status: "reviewing", data });
    } catch (error) {
      const apiError = error as ApiError;
      setGenerationState({
        status: "error",
        error: apiError,
        phase: "generation",
      });
    }
  }, [inputText]);

  // API function: Submit review
  const submitReview = useCallback(async () => {
    if (generationState.status !== "reviewing") return;

    try {
      setGenerationState({ status: "submitting" });

      const decisions = buildReviewDecisions(cardReviews);

      const response = await fetch(`/api/flashcards/batch/${generationState.data.batch_id}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          decisions,
        } satisfies ReviewFlashcardsCommand),
      });

      if (!response.ok) {
        const error: ApiError = await response.json();
        // Preserve data for retry
        setGenerationState({
          status: "reviewing",
          data: generationState.data,
        });
        throw error;
      }

      const data: ReviewFlashcardsResponse = await response.json();
      setGenerationState({ status: "success", data });
    } catch (error) {
      const apiError = error as ApiError;
      setGenerationState({
        status: "error",
        error: apiError,
        phase: "review",
      });
    }
  }, [generationState, cardReviews]);

  // Card action functions
  const acceptCard = useCallback((index: number) => {
    setCardReviews((prev) =>
      prev.map((review) =>
        review.index === index ? { ...review, action: "accept" as const, editedCard: undefined } : review
      )
    );
  }, []);

  const rejectCard = useCallback((index: number) => {
    setCardReviews((prev) =>
      prev.map((review) =>
        review.index === index ? { ...review, action: "reject" as const, editedCard: undefined } : review
      )
    );
  }, []);

  const toggleFlip = useCallback((index: number) => {
    setCardReviews((prev) =>
      prev.map((review) => (review.index === index ? { ...review, isFlipped: !review.isFlipped } : review))
    );
  }, []);

  const acceptAll = useCallback(() => {
    setCardReviews((prev) =>
      prev.map((review) => (review.action === "pending" ? { ...review, action: "accept" as const } : review))
    );
  }, []);

  const rejectAll = useCallback(() => {
    setCardReviews((prev) =>
      prev.map((review) => (review.action === "pending" ? { ...review, action: "reject" as const } : review))
    );
  }, []);

  // Modal functions
  const openEditModal = useCallback((index: number) => {
    setEditModalState({
      isOpen: true,
      cardIndex: index,
    });
  }, []);

  const closeEditModal = useCallback(() => {
    setEditModalState({
      isOpen: false,
      cardIndex: null,
    });
  }, []);

  const saveEdit = useCallback(
    (index: number, frontText: string, backText: string) => {
      setCardReviews((prev) =>
        prev.map((review) =>
          review.index === index
            ? {
                ...review,
                action: "edit" as const,
                editedCard: {
                  index,
                  front_text: frontText,
                  back_text: backText,
                },
              }
            : review
        )
      );

      closeEditModal();
    },
    [closeEditModal]
  );

  // Reset function
  const reset = useCallback(() => {
    setInputText("");
    setGenerationState({ status: "idle" });
    setCardReviews([]);
    closeEditModal();
  }, [closeEditModal]);

  // Error recovery
  const retryGeneration = useCallback(() => {
    generateFlashcards();
  }, [generateFlashcards]);

  const dismissError = useCallback(() => {
    if (generationState.status === "error") {
      if (generationState.phase === "generation") {
        setGenerationState({ status: "idle" });
      } else {
        // Return to reviewing state if we have data
        const reviewing = generationState as Extract<GenerationState, { status: "error" }>;
        // Try to find previous reviewing state data in cardReviews
        setGenerationState({ status: "idle" });
      }
    }
  }, [generationState]);

  return {
    // State
    inputText,
    setInputText,
    charCount,
    generationState,
    cardReviews,
    editModalState,
    bulkSummary,
    canGenerate,
    canSubmitReview,

    // Actions
    generateFlashcards,
    acceptCard,
    rejectCard,
    toggleFlip,
    openEditModal,
    closeEditModal,
    saveEdit,
    acceptAll,
    rejectAll,
    submitReview,
    reset,
    retryGeneration,
    dismissError,
  };
}
