import React from "react";
import { FlashcardItem } from "./FlashcardItem";
import type { FlashcardListProps } from "../types";

export function FlashcardList({ flashcards, viewMode, onEdit, onDelete, onToggleSelect }: FlashcardListProps) {
  if (flashcards.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground text-lg mb-2">No flashcards found</p>
        <p className="text-sm text-muted-foreground">Create your first flashcard to get started</p>
      </div>
    );
  }

  const containerClass =
    viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" : "flex flex-col gap-3";

  return (
    <div className={containerClass} data-testid="flashcard-list">
      {flashcards.map((flashcard) => (
        <FlashcardItem
          key={flashcard.id}
          flashcard={flashcard}
          onEdit={() => onEdit(flashcard.id)}
          onDelete={() => onDelete(flashcard.id)}
          onToggleSelect={() => onToggleSelect(flashcard.id)}
        />
      ))}
    </div>
  );
}
