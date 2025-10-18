import { useState, useCallback } from "react";
import type { ApiError } from "../types";
import { buildReviewDecisions } from "../utils";
import { useCharacterCount } from "./useCharacterCount";
import { useGenerationStateMachine } from "./useGenerationStateMachine";
import { useCardReviews } from "./useCardReviews";
import { useEditModal } from "./useEditModal";
import { flashcardApi } from "../services/flashcardApi";

/**
 * Main hook for flashcard generation workflow
 * Composes sub-hooks and orchestrates the generation workflow
 */
export function useFlashcardGeneration() {
  // Input text state
  const [inputText, setInputText] = useState<string>("");

  // Sub-hooks
  const stateMachine = useGenerationStateMachine();
  const cardReviews = useCardReviews();
  const editModal = useEditModal();
  const charCount = useCharacterCount(inputText, 1000, 10000);

  // Derived state
  const canGenerate = charCount.isValid && stateMachine.generationState.status === "idle";
  const canSubmitReview = cardReviews.bulkSummary.pending === 0; // All cards must be reviewed

  // API function: Generate flashcards
  const generateFlashcards = useCallback(async () => {
    try {
      stateMachine.setGenerating();
      const data = await flashcardApi.generateFlashcards(inputText);
      cardReviews.initializeReviews(data.generated_cards);
      stateMachine.setReviewing(data);
    } catch (error) {
      const apiError = error as ApiError;
      stateMachine.setError(apiError, "generation");
    }
  }, [inputText, stateMachine, cardReviews]);

  // API function: Submit review
  const submitReview = useCallback(async () => {
    if (stateMachine.generationState.status !== "reviewing") return;

    try {
      stateMachine.setSubmitting();
      const decisions = buildReviewDecisions(cardReviews.cardReviews);
      const data = await flashcardApi.submitReview(stateMachine.generationState.data.batch_id, decisions);
      stateMachine.setSuccess(data);
    } catch (error) {
      const apiError = error as ApiError;
      // Preserve data for retry
      stateMachine.setReviewing(stateMachine.generationState.data);
      stateMachine.setError(apiError, "review");
    }
  }, [stateMachine, cardReviews]);

  // Save edit function (coordinates between card reviews and modal)
  const saveEdit = useCallback(
    (index: number, frontText: string, backText: string) => {
      cardReviews.editCard(index, frontText, backText);
      editModal.closeEditModal();
    },
    [cardReviews, editModal]
  );

  // Reset function (coordinates all sub-hooks)
  const reset = useCallback(() => {
    setInputText("");
    stateMachine.reset();
    cardReviews.reset();
    editModal.reset();
  }, [stateMachine, cardReviews, editModal]);

  // Error recovery
  const retryGeneration = useCallback(() => {
    generateFlashcards();
  }, [generateFlashcards]);

  const dismissError = useCallback(() => {
    if (stateMachine.generationState.status === "error") {
      stateMachine.reset();
    }
  }, [stateMachine]);

  return {
    // State
    inputText,
    setInputText,
    charCount,
    generationState: stateMachine.generationState,
    cardReviews: cardReviews.cardReviews,
    editModalState: editModal.editModalState,
    bulkSummary: cardReviews.bulkSummary,
    canGenerate,
    canSubmitReview,

    // Actions
    generateFlashcards,
    acceptCard: cardReviews.acceptCard,
    rejectCard: cardReviews.rejectCard,
    toggleFlip: cardReviews.toggleFlip,
    openEditModal: editModal.openEditModal,
    closeEditModal: editModal.closeEditModal,
    saveEdit,
    acceptAll: cardReviews.acceptAll,
    rejectAll: cardReviews.rejectAll,
    submitReview,
    reset,
    retryGeneration,
    dismissError,
  };
}
