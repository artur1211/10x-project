import { useState, useEffect, useCallback } from "react";
import type {
  FlashcardsListResponse,
  FlashcardDTO,
  CreateFlashcardCommand,
  UpdateFlashcardCommand,
  ApiError,
  PaginationMetadata,
  UserFlashcardStats,
} from "@/types";
import type { FlashcardViewModel, QueryParams, ViewMode, SortOptions } from "./types";

const DEFAULT_QUERY_PARAMS: QueryParams = {
  page: 1,
  limit: 20,
  search: "",
  sort_by: "created_at",
  sort_order: "desc",
};

interface UseFlashcardsLibraryReturn {
  // Data state
  flashcards: FlashcardViewModel[];
  pagination: PaginationMetadata | null;
  userStats: UserFlashcardStats | null;

  // UI state
  isLoading: boolean;
  error: ApiError | null;
  viewMode: ViewMode;
  selectedIds: Set<string>;

  // Query state
  queryParams: QueryParams;

  // Handlers
  setSearch: (search: string) => void;
  setSort: (options: SortOptions) => void;
  setPage: (page: number) => void;
  setViewMode: (mode: ViewMode) => void;
  createFlashcard: (data: CreateFlashcardCommand) => Promise<void>;
  updateFlashcard: (id: string, data: UpdateFlashcardCommand) => Promise<void>;
  deleteFlashcard: (id: string) => Promise<void>;
  deleteSelectedFlashcards: () => Promise<void>;
  toggleSelection: (id: string) => void;
  toggleSelectAll: () => void;
  clearSelection: () => void;
  refetch: () => Promise<void>;
}

export function useFlashcardsLibrary(): UseFlashcardsLibraryReturn {
  // Data state
  const [flashcards, setFlashcards] = useState<FlashcardViewModel[]>([]);
  const [pagination, setPagination] = useState<PaginationMetadata | null>(null);
  const [userStats, setUserStats] = useState<UserFlashcardStats | null>(null);

  // UI state
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);
  const [viewMode, setViewModeState] = useState<ViewMode>(() => {
    // Load from localStorage on mount
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("flashcards-view-mode");
      if (saved === "grid" || saved === "list") {
        return saved;
      }
    }
    return "grid";
  });
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Query state - sync with URL params
  const [queryParams, setQueryParams] = useState<QueryParams>(() => {
    if (typeof window !== "undefined") {
      const searchParams = new URLSearchParams(window.location.search);
      return {
        page: parseInt(searchParams.get("page") || "1", 10),
        limit: parseInt(searchParams.get("limit") || "20", 10),
        search: searchParams.get("search") || "",
        sort_by: (searchParams.get("sort_by") as QueryParams["sort_by"]) || "created_at",
        sort_order: (searchParams.get("sort_order") as QueryParams["sort_order"]) || "desc",
      };
    }
    return DEFAULT_QUERY_PARAMS;
  });

  // Fetch flashcards from API
  const fetchFlashcards = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      params.set("page", queryParams.page.toString());
      params.set("limit", queryParams.limit.toString());
      if (queryParams.search) {
        params.set("search", queryParams.search);
      }
      params.set("sort_by", queryParams.sort_by);
      params.set("sort_order", queryParams.sort_order);

      const response = await fetch(`/api/flashcards?${params.toString()}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorData: ApiError = await response.json();
        throw errorData;
      }

      const data: FlashcardsListResponse = await response.json();

      // Convert DTOs to ViewModels
      const viewModels: FlashcardViewModel[] = data.flashcards.map((flashcard) => ({
        ...flashcard,
        isSelected: false,
      }));

      setFlashcards(viewModels);
      setPagination(data.pagination);
      setUserStats(data.user_stats);
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError);
      // Error will be displayed in the UI
    } finally {
      setIsLoading(false);
    }
  }, [queryParams]);

  // Update URL when query params change
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams();
      params.set("page", queryParams.page.toString());
      params.set("limit", queryParams.limit.toString());
      if (queryParams.search) {
        params.set("search", queryParams.search);
      }
      params.set("sort_by", queryParams.sort_by);
      params.set("sort_order", queryParams.sort_order);

      const newUrl = `${window.location.pathname}?${params.toString()}`;
      window.history.replaceState({}, "", newUrl);
    }
  }, [queryParams]);

  // Fetch data on mount and when query params change
  useEffect(() => {
    fetchFlashcards();
  }, [fetchFlashcards]);

  // Query param handlers
  const setSearch = useCallback((search: string) => {
    setQueryParams((prev) => ({ ...prev, search, page: 1 }));
  }, []);

  const setSort = useCallback((options: SortOptions) => {
    setQueryParams((prev) => ({
      ...prev,
      sort_by: options.sortBy,
      sort_order: options.sortOrder,
      page: 1,
    }));
  }, []);

  const setPage = useCallback((page: number) => {
    setQueryParams((prev) => ({ ...prev, page }));
  }, []);

  // View mode handler with localStorage persistence
  const setViewMode = useCallback((mode: ViewMode) => {
    setViewModeState(mode);
    if (typeof window !== "undefined") {
      localStorage.setItem("flashcards-view-mode", mode);
    }
  }, []);

  // Selection handlers
  const toggleSelection = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });

    // Update the flashcard's isSelected state
    setFlashcards((prev) =>
      prev.map((flashcard) => (flashcard.id === id ? { ...flashcard, isSelected: !flashcard.isSelected } : flashcard))
    );
  }, []);

  const toggleSelectAll = useCallback(() => {
    if (selectedIds.size === flashcards.length && flashcards.length > 0) {
      // Deselect all
      setSelectedIds(new Set());
      setFlashcards((prev) => prev.map((fc) => ({ ...fc, isSelected: false })));
    } else {
      // Select all
      const allIds = new Set(flashcards.map((fc) => fc.id));
      setSelectedIds(allIds);
      setFlashcards((prev) => prev.map((fc) => ({ ...fc, isSelected: true })));
    }
  }, [flashcards, selectedIds.size]);

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
    setFlashcards((prev) => prev.map((fc) => ({ ...fc, isSelected: false })));
  }, []);

  // CRUD operations
  const createFlashcard = useCallback(
    async (data: CreateFlashcardCommand) => {
      const response = await fetch("/api/flashcards", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData: ApiError = await response.json();
        throw errorData;
      }

      // Refetch the list to include the new flashcard
      await fetchFlashcards();
    },
    [fetchFlashcards]
  );

  const updateFlashcard = useCallback(async (id: string, data: UpdateFlashcardCommand) => {
    const response = await fetch(`/api/flashcards/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData: ApiError = await response.json();
      throw errorData;
    }

    const updatedFlashcard: FlashcardDTO = await response.json();

    // Optimistically update the flashcard in the list
    setFlashcards((prev) => prev.map((fc) => (fc.id === id ? { ...updatedFlashcard, isSelected: fc.isSelected } : fc)));
  }, []);

  const deleteFlashcard = useCallback(async (id: string) => {
    const response = await fetch(`/api/flashcards/${id}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      const errorData: ApiError = await response.json();
      throw errorData;
    }

    // Remove the flashcard from the list
    setFlashcards((prev) => prev.filter((fc) => fc.id !== id));

    // Update user stats
    setUserStats((prev) =>
      prev
        ? {
            ...prev,
            total_flashcards: prev.total_flashcards - 1,
            remaining_capacity: prev.remaining_capacity + 1,
          }
        : null
    );

    // Remove from selection if selected
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }, []);

  const deleteSelectedFlashcards = useCallback(async () => {
    if (selectedIds.size === 0) return;

    const ids = Array.from(selectedIds).join(",");
    const response = await fetch(`/api/flashcards?ids=${ids}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      const errorData: ApiError = await response.json();
      throw errorData;
    }

    // Remove the flashcards from the list
    setFlashcards((prev) => prev.filter((fc) => !selectedIds.has(fc.id)));

    // Update user stats
    setUserStats((prev) =>
      prev
        ? {
            ...prev,
            total_flashcards: prev.total_flashcards - selectedIds.size,
            remaining_capacity: prev.remaining_capacity + selectedIds.size,
          }
        : null
    );

    // Clear selection
    setSelectedIds(new Set());
  }, [selectedIds]);

  const refetch = useCallback(async () => {
    await fetchFlashcards();
  }, [fetchFlashcards]);

  return {
    // Data state
    flashcards,
    pagination,
    userStats,

    // UI state
    isLoading,
    error,
    viewMode,
    selectedIds,

    // Query state
    queryParams,

    // Handlers
    setSearch,
    setSort,
    setPage,
    setViewMode,
    createFlashcard,
    updateFlashcard,
    deleteFlashcard,
    deleteSelectedFlashcards,
    toggleSelection,
    toggleSelectAll,
    clearSelection,
    refetch,
  };
}
