import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useEditModal } from "./useEditModal";

describe("useEditModal", () => {
  it("should initialize with closed modal", () => {
    // Act
    const { result } = renderHook(() => useEditModal());

    // Assert
    expect(result.current.editModalState).toEqual({
      isOpen: false,
      cardIndex: null,
    });
  });

  it("should open modal with card index", () => {
    // Arrange
    const { result } = renderHook(() => useEditModal());

    // Act
    act(() => {
      result.current.openEditModal(5);
    });

    // Assert
    expect(result.current.editModalState).toEqual({
      isOpen: true,
      cardIndex: 5,
    });
  });

  it("should close modal", () => {
    // Arrange
    const { result } = renderHook(() => useEditModal());

    act(() => {
      result.current.openEditModal(3);
    });

    expect(result.current.editModalState.isOpen).toBe(true);

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

  it("should open modal for different card indices", () => {
    // Arrange
    const { result } = renderHook(() => useEditModal());

    // Act - open for card 0
    act(() => {
      result.current.openEditModal(0);
    });

    expect(result.current.editModalState.cardIndex).toBe(0);

    // Act - open for card 10
    act(() => {
      result.current.openEditModal(10);
    });

    // Assert
    expect(result.current.editModalState).toEqual({
      isOpen: true,
      cardIndex: 10,
    });
  });

  it("should reset modal state", () => {
    // Arrange
    const { result } = renderHook(() => useEditModal());

    act(() => {
      result.current.openEditModal(7);
    });

    expect(result.current.editModalState.isOpen).toBe(true);

    // Act
    act(() => {
      result.current.reset();
    });

    // Assert
    expect(result.current.editModalState).toEqual({
      isOpen: false,
      cardIndex: null,
    });
  });

  it("should handle multiple open/close cycles", () => {
    // Arrange
    const { result } = renderHook(() => useEditModal());

    // Act & Assert - Cycle 1
    act(() => {
      result.current.openEditModal(1);
    });
    expect(result.current.editModalState.isOpen).toBe(true);

    act(() => {
      result.current.closeEditModal();
    });
    expect(result.current.editModalState.isOpen).toBe(false);

    // Act & Assert - Cycle 2
    act(() => {
      result.current.openEditModal(2);
    });
    expect(result.current.editModalState.isOpen).toBe(true);

    act(() => {
      result.current.closeEditModal();
    });
    expect(result.current.editModalState.isOpen).toBe(false);
  });
});
