import type {
  CharacterCountState,
  CardReviewState,
  BulkActionSummary,
  ReviewDecision,
  GeneratedCardPreview,
} from "./types";

/**
 * Calculate character count state with validation
 */
export function calculateCharacterCount(text: string, min: number, max: number): CharacterCountState {
  const current = text.trim().length;
  const isValid = current >= min && current <= max;

  let status: CharacterCountState["status"];
  if (current < min) {
    status = "too-short";
  } else if (current > max) {
    status = "too-long";
  } else if (current > max * 0.9) {
    status = "warning";
  } else {
    status = "valid";
  }

  return { current, min, max, isValid, status };
}

/**
 * Calculate bulk action summary from card reviews
 */
export function calculateBulkSummary(reviews: CardReviewState[]): BulkActionSummary {
  return {
    total: reviews.length,
    accepted: reviews.filter((r) => r.action === "accept").length,
    rejected: reviews.filter((r) => r.action === "reject").length,
    edited: reviews.filter((r) => r.action === "edit").length,
    pending: reviews.filter((r) => r.action === "pending").length,
  };
}

/**
 * Build review decisions array from card reviews
 */
export function buildReviewDecisions(reviews: CardReviewState[]): ReviewDecision[] {
  return reviews
    .filter((review) => review.action !== "pending")
    .map((review) => {
      const card = review.action === "edit" ? review.editedCard! : review.originalCard;
      return {
        index: review.index,
        action: review.action as "accept" | "reject" | "edit",
        front_text: card.front_text,
        back_text: card.back_text,
      };
    });
}

/**
 * Initialize card reviews from API response
 */
export function initializeCardReviews(cards: GeneratedCardPreview[]): CardReviewState[] {
  return cards.map((card) => ({
    index: card.index,
    action: "pending" as const,
    originalCard: card,
    isFlipped: false,
  }));
}

/**
 * Get character count status message
 */
export function getCharCountMessage(state: CharacterCountState): string {
  switch (state.status) {
    case "too-short":
      return `${state.current} / ${state.min} characters (minimum ${state.min} required)`;
    case "too-long":
      return `${state.current} / ${state.max} characters (maximum ${state.max} exceeded)`;
    case "warning":
      return `${state.current} / ${state.max} characters (approaching limit)`;
    case "valid":
      return `${state.current} / ${state.max} characters`;
  }
}

/**
 * Get character count color class
 */
export function getCharCountColorClass(status: CharacterCountState["status"]): string {
  switch (status) {
    case "too-short":
    case "too-long":
      return "text-red-600 dark:text-red-400";
    case "warning":
      return "text-yellow-600 dark:text-yellow-400";
    case "valid":
      return "text-green-600 dark:text-green-400";
  }
}
