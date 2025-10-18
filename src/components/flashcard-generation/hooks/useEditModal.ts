import { useState, useCallback } from "react";

/**
 * Hook for managing edit modal state and operations
 */
export function useEditModal() {
  const [editModalState, setEditModalState] = useState<{
    isOpen: boolean;
    cardIndex: number | null;
  }>({
    isOpen: false,
    cardIndex: null,
  });

  const openEditModal = useCallback((index: number) => {
    setEditModalState({
      isOpen: true,
      cardIndex: index,
    });
  }, []);

  const closeEditModal = useCallback(() => {
    setEditModalState({
      isOpen: false,
      cardIndex: null,
    });
  }, []);

  const reset = useCallback(() => {
    setEditModalState({
      isOpen: false,
      cardIndex: null,
    });
  }, []);

  return {
    editModalState,
    openEditModal,
    closeEditModal,
    reset,
  };
}
