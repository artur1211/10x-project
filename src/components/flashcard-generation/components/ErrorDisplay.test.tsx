import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ErrorDisplay } from "./ErrorDisplay";
import type { ApiError } from "../types";

describe("ErrorDisplay", () => {
  describe("error configuration - title mapping", () => {
    it('should show "Generation Limit Reached" for Too Many Requests', () => {
      // Arrange
      const error: ApiError = {
        error: "Too Many Requests",
        message: "You have reached your daily generation limit",
      };

      // Act
      render(<ErrorDisplay error={error} />);

      // Assert
      expect(screen.getByText("Generation Limit Reached")).toBeInTheDocument();
    });

    it('should show "Service Temporarily Unavailable" for Service Unavailable', () => {
      // Arrange
      const error: ApiError = {
        error: "Service Unavailable",
        message: "The AI service is currently unavailable",
      };

      // Act
      render(<ErrorDisplay error={error} />);

      // Assert
      expect(screen.getByText("Service Temporarily Unavailable")).toBeInTheDocument();
    });

    it('should show "Flashcard Limit Exceeded" for FLASHCARD_LIMIT_EXCEEDED', () => {
      // Arrange
      const error: ApiError = {
        error: "FLASHCARD_LIMIT_EXCEEDED",
        message: "You have reached the maximum number of flashcards",
        current_count: 500,
        limit: 500,
      };

      // Act
      render(<ErrorDisplay error={error} />);

      // Assert
      expect(screen.getByText("Flashcard Limit Exceeded")).toBeInTheDocument();
    });

    it('should show "Batch Not Found" for BATCH_NOT_FOUND', () => {
      // Arrange
      const error: ApiError = {
        error: "BATCH_NOT_FOUND",
        message: "The generation batch was not found",
      };

      // Act
      render(<ErrorDisplay error={error} />);

      // Assert
      expect(screen.getByText("Batch Not Found")).toBeInTheDocument();
    });

    it('should show "Already Processed" for BATCH_ALREADY_REVIEWED', () => {
      // Arrange
      const error: ApiError = {
        error: "BATCH_ALREADY_REVIEWED",
        message: "This batch has already been reviewed",
      };

      // Act
      render(<ErrorDisplay error={error} />);

      // Assert
      expect(screen.getByText("Already Processed")).toBeInTheDocument();
    });

    it('should show "Validation Error" for VALIDATION_ERROR', () => {
      // Arrange
      const error: ApiError = {
        error: "VALIDATION_ERROR",
        message: "Input validation failed",
      };

      // Act
      render(<ErrorDisplay error={error} />);

      // Assert
      expect(screen.getByText("Validation Error")).toBeInTheDocument();
    });

    it('should show "Validation Error" for Bad Request', () => {
      // Arrange
      const error: ApiError = {
        error: "Bad Request",
        message: "Invalid request parameters",
      };

      // Act
      render(<ErrorDisplay error={error} />);

      // Assert
      expect(screen.getByText("Validation Error")).toBeInTheDocument();
    });

    it('should show "Error" for unknown error types', () => {
      // Arrange
      const error: ApiError = {
        error: "UNKNOWN_ERROR",
        message: "Something went wrong",
      };

      // Act
      render(<ErrorDisplay error={error} />);

      // Assert
      expect(screen.getByText("Error")).toBeInTheDocument();
    });
  });

  describe("error message display", () => {
    it("should display the error message", () => {
      // Arrange
      const error: ApiError = {
        error: "Service Unavailable",
        message: "The service is temporarily down for maintenance",
      };

      // Act
      render(<ErrorDisplay error={error} />);

      // Assert
      expect(screen.getByText("The service is temporarily down for maintenance")).toBeInTheDocument();
    });
  });

  describe("validation details display", () => {
    it("should display validation details when present", () => {
      // Arrange
      const error: ApiError = {
        error: "VALIDATION_ERROR",
        message: "Input validation failed",
        details: [
          {
            field: "input_text",
            message: "Text must be at least 1000 characters",
            received_length: 500,
          },
          {
            field: "format",
            message: "Invalid format",
          },
        ],
      };

      // Act
      render(<ErrorDisplay error={error} />);

      // Assert
      expect(screen.getByText("Issues found:")).toBeInTheDocument();
      expect(screen.getByText(/input_text: Text must be at least 1000 characters/)).toBeInTheDocument();
      expect(screen.getByText(/\(500 characters\)/)).toBeInTheDocument();
      expect(screen.getByText(/format: Invalid format/)).toBeInTheDocument();
    });

    it("should not display validation details section when details is empty", () => {
      // Arrange
      const error: ApiError = {
        error: "VALIDATION_ERROR",
        message: "Input validation failed",
        details: [],
      };

      // Act
      render(<ErrorDisplay error={error} />);

      // Assert
      expect(screen.queryByText("Issues found:")).not.toBeInTheDocument();
    });

    it("should not display validation details section when details is undefined", () => {
      // Arrange
      const error: ApiError = {
        error: "VALIDATION_ERROR",
        message: "Input validation failed",
      };

      // Act
      render(<ErrorDisplay error={error} />);

      // Assert
      expect(screen.queryByText("Issues found:")).not.toBeInTheDocument();
    });

    it("should handle detail without received_length", () => {
      // Arrange
      const error: ApiError = {
        error: "VALIDATION_ERROR",
        message: "Validation failed",
        details: [
          {
            field: "email",
            message: "Invalid email format",
          },
        ],
      };

      // Act
      render(<ErrorDisplay error={error} />);

      // Assert
      expect(screen.getByText(/email: Invalid email format/)).toBeInTheDocument();
      expect(screen.queryByText(/characters/)).not.toBeInTheDocument();
    });
  });

  describe("limit information display", () => {
    it("should display limit information when both current_count and limit are present", () => {
      // Arrange
      const error: ApiError = {
        error: "FLASHCARD_LIMIT_EXCEEDED",
        message: "Limit exceeded",
        current_count: 450,
        limit: 500,
      };

      // Act
      render(<ErrorDisplay error={error} />);

      // Assert
      expect(screen.getByText("Current flashcards: 450 / 500")).toBeInTheDocument();
    });

    it("should display suggestion when present with limit info", () => {
      // Arrange
      const error: ApiError = {
        error: "FLASHCARD_LIMIT_EXCEEDED",
        message: "Limit exceeded",
        current_count: 500,
        limit: 500,
        suggestion: "Delete some flashcards to create new ones",
      };

      // Act
      render(<ErrorDisplay error={error} />);

      // Assert
      expect(screen.getByText("Delete some flashcards to create new ones")).toBeInTheDocument();
    });

    it("should not display limit information when current_count is missing", () => {
      // Arrange
      const error: ApiError = {
        error: "FLASHCARD_LIMIT_EXCEEDED",
        message: "Limit exceeded",
        limit: 500,
      };

      // Act
      render(<ErrorDisplay error={error} />);

      // Assert
      expect(screen.queryByText(/Current flashcards:/)).not.toBeInTheDocument();
    });

    it("should not display limit information when limit is missing", () => {
      // Arrange
      const error: ApiError = {
        error: "FLASHCARD_LIMIT_EXCEEDED",
        message: "Limit exceeded",
        current_count: 450,
      };

      // Act
      render(<ErrorDisplay error={error} />);

      // Assert
      expect(screen.queryByText(/Current flashcards:/)).not.toBeInTheDocument();
    });
  });

  describe("action buttons - Too Many Requests", () => {
    it("should show Create Manually button for Too Many Requests", () => {
      // Arrange
      const error: ApiError = {
        error: "Too Many Requests",
        message: "Rate limit exceeded",
      };

      // Act
      render(<ErrorDisplay error={error} />);

      // Assert
      expect(screen.getByRole("button", { name: /create manually/i })).toBeInTheDocument();
    });

    it("should NOT show Retry button for Too Many Requests", () => {
      // Arrange
      const error: ApiError = {
        error: "Too Many Requests",
        message: "Rate limit exceeded",
      };

      // Act
      render(<ErrorDisplay error={error} />);

      // Assert
      expect(screen.queryByRole("button", { name: /retry/i })).not.toBeInTheDocument();
    });

    it("should navigate to create page when Create Manually is clicked", async () => {
      // Arrange
      const user = userEvent.setup();
      const error: ApiError = {
        error: "Too Many Requests",
        message: "Rate limit exceeded",
      };
      delete (window as { location?: unknown }).location;
      (window as { location: { href: string } }).location = { href: "" };

      // Act
      render(<ErrorDisplay error={error} />);
      const button = screen.getByRole("button", { name: /create manually/i });
      await user.click(button);

      // Assert
      expect(window.location.href).toBe("/flashcards/create");
    });
  });

  describe("action buttons - Service Unavailable", () => {
    it("should show Retry button for Service Unavailable", () => {
      // Arrange
      const error: ApiError = {
        error: "Service Unavailable",
        message: "Service down",
      };
      const onRetry = vi.fn();

      // Act
      render(<ErrorDisplay error={error} onRetry={onRetry} />);

      // Assert
      expect(screen.getByRole("button", { name: /retry/i })).toBeInTheDocument();
    });

    it("should call onRetry when Retry button is clicked", async () => {
      // Arrange
      const user = userEvent.setup();
      const error: ApiError = {
        error: "Service Unavailable",
        message: "Service down",
      };
      const onRetry = vi.fn();

      // Act
      render(<ErrorDisplay error={error} onRetry={onRetry} />);
      const button = screen.getByRole("button", { name: /retry/i });
      await user.click(button);

      // Assert
      expect(onRetry).toHaveBeenCalledTimes(1);
    });

    it("should NOT show Retry button when onRetry is not provided", () => {
      // Arrange
      const error: ApiError = {
        error: "Service Unavailable",
        message: "Service down",
      };

      // Act
      render(<ErrorDisplay error={error} />);

      // Assert
      expect(screen.queryByRole("button", { name: /retry/i })).not.toBeInTheDocument();
    });
  });

  describe("action buttons - FLASHCARD_LIMIT_EXCEEDED", () => {
    it("should show Manage Flashcards button for FLASHCARD_LIMIT_EXCEEDED", () => {
      // Arrange
      const error: ApiError = {
        error: "FLASHCARD_LIMIT_EXCEEDED",
        message: "Limit exceeded",
        current_count: 500,
        limit: 500,
      };

      // Act
      render(<ErrorDisplay error={error} />);

      // Assert
      expect(screen.getByRole("button", { name: /manage flashcards/i })).toBeInTheDocument();
    });

    it("should navigate to flashcards page when Manage Flashcards is clicked", async () => {
      // Arrange
      const user = userEvent.setup();
      const error: ApiError = {
        error: "FLASHCARD_LIMIT_EXCEEDED",
        message: "Limit exceeded",
      };
      delete (window as { location?: unknown }).location;
      (window as { location: { href: string } }).location = { href: "" };

      // Act
      render(<ErrorDisplay error={error} />);
      const button = screen.getByRole("button", { name: /manage flashcards/i });
      await user.click(button);

      // Assert
      expect(window.location.href).toBe("/flashcards");
    });
  });

  describe("action buttons - BATCH_ALREADY_REVIEWED", () => {
    it("should show View Flashcards button for BATCH_ALREADY_REVIEWED", () => {
      // Arrange
      const error: ApiError = {
        error: "BATCH_ALREADY_REVIEWED",
        message: "Already reviewed",
      };

      // Act
      render(<ErrorDisplay error={error} />);

      // Assert
      expect(screen.getByRole("button", { name: /view flashcards/i })).toBeInTheDocument();
    });

    it("should navigate to flashcards page when View Flashcards is clicked", async () => {
      // Arrange
      const user = userEvent.setup();
      const error: ApiError = {
        error: "BATCH_ALREADY_REVIEWED",
        message: "Already reviewed",
      };
      delete (window as { location?: unknown }).location;
      (window as { location: { href: string } }).location = { href: "" };

      // Act
      render(<ErrorDisplay error={error} />);
      const button = screen.getByRole("button", { name: /view flashcards/i });
      await user.click(button);

      // Assert
      expect(window.location.href).toBe("/flashcards");
    });
  });

  describe("action buttons - VALIDATION_ERROR", () => {
    it("should NOT show Retry button for VALIDATION_ERROR", () => {
      // Arrange
      const error: ApiError = {
        error: "VALIDATION_ERROR",
        message: "Validation failed",
      };
      const onRetry = vi.fn();

      // Act
      render(<ErrorDisplay error={error} onRetry={onRetry} />);

      // Assert
      expect(screen.queryByRole("button", { name: /retry/i })).not.toBeInTheDocument();
    });

    it("should NOT show Create Manually button for VALIDATION_ERROR", () => {
      // Arrange
      const error: ApiError = {
        error: "VALIDATION_ERROR",
        message: "Validation failed",
      };

      // Act
      render(<ErrorDisplay error={error} />);

      // Assert
      expect(screen.queryByRole("button", { name: /create manually/i })).not.toBeInTheDocument();
    });
  });

  describe("action buttons - BATCH_NOT_FOUND", () => {
    it("should NOT show any action buttons for BATCH_NOT_FOUND", () => {
      // Arrange
      const error: ApiError = {
        error: "BATCH_NOT_FOUND",
        message: "Batch not found",
      };

      // Act
      render(<ErrorDisplay error={error} />);

      // Assert
      expect(screen.queryByRole("button", { name: /retry/i })).not.toBeInTheDocument();
      expect(screen.queryByRole("button", { name: /create manually/i })).not.toBeInTheDocument();
      expect(screen.queryByRole("button", { name: /manage flashcards/i })).not.toBeInTheDocument();
      expect(screen.queryByRole("button", { name: /view flashcards/i })).not.toBeInTheDocument();
    });
  });

  describe("action buttons - unknown error", () => {
    it("should show Retry button for unknown error types", () => {
      // Arrange
      const error: ApiError = {
        error: "UNKNOWN_ERROR",
        message: "Something went wrong",
      };
      const onRetry = vi.fn();

      // Act
      render(<ErrorDisplay error={error} onRetry={onRetry} />);

      // Assert
      expect(screen.getByRole("button", { name: /retry/i })).toBeInTheDocument();
    });
  });

  describe("dismiss button", () => {
    it("should show Dismiss button when onDismiss is provided", () => {
      // Arrange
      const error: ApiError = {
        error: "Service Unavailable",
        message: "Service down",
      };
      const onDismiss = vi.fn();

      // Act
      render(<ErrorDisplay error={error} onDismiss={onDismiss} />);

      // Assert
      expect(screen.getByRole("button", { name: /dismiss/i })).toBeInTheDocument();
    });

    it("should call onDismiss when Dismiss button is clicked", async () => {
      // Arrange
      const user = userEvent.setup();
      const error: ApiError = {
        error: "Service Unavailable",
        message: "Service down",
      };
      const onDismiss = vi.fn();

      // Act
      render(<ErrorDisplay error={error} onDismiss={onDismiss} />);
      const button = screen.getByRole("button", { name: /dismiss/i });
      await user.click(button);

      // Assert
      expect(onDismiss).toHaveBeenCalledTimes(1);
    });

    it("should NOT show Dismiss button when onDismiss is not provided", () => {
      // Arrange
      const error: ApiError = {
        error: "Service Unavailable",
        message: "Service down",
      };

      // Act
      render(<ErrorDisplay error={error} />);

      // Assert
      expect(screen.queryByRole("button", { name: /dismiss/i })).not.toBeInTheDocument();
    });
  });

  describe("multiple action buttons", () => {
    it("should show both Retry and Dismiss buttons together", () => {
      // Arrange
      const error: ApiError = {
        error: "Service Unavailable",
        message: "Service down",
      };
      const onRetry = vi.fn();
      const onDismiss = vi.fn();

      // Act
      render(<ErrorDisplay error={error} onRetry={onRetry} onDismiss={onDismiss} />);

      // Assert
      expect(screen.getByRole("button", { name: /retry/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /dismiss/i })).toBeInTheDocument();
    });

    it("should show Create Manually and Dismiss buttons for Too Many Requests", () => {
      // Arrange
      const error: ApiError = {
        error: "Too Many Requests",
        message: "Rate limit exceeded",
      };
      const onDismiss = vi.fn();

      // Act
      render(<ErrorDisplay error={error} onDismiss={onDismiss} />);

      // Assert
      expect(screen.getByRole("button", { name: /create manually/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /dismiss/i })).toBeInTheDocument();
    });
  });

  describe("edge cases", () => {
    it("should handle error with all optional fields", () => {
      // Arrange
      const error: ApiError = {
        error: "VALIDATION_ERROR",
        message: "Validation failed",
        details: [{ field: "input", message: "Invalid" }],
        current_count: 100,
        limit: 500,
        suggestion: "Fix the input",
      };

      // Act
      render(<ErrorDisplay error={error} />);

      // Assert
      expect(screen.getByText("Validation Error")).toBeInTheDocument();
      expect(screen.getByText("Validation failed")).toBeInTheDocument();
      expect(screen.getByText(/input: Invalid/)).toBeInTheDocument();
      expect(screen.getByText("Current flashcards: 100 / 500")).toBeInTheDocument();
      expect(screen.getByText("Fix the input")).toBeInTheDocument();
    });

    it("should handle error with minimal fields", () => {
      // Arrange
      const error: ApiError = {
        error: "Error",
        message: "Something failed",
      };

      // Act
      render(<ErrorDisplay error={error} />);

      // Assert
      expect(screen.getByText("Error")).toBeInTheDocument();
      expect(screen.getByText("Something failed")).toBeInTheDocument();
    });
  });
});
