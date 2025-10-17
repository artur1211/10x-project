import { describe, it, expect } from "vitest";
import {
  calculateCharacterCount,
  calculateBulkSummary,
  buildReviewDecisions,
  initializeCardReviews,
  getCharCountMessage,
  getCharCountColorClass,
} from "./utils";
import type { CardReviewState, GeneratedCardPreview } from "./types";

describe("utils", () => {
  describe("calculateCharacterCount", () => {
    // Arrange
    const min = 1000;
    const max = 10000;

    it("should return too-short status for empty string", () => {
      // Act
      const result = calculateCharacterCount("", min, max);

      // Assert
      expect(result).toEqual({
        current: 0,
        min,
        max,
        isValid: false,
        status: "too-short",
      });
    });

    it("should return too-short status for text below minimum", () => {
      // Arrange
      const text = "a".repeat(999);

      // Act
      const result = calculateCharacterCount(text, min, max);

      // Assert
      expect(result).toEqual({
        current: 999,
        min,
        max,
        isValid: false,
        status: "too-short",
      });
    });

    it("should return valid status for text at minimum boundary", () => {
      // Arrange
      const text = "a".repeat(1000);

      // Act
      const result = calculateCharacterCount(text, min, max);

      // Assert
      expect(result).toEqual({
        current: 1000,
        min,
        max,
        isValid: true,
        status: "valid",
      });
    });

    it("should return valid status for text in middle range", () => {
      // Arrange
      const text = "a".repeat(5000);

      // Act
      const result = calculateCharacterCount(text, min, max);

      // Assert
      expect(result).toEqual({
        current: 5000,
        min,
        max,
        isValid: true,
        status: "valid",
      });
    });

    it("should return warning status for text approaching maximum (>90%)", () => {
      // Arrange
      const text = "a".repeat(9100); // 91% of 10000

      // Act
      const result = calculateCharacterCount(text, min, max);

      // Assert
      expect(result).toEqual({
        current: 9100,
        min,
        max,
        isValid: true,
        status: "warning",
      });
    });

    it("should return valid status for text at exactly 90% of maximum", () => {
      // Arrange
      const text = "a".repeat(9000); // exactly 90% of 10000

      // Act
      const result = calculateCharacterCount(text, min, max);

      // Assert
      expect(result).toEqual({
        current: 9000,
        min,
        max,
        isValid: true,
        status: "valid",
      });
    });

    it("should return warning status for text at maximum boundary", () => {
      // Arrange
      const text = "a".repeat(10000);

      // Act
      const result = calculateCharacterCount(text, min, max);

      // Assert
      expect(result).toEqual({
        current: 10000,
        min,
        max,
        isValid: true,
        status: "warning", // At 100% which is > 90%
      });
    });

    it("should return too-long status for text exceeding maximum", () => {
      // Arrange
      const text = "a".repeat(10001);

      // Act
      const result = calculateCharacterCount(text, min, max);

      // Assert
      expect(result).toEqual({
        current: 10001,
        min,
        max,
        isValid: false,
        status: "too-long",
      });
    });

    it("should trim whitespace before counting", () => {
      // Arrange
      const text = "  " + "a".repeat(1000) + "  ";

      // Act
      const result = calculateCharacterCount(text, min, max);

      // Assert
      expect(result.current).toBe(1000);
      expect(result.isValid).toBe(true);
    });

    it("should handle text with only whitespace", () => {
      // Arrange
      const text = "   \n\t  ";

      // Act
      const result = calculateCharacterCount(text, min, max);

      // Assert
      expect(result.current).toBe(0);
      expect(result.status).toBe("too-short");
    });

    it("should work with different min/max values", () => {
      // Arrange
      const customMin = 10;
      const customMax = 500;
      const text = "a".repeat(250);

      // Act
      const result = calculateCharacterCount(text, customMin, customMax);

      // Assert
      expect(result).toEqual({
        current: 250,
        min: customMin,
        max: customMax,
        isValid: true,
        status: "valid",
      });
    });
  });

  describe("calculateBulkSummary", () => {
    it("should return empty summary for empty array", () => {
      // Arrange
      const reviews: CardReviewState[] = [];

      // Act
      const result = calculateBulkSummary(reviews);

      // Assert
      expect(result).toEqual({
        total: 0,
        accepted: 0,
        rejected: 0,
        edited: 0,
        pending: 0,
      });
    });

    it("should count pending reviews correctly", () => {
      // Arrange
      const reviews: CardReviewState[] = [
        {
          index: 0,
          action: "pending",
          originalCard: { index: 0, front_text: "Q1", back_text: "A1" },
          isFlipped: false,
        },
        {
          index: 1,
          action: "pending",
          originalCard: { index: 1, front_text: "Q2", back_text: "A2" },
          isFlipped: false,
        },
      ];

      // Act
      const result = calculateBulkSummary(reviews);

      // Assert
      expect(result).toEqual({
        total: 2,
        accepted: 0,
        rejected: 0,
        edited: 0,
        pending: 2,
      });
    });

    it("should count accepted reviews correctly", () => {
      // Arrange
      const reviews: CardReviewState[] = [
        {
          index: 0,
          action: "accept",
          originalCard: { index: 0, front_text: "Q1", back_text: "A1" },
          isFlipped: false,
        },
        {
          index: 1,
          action: "accept",
          originalCard: { index: 1, front_text: "Q2", back_text: "A2" },
          isFlipped: false,
        },
      ];

      // Act
      const result = calculateBulkSummary(reviews);

      // Assert
      expect(result).toEqual({
        total: 2,
        accepted: 2,
        rejected: 0,
        edited: 0,
        pending: 0,
      });
    });

    it("should count rejected reviews correctly", () => {
      // Arrange
      const reviews: CardReviewState[] = [
        {
          index: 0,
          action: "reject",
          originalCard: { index: 0, front_text: "Q1", back_text: "A1" },
          isFlipped: false,
        },
      ];

      // Act
      const result = calculateBulkSummary(reviews);

      // Assert
      expect(result).toEqual({
        total: 1,
        accepted: 0,
        rejected: 1,
        edited: 0,
        pending: 0,
      });
    });

    it("should count edited reviews correctly", () => {
      // Arrange
      const reviews: CardReviewState[] = [
        {
          index: 0,
          action: "edit",
          originalCard: { index: 0, front_text: "Q1", back_text: "A1" },
          editedCard: { index: 0, front_text: "Q1 edited", back_text: "A1 edited" },
          isFlipped: false,
        },
      ];

      // Act
      const result = calculateBulkSummary(reviews);

      // Assert
      expect(result).toEqual({
        total: 1,
        accepted: 0,
        rejected: 0,
        edited: 1,
        pending: 0,
      });
    });

    it("should count mixed review states correctly", () => {
      // Arrange
      const reviews: CardReviewState[] = [
        {
          index: 0,
          action: "accept",
          originalCard: { index: 0, front_text: "Q1", back_text: "A1" },
          isFlipped: false,
        },
        {
          index: 1,
          action: "reject",
          originalCard: { index: 1, front_text: "Q2", back_text: "A2" },
          isFlipped: false,
        },
        {
          index: 2,
          action: "edit",
          originalCard: { index: 2, front_text: "Q3", back_text: "A3" },
          editedCard: { index: 2, front_text: "Q3 edited", back_text: "A3 edited" },
          isFlipped: false,
        },
        {
          index: 3,
          action: "pending",
          originalCard: { index: 3, front_text: "Q4", back_text: "A4" },
          isFlipped: false,
        },
        {
          index: 4,
          action: "accept",
          originalCard: { index: 4, front_text: "Q5", back_text: "A5" },
          isFlipped: false,
        },
      ];

      // Act
      const result = calculateBulkSummary(reviews);

      // Assert
      expect(result).toEqual({
        total: 5,
        accepted: 2,
        rejected: 1,
        edited: 1,
        pending: 1,
      });
    });
  });

  describe("buildReviewDecisions", () => {
    it("should return empty array for empty reviews", () => {
      // Arrange
      const reviews: CardReviewState[] = [];

      // Act
      const result = buildReviewDecisions(reviews);

      // Assert
      expect(result).toEqual([]);
    });

    it("should filter out pending reviews", () => {
      // Arrange
      const reviews: CardReviewState[] = [
        {
          index: 0,
          action: "pending",
          originalCard: { index: 0, front_text: "Q1", back_text: "A1" },
          isFlipped: false,
        },
        {
          index: 1,
          action: "accept",
          originalCard: { index: 1, front_text: "Q2", back_text: "A2" },
          isFlipped: false,
        },
      ];

      // Act
      const result = buildReviewDecisions(reviews);

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0].index).toBe(1);
    });

    it("should build decisions for accepted cards", () => {
      // Arrange
      const reviews: CardReviewState[] = [
        {
          index: 0,
          action: "accept",
          originalCard: { index: 0, front_text: "Original Q", back_text: "Original A" },
          isFlipped: false,
        },
      ];

      // Act
      const result = buildReviewDecisions(reviews);

      // Assert
      expect(result).toEqual([
        {
          index: 0,
          action: "accept",
          front_text: "Original Q",
          back_text: "Original A",
        },
      ]);
    });

    it("should build decisions for rejected cards", () => {
      // Arrange
      const reviews: CardReviewState[] = [
        {
          index: 0,
          action: "reject",
          originalCard: { index: 0, front_text: "Q", back_text: "A" },
          isFlipped: false,
        },
      ];

      // Act
      const result = buildReviewDecisions(reviews);

      // Assert
      expect(result).toEqual([
        {
          index: 0,
          action: "reject",
          front_text: "Q",
          back_text: "A",
        },
      ]);
    });

    it("should use edited card for edit action", () => {
      // Arrange
      const reviews: CardReviewState[] = [
        {
          index: 0,
          action: "edit",
          originalCard: { index: 0, front_text: "Original Q", back_text: "Original A" },
          editedCard: { index: 0, front_text: "Edited Q", back_text: "Edited A" },
          isFlipped: false,
        },
      ];

      // Act
      const result = buildReviewDecisions(reviews);

      // Assert
      expect(result).toEqual([
        {
          index: 0,
          action: "edit",
          front_text: "Edited Q",
          back_text: "Edited A",
        },
      ]);
    });

    it("should fallback to original card if edited card is missing", () => {
      // Arrange
      const reviews: CardReviewState[] = [
        {
          index: 0,
          action: "edit",
          originalCard: { index: 0, front_text: "Original Q", back_text: "Original A" },
          editedCard: undefined,
          isFlipped: false,
        },
      ];

      // Act
      const result = buildReviewDecisions(reviews);

      // Assert
      expect(result).toEqual([
        {
          index: 0,
          action: "edit",
          front_text: "Original Q",
          back_text: "Original A",
        },
      ]);
    });

    it("should handle multiple decisions in order", () => {
      // Arrange
      const reviews: CardReviewState[] = [
        {
          index: 0,
          action: "accept",
          originalCard: { index: 0, front_text: "Q1", back_text: "A1" },
          isFlipped: false,
        },
        {
          index: 1,
          action: "pending",
          originalCard: { index: 1, front_text: "Q2", back_text: "A2" },
          isFlipped: false,
        },
        {
          index: 2,
          action: "edit",
          originalCard: { index: 2, front_text: "Q3", back_text: "A3" },
          editedCard: { index: 2, front_text: "Q3 edited", back_text: "A3 edited" },
          isFlipped: false,
        },
        {
          index: 3,
          action: "reject",
          originalCard: { index: 3, front_text: "Q4", back_text: "A4" },
          isFlipped: false,
        },
      ];

      // Act
      const result = buildReviewDecisions(reviews);

      // Assert
      expect(result).toHaveLength(3);
      expect(result[0]).toEqual({
        index: 0,
        action: "accept",
        front_text: "Q1",
        back_text: "A1",
      });
      expect(result[1]).toEqual({
        index: 2,
        action: "edit",
        front_text: "Q3 edited",
        back_text: "A3 edited",
      });
      expect(result[2]).toEqual({
        index: 3,
        action: "reject",
        front_text: "Q4",
        back_text: "A4",
      });
    });
  });

  describe("initializeCardReviews", () => {
    it("should return empty array for empty cards", () => {
      // Arrange
      const cards: GeneratedCardPreview[] = [];

      // Act
      const result = initializeCardReviews(cards);

      // Assert
      expect(result).toEqual([]);
    });

    it("should initialize single card review", () => {
      // Arrange
      const cards: GeneratedCardPreview[] = [{ index: 0, front_text: "Q1", back_text: "A1" }];

      // Act
      const result = initializeCardReviews(cards);

      // Assert
      expect(result).toEqual([
        {
          index: 0,
          action: "pending",
          originalCard: { index: 0, front_text: "Q1", back_text: "A1" },
          isFlipped: false,
        },
      ]);
    });

    it("should initialize multiple card reviews", () => {
      // Arrange
      const cards: GeneratedCardPreview[] = [
        { index: 0, front_text: "Q1", back_text: "A1" },
        { index: 1, front_text: "Q2", back_text: "A2" },
        { index: 2, front_text: "Q3", back_text: "A3" },
      ];

      // Act
      const result = initializeCardReviews(cards);

      // Assert
      expect(result).toHaveLength(3);
      result.forEach((review, idx) => {
        expect(review).toEqual({
          index: idx,
          action: "pending",
          originalCard: cards[idx],
          isFlipped: false,
        });
      });
    });

    it("should preserve card indices from input", () => {
      // Arrange
      const cards: GeneratedCardPreview[] = [
        { index: 5, front_text: "Q1", back_text: "A1" },
        { index: 10, front_text: "Q2", back_text: "A2" },
      ];

      // Act
      const result = initializeCardReviews(cards);

      // Assert
      expect(result[0].index).toBe(5);
      expect(result[1].index).toBe(10);
    });

    it("should initialize all cards as not flipped", () => {
      // Arrange
      const cards: GeneratedCardPreview[] = [
        { index: 0, front_text: "Q1", back_text: "A1" },
        { index: 1, front_text: "Q2", back_text: "A2" },
      ];

      // Act
      const result = initializeCardReviews(cards);

      // Assert
      result.forEach((review) => {
        expect(review.isFlipped).toBe(false);
      });
    });
  });

  describe("getCharCountMessage", () => {
    it("should return correct message for too-short status", () => {
      // Arrange
      const state = {
        current: 500,
        min: 1000,
        max: 10000,
        isValid: false,
        status: "too-short" as const,
      };

      // Act
      const result = getCharCountMessage(state);

      // Assert
      expect(result).toBe("500 / 1000 characters (minimum 1000 required)");
    });

    it("should return correct message for too-long status", () => {
      // Arrange
      const state = {
        current: 10500,
        min: 1000,
        max: 10000,
        isValid: false,
        status: "too-long" as const,
      };

      // Act
      const result = getCharCountMessage(state);

      // Assert
      expect(result).toBe("10500 / 10000 characters (maximum 10000 exceeded)");
    });

    it("should return correct message for warning status", () => {
      // Arrange
      const state = {
        current: 9500,
        min: 1000,
        max: 10000,
        isValid: true,
        status: "warning" as const,
      };

      // Act
      const result = getCharCountMessage(state);

      // Assert
      expect(result).toBe("9500 / 10000 characters (approaching limit)");
    });

    it("should return correct message for valid status", () => {
      // Arrange
      const state = {
        current: 5000,
        min: 1000,
        max: 10000,
        isValid: true,
        status: "valid" as const,
      };

      // Act
      const result = getCharCountMessage(state);

      // Assert
      expect(result).toBe("5000 / 10000 characters");
    });

    it("should handle zero characters", () => {
      // Arrange
      const state = {
        current: 0,
        min: 1000,
        max: 10000,
        isValid: false,
        status: "too-short" as const,
      };

      // Act
      const result = getCharCountMessage(state);

      // Assert
      expect(result).toBe("0 / 1000 characters (minimum 1000 required)");
    });
  });

  describe("getCharCountColorClass", () => {
    it("should return red color for too-short status", () => {
      // Act
      const result = getCharCountColorClass("too-short");

      // Assert
      expect(result).toBe("text-red-600 dark:text-red-400");
    });

    it("should return red color for too-long status", () => {
      // Act
      const result = getCharCountColorClass("too-long");

      // Assert
      expect(result).toBe("text-red-600 dark:text-red-400");
    });

    it("should return yellow color for warning status", () => {
      // Act
      const result = getCharCountColorClass("warning");

      // Assert
      expect(result).toBe("text-yellow-600 dark:text-yellow-400");
    });

    it("should return green color for valid status", () => {
      // Act
      const result = getCharCountColorClass("valid");

      // Assert
      expect(result).toBe("text-green-600 dark:text-green-400");
    });
  });
});
