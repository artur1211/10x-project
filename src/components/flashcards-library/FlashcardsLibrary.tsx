import React, { useCallback } from "react";
import { toast } from "sonner";
import { Toolbar } from "./components/Toolbar";
import { CapacityIndicator } from "./components/CapacityIndicator";
import { FlashcardList } from "./components/FlashcardList";
import { Pagination } from "./components/Pagination";
import { FlashcardFormDialog } from "./components/FlashcardFormDialog";
import { ConfirmationDialog } from "@/components/shared/ConfirmationDialog";
import { useFlashcardsLibrary } from "./hooks/useFlashcardsLibrary";
import { useFormDialog } from "./hooks/useFormDialog";
import { useDeleteDialog } from "./hooks/useDeleteDialog";
import type { CreateFlashcardCommand, UpdateFlashcardCommand, ApiError } from "@/types";
import type { ViewMode, SortOptions } from "./types";

/**
 * Main orchestrating component for flashcard library
 * Handles rendering and coordinates between hooks and child components
 */
export function FlashcardsLibrary() {
  const {
    flashcards,
    pagination,
    userStats,
    isLoading,
    error,
    viewMode,
    selectedIds,
    queryParams,
    setSearch,
    setSort,
    setPage,
    setViewMode,
    createFlashcard,
    updateFlashcard,
    deleteFlashcard,
    deleteSelectedFlashcards,
    toggleSelection,
    clearSelection,
    refetch,
  } = useFlashcardsLibrary();

  const formDialog = useFormDialog();
  const deleteDialog = useDeleteDialog();

  // Form Dialog Handlers
  const handleOpenCreateDialog = useCallback(() => {
    formDialog.openCreate();
  }, [formDialog]);

  const handleOpenEditDialog = useCallback(
    (id: string) => {
      const flashcard = flashcards.find((fc) => fc.id === id);
      if (flashcard) {
        formDialog.openEdit(flashcard);
      }
    },
    [flashcards, formDialog]
  );

  const handleFormSubmit = useCallback(
    async (data: CreateFlashcardCommand | UpdateFlashcardCommand) => {
      try {
        if (formDialog.formDialogState.mode === "create") {
          await createFlashcard(data as CreateFlashcardCommand);
          toast.success("Flashcard created successfully!");
        } else if (formDialog.formDialogState.mode === "edit" && formDialog.formDialogState.flashcardData) {
          await updateFlashcard(formDialog.formDialogState.flashcardData.id, data as UpdateFlashcardCommand);
          toast.success("Flashcard updated successfully!");
        }
      } catch (err) {
        const apiError = err as ApiError;
        if (apiError.error === "FORBIDDEN" && apiError.message.includes("limit")) {
          toast.error("You have reached your flashcard limit of 500 cards.");
        } else {
          toast.error(apiError.message || "An error occurred. Please try again.");
        }
        throw err;
      }
    },
    [formDialog.formDialogState, createFlashcard, updateFlashcard]
  );

  // Delete Dialog Handlers
  const handleOpenDeleteDialog = useCallback(
    (id: string) => {
      deleteDialog.openSingle(id);
    },
    [deleteDialog]
  );

  const handleOpenBulkDeleteDialog = useCallback(() => {
    deleteDialog.openBulk();
  }, [deleteDialog]);

  const handleDeleteConfirm = useCallback(() => {
    if (deleteDialog.deleteDialogState.mode === "single" && deleteDialog.deleteDialogState.flashcardId) {
      const idToDelete = deleteDialog.deleteDialogState.flashcardId;

      // Immediately delete
      const performDelete = async () => {
        try {
          await deleteFlashcard(idToDelete);
          toast.success("Flashcard deleted");
        } catch (err) {
          const apiError = err as ApiError;
          if (apiError.error === "NOT_FOUND") {
            toast.error("This flashcard no longer exists.");
          } else {
            toast.error("Failed to delete flashcard.");
          }
          refetch();
        }
      };

      performDelete();
    } else if (deleteDialog.deleteDialogState.mode === "bulk") {
      const count = selectedIds.size;

      // Immediately delete
      const performBulkDelete = async () => {
        try {
          await deleteSelectedFlashcards();
          clearSelection();
          toast.success(`${count} flashcard${count > 1 ? "s" : ""} deleted`);
        } catch (err) {
          const apiError = err as ApiError;
          toast.error(apiError.message || "Failed to delete flashcards.");
          refetch();
        }
      };

      performBulkDelete();
    }
  }, [deleteDialog.deleteDialogState, deleteFlashcard, deleteSelectedFlashcards, selectedIds, clearSelection, refetch]);

  // Sort handler
  const handleSortChange = useCallback(
    (options: SortOptions) => {
      setSort(options);
    },
    [setSort]
  );

  // View mode handler
  const handleViewToggle = useCallback(
    (mode: ViewMode) => {
      setViewMode(mode);
    },
    [setViewMode]
  );

  // Loading skeleton
  if (isLoading && flashcards.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Flashcards Library</h1>
        <div className="space-y-4">
          <div className="h-12 bg-secondary animate-pulse rounded" />
          <div className="h-24 bg-secondary animate-pulse rounded" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-32 bg-secondary animate-pulse rounded" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error && flashcards.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Flashcards Library</h1>
        <div className="text-center py-12">
          <p className="text-destructive text-lg mb-4">Failed to load flashcards</p>
          <p className="text-muted-foreground mb-4">{error.message}</p>
          <button
            onClick={() => refetch()}
            className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const isAtCapacity = userStats ? userStats.total_flashcards >= userStats.flashcard_limit : false;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Flashcards Library</h1>

      <CapacityIndicator userStats={userStats} />

      <Toolbar
        searchQuery={queryParams.search}
        sortOptions={{
          sortBy: queryParams.sort_by,
          sortOrder: queryParams.sort_order,
        }}
        viewMode={viewMode}
        selectedCount={selectedIds.size}
        isAtCapacity={isAtCapacity}
        onSearchChange={setSearch}
        onSortChange={handleSortChange}
        onViewToggle={handleViewToggle}
        onCreateClick={handleOpenCreateDialog}
        onBulkDeleteClick={handleOpenBulkDeleteDialog}
      />

      <FlashcardList
        flashcards={flashcards}
        viewMode={viewMode}
        onEdit={handleOpenEditDialog}
        onDelete={handleOpenDeleteDialog}
        onToggleSelect={toggleSelection}
      />

      <Pagination pagination={pagination} onPageChange={setPage} />

      {/* Form Dialog */}
      <FlashcardFormDialog
        isOpen={formDialog.formDialogState.isOpen}
        mode={formDialog.formDialogState.mode}
        initialData={formDialog.formDialogState.flashcardData}
        onSubmit={handleFormSubmit}
        onClose={formDialog.close}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={deleteDialog.deleteDialogState.isOpen}
        title={
          deleteDialog.deleteDialogState.mode === "single"
            ? "Delete Flashcard"
            : `Delete ${selectedIds.size} Flashcards`
        }
        description={
          deleteDialog.deleteDialogState.mode === "single"
            ? "Are you sure you want to delete this flashcard? This action cannot be undone."
            : `Are you sure you want to delete ${selectedIds.size} flashcards? This action cannot be undone.`
        }
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={handleDeleteConfirm}
        onCancel={deleteDialog.close}
      />
    </div>
  );
}
