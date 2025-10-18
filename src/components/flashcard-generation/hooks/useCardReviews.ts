import { useState, useMemo, useCallback } from "react";
import type { CardReviewState, GeneratedCardPreview } from "../types";
import { calculateBulkSummary, initializeCardReviews } from "../utils";

/**
 * Hook for managing card review state and actions
 * Handles individual card actions and bulk operations
 */
export function useCardReviews() {
  const [cardReviews, setCardReviews] = useState<CardReviewState[]>([]);

  // Derived state
  const bulkSummary = useMemo(() => calculateBulkSummary(cardReviews), [cardReviews]);

  // Initialize card reviews from generated cards
  const initializeReviews = useCallback((cards: GeneratedCardPreview[]) => {
    const initialReviews = initializeCardReviews(cards);
    setCardReviews(initialReviews);
  }, []);

  // Individual card actions
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

  // Bulk actions
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

  // Edit card
  const editCard = useCallback((index: number, frontText: string, backText: string) => {
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
  }, []);

  // Reset
  const reset = useCallback(() => {
    setCardReviews([]);
  }, []);

  return {
    cardReviews,
    bulkSummary,
    initializeReviews,
    acceptCard,
    rejectCard,
    toggleFlip,
    acceptAll,
    rejectAll,
    editCard,
    reset,
  };
}
