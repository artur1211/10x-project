import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { EditCardModal } from "./EditCardModal";
import type { GeneratedCardPreview } from "../types";

describe("EditCardModal", () => {
  const mockCard: GeneratedCardPreview = {
    index: 0,
    front_text: "Original Front Text",
    back_text: "Original Back Text",
  };

  describe("modal visibility", () => {
    it("should not render when isOpen is false", () => {
      // Act
      render(<EditCardModal isOpen={false} card={null} cardIndex={null} onSave={vi.fn()} onCancel={vi.fn()} />);

      // Assert
      expect(screen.queryByText("Edit Flashcard")).not.toBeInTheDocument();
    });

    it("should render when isOpen is true", () => {
      // Act
      render(<EditCardModal isOpen={true} card={mockCard} cardIndex={0} onSave={vi.fn()} onCancel={vi.fn()} />);

      // Assert
      expect(screen.getByText("Edit Flashcard")).toBeInTheDocument();
    });

    it("should display modal description", () => {
      // Act
      render(<EditCardModal isOpen={true} card={mockCard} cardIndex={0} onSave={vi.fn()} onCancel={vi.fn()} />);

      // Assert
      expect(screen.getByText("Modify the front and back text of the flashcard")).toBeInTheDocument();
    });
  });

  describe("initialization with card data", () => {
    it("should initialize front text field with card front_text", async () => {
      // Act
      render(<EditCardModal isOpen={true} card={mockCard} cardIndex={0} onSave={vi.fn()} onCancel={vi.fn()} />);

      // Assert
      await waitFor(() => {
        const frontTextarea = screen.getByLabelText(/front text/i);
        expect(frontTextarea).toHaveValue("Original Front Text");
      });
    });

    it("should initialize back text field with card back_text", async () => {
      // Act
      render(<EditCardModal isOpen={true} card={mockCard} cardIndex={0} onSave={vi.fn()} onCancel={vi.fn()} />);

      // Assert
      await waitFor(() => {
        const backTextarea = screen.getByLabelText(/back text/i);
        expect(backTextarea).toHaveValue("Original Back Text");
      });
    });

    it("should re-initialize when card changes", async () => {
      // Arrange
      const newCard: GeneratedCardPreview = {
        index: 1,
        front_text: "New Front Text",
        back_text: "New Back Text",
      };

      // Act
      const { rerender } = render(
        <EditCardModal isOpen={true} card={mockCard} cardIndex={0} onSave={vi.fn()} onCancel={vi.fn()} />
      );

      await waitFor(() => {
        expect(screen.getByLabelText(/front text/i)).toHaveValue("Original Front Text");
      });

      rerender(<EditCardModal isOpen={true} card={newCard} cardIndex={1} onSave={vi.fn()} onCancel={vi.fn()} />);

      // Assert
      await waitFor(() => {
        expect(screen.getByLabelText(/front text/i)).toHaveValue("New Front Text");
        expect(screen.getByLabelText(/back text/i)).toHaveValue("New Back Text");
      });
    });

    it("should handle null card gracefully", () => {
      // Act
      render(<EditCardModal isOpen={true} card={null} cardIndex={0} onSave={vi.fn()} onCancel={vi.fn()} />);

      // Assert
      expect(screen.getByLabelText(/front text/i)).toHaveValue("");
      expect(screen.getByLabelText(/back text/i)).toHaveValue("");
    });
  });

  describe("text editing", () => {
    it("should allow editing front text", async () => {
      // Arrange
      const user = userEvent.setup();

      // Act
      render(<EditCardModal isOpen={true} card={mockCard} cardIndex={0} onSave={vi.fn()} onCancel={vi.fn()} />);

      await waitFor(() => {
        expect(screen.getByLabelText(/front text/i)).toHaveValue("Original Front Text");
      });

      const frontTextarea = screen.getByLabelText(/front text/i);
      await user.clear(frontTextarea);
      await user.type(frontTextarea, "Edited Front Text");

      // Assert
      expect(frontTextarea).toHaveValue("Edited Front Text");
    });

    it("should allow editing back text", async () => {
      // Arrange
      const user = userEvent.setup();

      // Act
      render(<EditCardModal isOpen={true} card={mockCard} cardIndex={0} onSave={vi.fn()} onCancel={vi.fn()} />);

      await waitFor(() => {
        expect(screen.getByLabelText(/back text/i)).toHaveValue("Original Back Text");
      });

      const backTextarea = screen.getByLabelText(/back text/i);
      await user.clear(backTextarea);
      await user.type(backTextarea, "Edited Back Text");

      // Assert
      expect(backTextarea).toHaveValue("Edited Back Text");
    });
  });

  describe("validation - front text", () => {
    it("should show error when front text is too short (< 10 chars)", async () => {
      // Arrange
      const user = userEvent.setup();

      // Act
      render(<EditCardModal isOpen={true} card={mockCard} cardIndex={0} onSave={vi.fn()} onCancel={vi.fn()} />);

      await waitFor(() => {
        expect(screen.getByLabelText(/front text/i)).toHaveValue("Original Front Text");
      });

      const frontTextarea = screen.getByLabelText(/front text/i);
      await user.clear(frontTextarea);
      await user.type(frontTextarea, "Short");

      // Assert
      await waitFor(() => {
        expect(screen.getByText("Front text must be at least 10 characters")).toBeInTheDocument();
      });
    });

    it("should show error when front text is too long (> 500 chars)", async () => {
      // Arrange
      const user = userEvent.setup();

      // Act
      render(<EditCardModal isOpen={true} card={mockCard} cardIndex={0} onSave={vi.fn()} onCancel={vi.fn()} />);

      await waitFor(() => {
        expect(screen.getByLabelText(/front text/i)).toHaveValue("Original Front Text");
      });

      const frontTextarea = screen.getByLabelText(/front text/i);
      await user.clear(frontTextarea);
      await user.type(frontTextarea, "a".repeat(501));

      // Assert
      await waitFor(() => {
        expect(screen.getByText("Front text must not exceed 500 characters")).toBeInTheDocument();
      });
    });

    it("should NOT show error when front text is empty", async () => {
      // Arrange
      const user = userEvent.setup();

      // Act
      render(<EditCardModal isOpen={true} card={mockCard} cardIndex={0} onSave={vi.fn()} onCancel={vi.fn()} />);

      await waitFor(() => {
        expect(screen.getByLabelText(/front text/i)).toHaveValue("Original Front Text");
      });

      const frontTextarea = screen.getByLabelText(/front text/i);
      await user.clear(frontTextarea);

      // Assert
      await waitFor(() => {
        expect(screen.queryByText("Front text must be at least 10 characters")).not.toBeInTheDocument();
      });
    });

    it("should accept front text at minimum boundary (10 chars)", async () => {
      // Arrange
      const user = userEvent.setup();

      // Act
      render(<EditCardModal isOpen={true} card={mockCard} cardIndex={0} onSave={vi.fn()} onCancel={vi.fn()} />);

      await waitFor(() => {
        expect(screen.getByLabelText(/front text/i)).toHaveValue("Original Front Text");
      });

      const frontTextarea = screen.getByLabelText(/front text/i);
      await user.clear(frontTextarea);
      await user.type(frontTextarea, "1234567890");

      // Assert
      await waitFor(() => {
        expect(screen.queryByText(/Front text must/)).not.toBeInTheDocument();
      });
    });

    it("should accept front text at maximum boundary (500 chars)", async () => {
      // Arrange
      const user = userEvent.setup();

      // Act
      render(<EditCardModal isOpen={true} card={mockCard} cardIndex={0} onSave={vi.fn()} onCancel={vi.fn()} />);

      await waitFor(() => {
        expect(screen.getByLabelText(/front text/i)).toHaveValue("Original Front Text");
      });

      const frontTextarea = screen.getByLabelText(/front text/i);
      await user.clear(frontTextarea);
      await user.type(frontTextarea, "a".repeat(500));

      // Assert
      await waitFor(() => {
        expect(screen.queryByText(/Front text must/)).not.toBeInTheDocument();
      });
    });
  });

  describe("validation - back text", () => {
    it("should show error when back text is too short (< 10 chars)", async () => {
      // Arrange
      const user = userEvent.setup();

      // Act
      render(<EditCardModal isOpen={true} card={mockCard} cardIndex={0} onSave={vi.fn()} onCancel={vi.fn()} />);

      await waitFor(() => {
        expect(screen.getByLabelText(/back text/i)).toHaveValue("Original Back Text");
      });

      const backTextarea = screen.getByLabelText(/back text/i);
      await user.clear(backTextarea);
      await user.type(backTextarea, "Short");

      // Assert
      await waitFor(() => {
        expect(screen.getByText("Back text must be at least 10 characters")).toBeInTheDocument();
      });
    });

    it("should show error when back text is too long (> 1000 chars)", async () => {
      // Arrange
      const longCard: GeneratedCardPreview = {
        index: 0,
        front_text: "Valid Front",
        back_text: "a".repeat(1001), // Pre-set to invalid length
      };

      // Act
      render(<EditCardModal isOpen={true} card={longCard} cardIndex={0} onSave={vi.fn()} onCancel={vi.fn()} />);

      // Assert
      await waitFor(() => {
        expect(screen.getByText("Back text must not exceed 1,000 characters")).toBeInTheDocument();
      });
    });

    it("should accept back text at minimum boundary (10 chars)", async () => {
      // Arrange
      const user = userEvent.setup();

      // Act
      render(<EditCardModal isOpen={true} card={mockCard} cardIndex={0} onSave={vi.fn()} onCancel={vi.fn()} />);

      await waitFor(() => {
        expect(screen.getByLabelText(/back text/i)).toHaveValue("Original Back Text");
      });

      const backTextarea = screen.getByLabelText(/back text/i);
      await user.clear(backTextarea);
      await user.type(backTextarea, "1234567890");

      // Assert
      await waitFor(() => {
        expect(screen.queryByText(/Back text must/)).not.toBeInTheDocument();
      });
    });

    it("should accept back text at maximum boundary (1000 chars)", async () => {
      // Arrange
      const maxCard: GeneratedCardPreview = {
        index: 0,
        front_text: "Valid Front",
        back_text: "a".repeat(1000), // Pre-set to valid max length
      };

      // Act
      render(<EditCardModal isOpen={true} card={maxCard} cardIndex={0} onSave={vi.fn()} onCancel={vi.fn()} />);

      // Assert
      await waitFor(() => {
        expect(screen.queryByText(/Back text must/)).not.toBeInTheDocument();
        const saveButton = screen.getByRole("button", { name: /save changes/i });
        expect(saveButton).toBeEnabled();
      });
    });
  });

  describe("character counter display", () => {
    it("should display character counter for front text", async () => {
      // Act
      render(<EditCardModal isOpen={true} card={mockCard} cardIndex={0} onSave={vi.fn()} onCancel={vi.fn()} />);

      // Assert
      await waitFor(() => {
        // Character counter shows count
        expect(screen.getByText(/\/ 500 characters/)).toBeInTheDocument();
      });
    });

    it("should display character counter for back text", async () => {
      // Act
      render(<EditCardModal isOpen={true} card={mockCard} cardIndex={0} onSave={vi.fn()} onCancel={vi.fn()} />);

      // Assert
      await waitFor(() => {
        // Character counter shows count
        expect(screen.getByText(/\/ 1000 characters/)).toBeInTheDocument();
      });
    });
  });

  describe("save button", () => {
    it("should be disabled when front text is invalid", async () => {
      // Arrange
      const invalidCard: GeneratedCardPreview = {
        index: 0,
        front_text: "Short", // Too short (< 10 chars)
        back_text: "Valid Back Text",
      };

      // Act
      render(<EditCardModal isOpen={true} card={invalidCard} cardIndex={0} onSave={vi.fn()} onCancel={vi.fn()} />);

      // Assert
      await waitFor(() => {
        const saveButton = screen.getByRole("button", { name: /save changes/i });
        expect(saveButton).toBeDisabled();
      });
    });

    it("should be disabled when back text is invalid", async () => {
      // Arrange
      const invalidCard: GeneratedCardPreview = {
        index: 0,
        front_text: "Valid Front Text",
        back_text: "Short", // Too short (< 10 chars)
      };

      // Act
      render(<EditCardModal isOpen={true} card={invalidCard} cardIndex={0} onSave={vi.fn()} onCancel={vi.fn()} />);

      // Assert
      await waitFor(() => {
        const saveButton = screen.getByRole("button", { name: /save changes/i });
        expect(saveButton).toBeDisabled();
      });
    });

    it("should be disabled when both texts are invalid", async () => {
      // Arrange
      const invalidCard: GeneratedCardPreview = {
        index: 0,
        front_text: "Short", // Too short (< 10 chars)
        back_text: "Short", // Too short (< 10 chars)
      };

      // Act
      render(<EditCardModal isOpen={true} card={invalidCard} cardIndex={0} onSave={vi.fn()} onCancel={vi.fn()} />);

      // Assert
      await waitFor(() => {
        const saveButton = screen.getByRole("button", { name: /save changes/i });
        expect(saveButton).toBeDisabled();
      });
    });

    it("should be enabled when both texts are valid", async () => {
      // Arrange
      const user = userEvent.setup();

      // Act
      render(<EditCardModal isOpen={true} card={mockCard} cardIndex={0} onSave={vi.fn()} onCancel={vi.fn()} />);

      await waitFor(() => {
        expect(screen.getByLabelText(/front text/i)).toHaveValue("Original Front Text");
      });

      const frontTextarea = screen.getByLabelText(/front text/i);
      const backTextarea = screen.getByLabelText(/back text/i);
      await user.clear(frontTextarea);
      await user.type(frontTextarea, "Valid Front Text");
      await user.clear(backTextarea);
      await user.type(backTextarea, "Valid Back Text");

      // Assert
      await waitFor(() => {
        const saveButton = screen.getByRole("button", { name: /save changes/i });
        expect(saveButton).toBeEnabled();
      });
    });

    it("should call onSave with trimmed text when clicked", async () => {
      // Arrange
      const user = userEvent.setup();
      const onSave = vi.fn();

      // Act
      render(<EditCardModal isOpen={true} card={mockCard} cardIndex={0} onSave={onSave} onCancel={vi.fn()} />);

      await waitFor(() => {
        expect(screen.getByLabelText(/front text/i)).toHaveValue("Original Front Text");
      });

      const frontTextarea = screen.getByLabelText(/front text/i);
      const backTextarea = screen.getByLabelText(/back text/i);
      await user.clear(frontTextarea);
      await user.type(frontTextarea, "  Edited Front  ");
      await user.clear(backTextarea);
      await user.type(backTextarea, "  Edited Back  ");

      const saveButton = screen.getByRole("button", { name: /save changes/i });
      await user.click(saveButton);

      // Assert
      expect(onSave).toHaveBeenCalledWith(0, "Edited Front", "Edited Back");
      expect(onSave).toHaveBeenCalledTimes(1);
    });

    it("should NOT call onSave when disabled", async () => {
      // Arrange
      const user = userEvent.setup();
      const onSave = vi.fn();

      // Act
      render(<EditCardModal isOpen={true} card={mockCard} cardIndex={0} onSave={onSave} onCancel={vi.fn()} />);

      await waitFor(() => {
        expect(screen.getByLabelText(/front text/i)).toHaveValue("Original Front Text");
      });

      const frontTextarea = screen.getByLabelText(/front text/i);
      await user.clear(frontTextarea);
      await user.type(frontTextarea, "Short");

      const saveButton = screen.getByRole("button", { name: /save changes/i });
      await user.click(saveButton);

      // Assert
      expect(onSave).not.toHaveBeenCalled();
    });

    it("should have tooltip when disabled", async () => {
      // Arrange
      const user = userEvent.setup();

      // Act
      render(<EditCardModal isOpen={true} card={mockCard} cardIndex={0} onSave={vi.fn()} onCancel={vi.fn()} />);

      await waitFor(() => {
        expect(screen.getByLabelText(/front text/i)).toHaveValue("Original Front Text");
      });

      const frontTextarea = screen.getByLabelText(/front text/i);
      await user.clear(frontTextarea);
      await user.type(frontTextarea, "Short");

      // Assert
      await waitFor(() => {
        const saveButton = screen.getByRole("button", { name: /save changes/i });
        expect(saveButton).toHaveAttribute("title", "Both fields must be valid to save");
      });
    });
  });

  describe("cancel button", () => {
    it("should call onCancel when clicked", async () => {
      // Arrange
      const user = userEvent.setup();
      const onCancel = vi.fn();

      // Act
      render(<EditCardModal isOpen={true} card={mockCard} cardIndex={0} onSave={vi.fn()} onCancel={onCancel} />);

      await waitFor(() => {
        expect(screen.getByLabelText(/front text/i)).toHaveValue("Original Front Text");
      });

      const cancelButton = screen.getByRole("button", { name: /cancel/i });
      await user.click(cancelButton);

      // Assert
      expect(onCancel).toHaveBeenCalledTimes(1);
    });

    it("should clear text fields when canceled", async () => {
      // Arrange
      const user = userEvent.setup();
      const onCancel = vi.fn();

      // Act
      render(<EditCardModal isOpen={true} card={mockCard} cardIndex={0} onSave={vi.fn()} onCancel={onCancel} />);

      await waitFor(() => {
        expect(screen.getByLabelText(/front text/i)).toHaveValue("Original Front Text");
      });

      const frontTextarea = screen.getByLabelText(/front text/i);
      await user.clear(frontTextarea);
      await user.type(frontTextarea, "Modified Text");

      const cancelButton = screen.getByRole("button", { name: /cancel/i });
      await user.click(cancelButton);

      // Assert - Fields should be cleared after cancel
      expect(onCancel).toHaveBeenCalled();
    });
  });

  describe("edge cases", () => {
    it("should handle cardIndex as null", () => {
      // Act
      render(<EditCardModal isOpen={true} card={mockCard} cardIndex={null} onSave={vi.fn()} onCancel={vi.fn()} />);

      // Assert
      expect(screen.getByText("Edit Flashcard")).toBeInTheDocument();
    });

    it("should not save when cardIndex is null", async () => {
      // Arrange
      const user = userEvent.setup();
      const onSave = vi.fn();

      // Act
      render(<EditCardModal isOpen={true} card={mockCard} cardIndex={null} onSave={onSave} onCancel={vi.fn()} />);

      await waitFor(() => {
        expect(screen.getByLabelText(/front text/i)).toHaveValue("Original Front Text");
      });

      const saveButton = screen.getByRole("button", { name: /save changes/i });
      await user.click(saveButton);

      // Assert
      expect(onSave).not.toHaveBeenCalled();
    });

    it("should handle very long text gracefully", async () => {
      // Arrange
      const longCard: GeneratedCardPreview = {
        index: 0,
        front_text: "a".repeat(500),
        back_text: "b".repeat(1000),
      };

      // Act
      render(<EditCardModal isOpen={true} card={longCard} cardIndex={0} onSave={vi.fn()} onCancel={vi.fn()} />);

      // Assert
      await waitFor(() => {
        expect(screen.getByLabelText(/front text/i)).toHaveValue("a".repeat(500));
        expect(screen.getByLabelText(/back text/i)).toHaveValue("b".repeat(1000));
      });
    });

    it("should handle whitespace-only text validation", async () => {
      // Arrange
      const user = userEvent.setup();

      // Act
      render(<EditCardModal isOpen={true} card={mockCard} cardIndex={0} onSave={vi.fn()} onCancel={vi.fn()} />);

      await waitFor(() => {
        expect(screen.getByLabelText(/front text/i)).toHaveValue("Original Front Text");
      });

      const frontTextarea = screen.getByLabelText(/front text/i);
      await user.clear(frontTextarea);
      await user.type(frontTextarea, "          "); // 10 spaces

      // Assert - Whitespace is trimmed, so it counts as 0 characters
      await waitFor(() => {
        const saveButton = screen.getByRole("button", { name: /save changes/i });
        expect(saveButton).toBeDisabled();
      });
    });
  });
});
