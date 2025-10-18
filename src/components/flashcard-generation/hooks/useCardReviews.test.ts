import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useCardReviews } from "./useCardReviews";
import type { GeneratedCardPreview } from "../types";

describe("useCardReviews", () => {
  const mockCards: GeneratedCardPreview[] = [
    { index: 0, front_text: "Question 1", back_text: "Answer 1" },
    { index: 1, front_text: "Question 2", back_text: "Answer 2" },
    { index: 2, front_text: "Question 3", back_text: "Answer 3" },
  ];

  it("should initialize with empty card reviews", () => {
    // Act
    const { result } = renderHook(() => useCardReviews());

    // Assert
    expect(result.current.cardReviews).toEqual([]);
  });

  it("should initialize with correct bulk summary for empty state", () => {
    // Act
    const { result } = renderHook(() => useCardReviews());

    // Assert
    expect(result.current.bulkSummary).toEqual({
      total: 0,
      accepted: 0,
      rejected: 0,
      edited: 0,
      pending: 0,
    });
  });

  it("should initialize card reviews from generated cards", () => {
    // Arrange
    const { result } = renderHook(() => useCardReviews());

    // Act
    act(() => {
      result.current.initializeReviews(mockCards);
    });

    // Assert
    expect(result.current.cardReviews).toHaveLength(3);
    expect(result.current.cardReviews[0]).toEqual({
      index: 0,
      action: "pending",
      originalCard: mockCards[0],
      isFlipped: false,
    });
  });

  it("should accept a card", () => {
    // Arrange
    const { result } = renderHook(() => useCardReviews());

    act(() => {
      result.current.initializeReviews(mockCards);
    });

    // Act
    act(() => {
      result.current.acceptCard(0);
    });

    // Assert
    expect(result.current.cardReviews[0].action).toBe("accept");
    expect(result.current.cardReviews[0].editedCard).toBeUndefined();
  });

  it("should reject a card", () => {
    // Arrange
    const { result } = renderHook(() => useCardReviews());

    act(() => {
      result.current.initializeReviews(mockCards);
    });

    // Act
    act(() => {
      result.current.rejectCard(1);
    });

    // Assert
    expect(result.current.cardReviews[1].action).toBe("reject");
    expect(result.current.cardReviews[1].editedCard).toBeUndefined();
  });

  it("should toggle card flip", () => {
    // Arrange
    const { result } = renderHook(() => useCardReviews());

    act(() => {
      result.current.initializeReviews(mockCards);
    });

    // Act
    act(() => {
      result.current.toggleFlip(0);
    });

    // Assert
    expect(result.current.cardReviews[0].isFlipped).toBe(true);

    // Act - toggle again
    act(() => {
      result.current.toggleFlip(0);
    });

    // Assert
    expect(result.current.cardReviews[0].isFlipped).toBe(false);
  });

  it("should accept all pending cards", () => {
    // Arrange
    const { result } = renderHook(() => useCardReviews());

    act(() => {
      result.current.initializeReviews(mockCards);
    });

    // Act
    act(() => {
      result.current.acceptAll();
    });

    // Assert
    expect(result.current.cardReviews.every((r) => r.action === "accept")).toBe(true);
    expect(result.current.bulkSummary.accepted).toBe(3);
    expect(result.current.bulkSummary.pending).toBe(0);
  });

  it("should reject all pending cards", () => {
    // Arrange
    const { result } = renderHook(() => useCardReviews());

    act(() => {
      result.current.initializeReviews(mockCards);
    });

    // Act
    act(() => {
      result.current.rejectAll();
    });

    // Assert
    expect(result.current.cardReviews.every((r) => r.action === "reject")).toBe(true);
    expect(result.current.bulkSummary.rejected).toBe(3);
    expect(result.current.bulkSummary.pending).toBe(0);
  });

  it("should not change already reviewed cards when accepting all", () => {
    // Arrange
    const { result } = renderHook(() => useCardReviews());

    act(() => {
      result.current.initializeReviews(mockCards);
      result.current.rejectCard(0);
    });

    // Act
    act(() => {
      result.current.acceptAll();
    });

    // Assert
    expect(result.current.cardReviews[0].action).toBe("reject"); // Should remain rejected
    expect(result.current.cardReviews[1].action).toBe("accept");
    expect(result.current.cardReviews[2].action).toBe("accept");
  });

  it("should edit a card", () => {
    // Arrange
    const { result } = renderHook(() => useCardReviews());

    act(() => {
      result.current.initializeReviews(mockCards);
    });

    // Act
    act(() => {
      result.current.editCard(0, "Edited Question", "Edited Answer");
    });

    // Assert
    expect(result.current.cardReviews[0].action).toBe("edit");
    expect(result.current.cardReviews[0].editedCard).toEqual({
      index: 0,
      front_text: "Edited Question",
      back_text: "Edited Answer",
    });
  });

  it("should clear edited card when accepting after edit", () => {
    // Arrange
    const { result } = renderHook(() => useCardReviews());

    act(() => {
      result.current.initializeReviews(mockCards);
      result.current.editCard(0, "Edited Question", "Edited Answer");
    });

    // Act
    act(() => {
      result.current.acceptCard(0);
    });

    // Assert
    expect(result.current.cardReviews[0].action).toBe("accept");
    expect(result.current.cardReviews[0].editedCard).toBeUndefined();
  });

  it("should calculate bulk summary correctly", () => {
    // Arrange
    const { result } = renderHook(() => useCardReviews());

    act(() => {
      result.current.initializeReviews(mockCards);
    });

    // Act
    act(() => {
      result.current.acceptCard(0);
      result.current.rejectCard(1);
      result.current.editCard(2, "Edited", "Answer");
    });

    // Assert
    expect(result.current.bulkSummary).toEqual({
      total: 3,
      accepted: 1,
      rejected: 1,
      edited: 1,
      pending: 0,
    });
  });

  it("should reset card reviews", () => {
    // Arrange
    const { result } = renderHook(() => useCardReviews());

    act(() => {
      result.current.initializeReviews(mockCards);
      result.current.acceptCard(0);
    });

    expect(result.current.cardReviews).toHaveLength(3);

    // Act
    act(() => {
      result.current.reset();
    });

    // Assert
    expect(result.current.cardReviews).toEqual([]);
    expect(result.current.bulkSummary).toEqual({
      total: 0,
      accepted: 0,
      rejected: 0,
      edited: 0,
      pending: 0,
    });
  });
});
