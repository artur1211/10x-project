import { useState, useCallback } from "react";
import type { FlashcardDTO } from "@/types";

export interface FormDialogState {
  isOpen: boolean;
  mode: "create" | "edit";
  flashcardData?: FlashcardDTO;
}

/**
 * Hook for managing form dialog state and operations
 */
export function useFormDialog() {
  const [formDialogState, setFormDialogState] = useState<FormDialogState>({
    isOpen: false,
    mode: "create",
  });

  const openCreate = useCallback(() => {
    setFormDialogState({
      isOpen: true,
      mode: "create",
    });
  }, []);

  const openEdit = useCallback((flashcard: FlashcardDTO) => {
    setFormDialogState({
      isOpen: true,
      mode: "edit",
      flashcardData: flashcard,
    });
  }, []);

  const close = useCallback(() => {
    setFormDialogState({
      isOpen: false,
      mode: "create",
    });
  }, []);

  const reset = useCallback(() => {
    setFormDialogState({
      isOpen: false,
      mode: "create",
    });
  }, []);

  return {
    formDialogState,
    openCreate,
    openEdit,
    close,
    reset,
  };
}
