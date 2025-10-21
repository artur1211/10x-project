import { useState, useCallback } from "react";

export interface DeleteDialogState {
  isOpen: boolean;
  mode: "single" | "bulk";
  flashcardId?: string;
}

/**
 * Hook for managing delete confirmation dialog state and operations
 */
export function useDeleteDialog() {
  const [deleteDialogState, setDeleteDialogState] = useState<DeleteDialogState>({
    isOpen: false,
    mode: "single",
  });

  const openSingle = useCallback((id: string) => {
    setDeleteDialogState({
      isOpen: true,
      mode: "single",
      flashcardId: id,
    });
  }, []);

  const openBulk = useCallback(() => {
    setDeleteDialogState({
      isOpen: true,
      mode: "bulk",
    });
  }, []);

  const close = useCallback(() => {
    setDeleteDialogState({
      isOpen: false,
      mode: "single",
    });
  }, []);

  const reset = useCallback(() => {
    setDeleteDialogState({
      isOpen: false,
      mode: "single",
    });
  }, []);

  return {
    deleteDialogState,
    openSingle,
    openBulk,
    close,
    reset,
  };
}
