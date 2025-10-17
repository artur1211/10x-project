import { describe, it, expect } from "vitest";
import { renderHook } from "@testing-library/react";
import { useCharacterCount } from "./useCharacterCount";

describe("useCharacterCount", () => {
  describe("basic functionality", () => {
    it("should return character count state for empty text", () => {
      // Arrange
      const text = "";
      const min = 1000;
      const max = 10000;

      // Act
      const { result } = renderHook(() => useCharacterCount(text, min, max));

      // Assert
      expect(result.current).toEqual({
        current: 0,
        min: 1000,
        max: 10000,
        isValid: false,
        status: "too-short",
      });
    });

    it("should return valid state for text within range", () => {
      // Arrange
      const text = "a".repeat(5000);
      const min = 1000;
      const max = 10000;

      // Act
      const { result } = renderHook(() => useCharacterCount(text, min, max));

      // Assert
      expect(result.current).toEqual({
        current: 5000,
        min: 1000,
        max: 10000,
        isValid: true,
        status: "valid",
      });
    });

    it("should return too-long state for text exceeding maximum", () => {
      // Arrange
      const text = "a".repeat(15000);
      const min = 1000;
      const max = 10000;

      // Act
      const { result } = renderHook(() => useCharacterCount(text, min, max));

      // Assert
      expect(result.current).toEqual({
        current: 15000,
        min: 1000,
        max: 10000,
        isValid: false,
        status: "too-long",
      });
    });
  });

  describe("memoization", () => {
    it("should memoize result for same inputs", () => {
      // Arrange
      const text = "a".repeat(5000);
      const min = 1000;
      const max = 10000;

      // Act
      const { result, rerender } = renderHook(() => useCharacterCount(text, min, max));
      const firstResult = result.current;

      rerender();
      const secondResult = result.current;

      // Assert
      expect(firstResult).toBe(secondResult); // Same reference
    });

    it("should recalculate when text changes", () => {
      // Arrange
      const min = 1000;
      const max = 10000;

      // Act
      const { result, rerender } = renderHook(({ text }) => useCharacterCount(text, min, max), {
        initialProps: { text: "a".repeat(5000) },
      });
      const firstResult = result.current;

      rerender({ text: "a".repeat(6000) });
      const secondResult = result.current;

      // Assert
      expect(firstResult.current).toBe(5000);
      expect(secondResult.current).toBe(6000);
      expect(firstResult).not.toBe(secondResult);
    });

    it("should recalculate when min changes", () => {
      // Arrange
      const text = "a".repeat(5000);
      const max = 10000;

      // Act
      const { result, rerender } = renderHook(({ min }) => useCharacterCount(text, min, max), {
        initialProps: { min: 1000 },
      });
      const firstResult = result.current;

      rerender({ min: 2000 });
      const secondResult = result.current;

      // Assert
      expect(firstResult.min).toBe(1000);
      expect(secondResult.min).toBe(2000);
      expect(firstResult).not.toBe(secondResult);
    });

    it("should recalculate when max changes", () => {
      // Arrange
      const text = "a".repeat(5000);
      const min = 1000;

      // Act
      const { result, rerender } = renderHook(({ max }) => useCharacterCount(text, min, max), {
        initialProps: { max: 10000 },
      });
      const firstResult = result.current;

      rerender({ max: 5500 });
      const secondResult = result.current;

      // Assert
      expect(firstResult.max).toBe(10000);
      expect(secondResult.max).toBe(5500);
      expect(firstResult.status).toBe("valid");
      expect(secondResult.status).toBe("warning"); // Now at 90.9% which triggers warning > 90%
    });

    it("should not recalculate when unrelated props change", () => {
      // Arrange
      const text = "a".repeat(5000);
      const min = 1000;
      const max = 10000;

      // Act
      const { result, rerender } = renderHook(
        ({ text, min, max, unrelated }) => {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const _ = unrelated; // Use the prop
          return useCharacterCount(text, min, max);
        },
        {
          initialProps: { text, min, max, unrelated: "foo" },
        }
      );
      const firstResult = result.current;

      rerender({ text, min, max, unrelated: "bar" });
      const secondResult = result.current;

      // Assert
      expect(firstResult).toBe(secondResult); // Same reference
    });
  });

  describe("boundary conditions", () => {
    it("should handle text at minimum boundary", () => {
      // Arrange
      const text = "a".repeat(1000);
      const min = 1000;
      const max = 10000;

      // Act
      const { result } = renderHook(() => useCharacterCount(text, min, max));

      // Assert
      expect(result.current.current).toBe(1000);
      expect(result.current.isValid).toBe(true);
      expect(result.current.status).toBe("valid");
    });

    it("should handle text at maximum boundary", () => {
      // Arrange
      const text = "a".repeat(10000);
      const min = 1000;
      const max = 10000;

      // Act
      const { result } = renderHook(() => useCharacterCount(text, min, max));

      // Assert
      expect(result.current.current).toBe(10000);
      expect(result.current.isValid).toBe(true);
      expect(result.current.status).toBe("warning"); // At 100% which is > 90%
    });

    it("should handle text one character below minimum", () => {
      // Arrange
      const text = "a".repeat(999);
      const min = 1000;
      const max = 10000;

      // Act
      const { result } = renderHook(() => useCharacterCount(text, min, max));

      // Assert
      expect(result.current.current).toBe(999);
      expect(result.current.isValid).toBe(false);
      expect(result.current.status).toBe("too-short");
    });

    it("should handle text one character above maximum", () => {
      // Arrange
      const text = "a".repeat(10001);
      const min = 1000;
      const max = 10000;

      // Act
      const { result } = renderHook(() => useCharacterCount(text, min, max));

      // Assert
      expect(result.current.current).toBe(10001);
      expect(result.current.isValid).toBe(false);
      expect(result.current.status).toBe("too-long");
    });
  });

  describe("whitespace handling", () => {
    it("should trim leading and trailing whitespace", () => {
      // Arrange
      const text = "   " + "a".repeat(5000) + "   ";
      const min = 1000;
      const max = 10000;

      // Act
      const { result } = renderHook(() => useCharacterCount(text, min, max));

      // Assert
      expect(result.current.current).toBe(5000);
    });

    it("should count internal whitespace", () => {
      // Arrange
      const text = "a".repeat(2500) + " ".repeat(100) + "a".repeat(2500);
      const min = 1000;
      const max = 10000;

      // Act
      const { result } = renderHook(() => useCharacterCount(text, min, max));

      // Assert
      expect(result.current.current).toBe(5100);
    });

    it("should handle text with only whitespace", () => {
      // Arrange
      const text = "     \n\t\r  ";
      const min = 1000;
      const max = 10000;

      // Act
      const { result } = renderHook(() => useCharacterCount(text, min, max));

      // Assert
      expect(result.current.current).toBe(0);
      expect(result.current.status).toBe("too-short");
    });
  });

  describe("warning threshold", () => {
    it("should show warning when approaching limit at 91% of max", () => {
      // Arrange
      const text = "a".repeat(9100); // 91% of 10000
      const min = 1000;
      const max = 10000;

      // Act
      const { result } = renderHook(() => useCharacterCount(text, min, max));

      // Assert
      expect(result.current.status).toBe("warning");
      expect(result.current.isValid).toBe(true);
    });

    it("should not show warning at exactly 90% of max", () => {
      // Arrange
      const text = "a".repeat(9000); // exactly 90% of 10000
      const min = 1000;
      const max = 10000;

      // Act
      const { result } = renderHook(() => useCharacterCount(text, min, max));

      // Assert
      expect(result.current.status).toBe("valid");
      expect(result.current.isValid).toBe(true);
    });

    it("should show warning at 95% of max", () => {
      // Arrange
      const text = "a".repeat(9500); // 95% of 10000
      const min = 1000;
      const max = 10000;

      // Act
      const { result } = renderHook(() => useCharacterCount(text, min, max));

      // Assert
      expect(result.current.status).toBe("warning");
      expect(result.current.isValid).toBe(true);
    });

    it("should show warning threshold works with different max values", () => {
      // Arrange
      const text = "a".repeat(460); // 92% of 500
      const min = 10;
      const max = 500;

      // Act
      const { result } = renderHook(() => useCharacterCount(text, min, max));

      // Assert
      expect(result.current.status).toBe("warning");
      expect(result.current.isValid).toBe(true);
    });
  });

  describe("custom min/max values", () => {
    it("should work with small ranges", () => {
      // Arrange
      const text = "Hello World";
      const min = 10;
      const max = 50;

      // Act
      const { result } = renderHook(() => useCharacterCount(text, min, max));

      // Assert
      expect(result.current.current).toBe(11);
      expect(result.current.isValid).toBe(true);
      expect(result.current.status).toBe("valid");
    });

    it("should work with large ranges", () => {
      // Arrange
      const text = "a".repeat(50000);
      const min = 10000;
      const max = 100000;

      // Act
      const { result } = renderHook(() => useCharacterCount(text, min, max));

      // Assert
      expect(result.current.current).toBe(50000);
      expect(result.current.isValid).toBe(true);
      expect(result.current.status).toBe("valid");
    });

    it("should work with narrow range", () => {
      // Arrange
      const text = "a".repeat(100);
      const min = 100;
      const max = 101;

      // Act
      const { result } = renderHook(() => useCharacterCount(text, min, max));

      // Assert
      expect(result.current.current).toBe(100);
      expect(result.current.isValid).toBe(true);
      expect(result.current.status).toBe("warning"); // At 99% which is > 90%
    });
  });
});
