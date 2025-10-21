import React, { useState, useCallback } from "react";
import { toast } from "sonner";
import { Toolbar } from "./Toolbar";
import { CapacityIndicator } from "./CapacityIndicator";
import { FlashcardList } from "./FlashcardList";
import { Pagination } from "./Pagination";
import { FlashcardFormDialog } from "./FlashcardFormDialog";
import { ConfirmationDialog } from "@/components/shared/ConfirmationDialog";
import { useFlashcardsLibrary } from "./useFlashcardsLibrary";
import type { CreateFlashcardCommand, UpdateFlashcardCommand, FlashcardDTO, ApiError } from "@/types";
import type { ViewMode, SortOptions } from "./types";

interface DialogState {
  isOpen: boolean;
  mode: "create" | "edit";
  flashcardData?: FlashcardDTO;
}

interface DeleteState {
  isOpen: boolean;
  mode: "single" | "bulk";
  flashcardId?: string;
}

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

  const [formDialog, setFormDialog] = useState<DialogState>({
    isOpen: false,
    mode: "create",
  });

  const [deleteDialog, setDeleteDialog] = useState<DeleteState>({
    isOpen: false,
    mode: "single",
  });

  // Undo state for delete operations
  const [deleteTimeout, setDeleteTimeout] = useState<NodeJS.Timeout | null>(null);

  // Form Dialog Handlers
  const handleOpenCreateDialog = useCallback(() => {
    setFormDialog({
      isOpen: true,
      mode: "create",
    });
  }, []);

  const handleOpenEditDialog = useCallback(
    (id: string) => {
      const flashcard = flashcards.find((fc) => fc.id === id);
      if (flashcard) {
        setFormDialog({
          isOpen: true,
          mode: "edit",
          flashcardData: flashcard,
        });
      }
    },
    [flashcards]
  );

  const handleCloseFormDialog = useCallback(() => {
    setFormDialog({
      isOpen: false,
      mode: "create",
    });
  }, []);

  const handleFormSubmit = useCallback(
    async (data: CreateFlashcardCommand | UpdateFlashcardCommand) => {
      try {
        if (formDialog.mode === "create") {
          await createFlashcard(data as CreateFlashcardCommand);
          toast.success("Flashcard created successfully!");
        } else if (formDialog.mode === "edit" && formDialog.flashcardData) {
          await updateFlashcard(formDialog.flashcardData.id, data as UpdateFlashcardCommand);
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
    [formDialog, createFlashcard, updateFlashcard]
  );

  // Delete Dialog Handlers
  const handleOpenDeleteDialog = useCallback((id: string) => {
    setDeleteDialog({
      isOpen: true,
      mode: "single",
      flashcardId: id,
    });
  }, []);

  const handleOpenBulkDeleteDialog = useCallback(() => {
    setDeleteDialog({
      isOpen: true,
      mode: "bulk",
    });
  }, []);

  const handleCloseDeleteDialog = useCallback(() => {
    setDeleteDialog({
      isOpen: false,
      mode: "single",
    });
  }, []);

  const handleDeleteConfirm = useCallback(() => {
    if (deleteDialog.mode === "single" && deleteDialog.flashcardId) {
      // Show toast with undo button
      toast.success("Flashcard deleted", {
        duration: 10000,
        action: {
          label: "Undo",
          onClick: () => {
            if (deleteTimeout) {
              clearTimeout(deleteTimeout);
              setDeleteTimeout(null);
            }
            setDeletedItems(null);
            refetch();
            toast.success("Delete cancelled");
          },
        },
      });

      // Set timeout to actually delete after 10 seconds
      const timeout = setTimeout(async () => {
        try {
          if (deleteDialog.flashcardId) {
            await deleteFlashcard(deleteDialog.flashcardId);
          }
        } catch (err) {
          const apiError = err as ApiError;
          if (apiError.error === "NOT_FOUND") {
            toast.error("This flashcard no longer exists.");
          } else {
            toast.error("Failed to delete flashcard.");
          }
          refetch();
        }
      }, 10000);

      setDeleteTimeout(timeout);
    } else if (deleteDialog.mode === "bulk") {
      const count = selectedIds.size;

      // Show toast with undo button
      toast.success(`${count} flashcard${count > 1 ? "s" : ""} deleted`, {
        duration: 10000,
        action: {
          label: "Undo",
          onClick: () => {
            if (deleteTimeout) {
              clearTimeout(deleteTimeout);
              setDeleteTimeout(null);
            }
            refetch();
            toast.success("Delete cancelled");
          },
        },
      });

      // Set timeout to actually delete after 10 seconds
      const timeout = setTimeout(async () => {
        try {
          await deleteSelectedFlashcards();
          clearSelection();
        } catch (err) {
          const apiError = err as ApiError;
          toast.error(apiError.message || "Failed to delete flashcards.");
          refetch();
        }
      }, 10000);

      setDeleteTimeout(timeout);
    }
  }, [deleteDialog, deleteFlashcard, deleteSelectedFlashcards, selectedIds, deleteTimeout, clearSelection, refetch]);

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
        isOpen={formDialog.isOpen}
        mode={formDialog.mode}
        initialData={formDialog.flashcardData}
        onSubmit={handleFormSubmit}
        onClose={handleCloseFormDialog}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={deleteDialog.isOpen}
        title={deleteDialog.mode === "single" ? "Delete Flashcard" : `Delete ${selectedIds.size} Flashcards`}
        description={
          deleteDialog.mode === "single"
            ? "Are you sure you want to delete this flashcard? You can undo this action within 10 seconds."
            : `Are you sure you want to delete ${selectedIds.size} flashcards? You can undo this action within 10 seconds.`
        }
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={handleDeleteConfirm}
        onCancel={handleCloseDeleteDialog}
      />
    </div>
  );
}
