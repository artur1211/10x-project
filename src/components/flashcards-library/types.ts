import type {
  FlashcardDTO,
  PaginationMetadata,
  UserFlashcardStats,
  CreateFlashcardCommand,
  UpdateFlashcardCommand,
} from "@/types";

/**
 * ViewModel to extend the DTO with client-side state
 */
export interface FlashcardViewModel extends FlashcardDTO {
  isSelected: boolean;
}

/**
 * Type for managing the view display mode
 */
export type ViewMode = "grid" | "list";

/**
 * Type for managing sorting state
 */
export interface SortOptions {
  sortBy: "created_at" | "updated_at";
  sortOrder: "asc" | "desc";
}

/**
 * Consolidated type for all API query parameters
 */
export interface QueryParams {
  page: number;
  limit: number;
  search: string;
  sort_by: "created_at" | "updated_at";
  sort_order: "asc" | "desc";
}

/**
 * Props for CapacityIndicator component
 */
export interface CapacityIndicatorProps {
  userStats: UserFlashcardStats | null;
}

/**
 * Props for Toolbar component
 */
export interface ToolbarProps {
  searchQuery: string;
  sortOptions: SortOptions;
  viewMode: ViewMode;
  selectedCount: number;
  isAtCapacity: boolean;
  onSearchChange: (search: string) => void;
  onSortChange: (options: SortOptions) => void;
  onViewToggle: (mode: ViewMode) => void;
  onCreateClick: () => void;
  onBulkDeleteClick: () => void;
}

/**
 * Props for FlashcardList component
 */
export interface FlashcardListProps {
  flashcards: FlashcardViewModel[];
  viewMode: ViewMode;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onToggleSelect: (id: string) => void;
}

/**
 * Props for FlashcardItem component
 */
export interface FlashcardItemProps {
  flashcard: FlashcardViewModel;
  onEdit: () => void;
  onDelete: () => void;
  onToggleSelect: () => void;
}

/**
 * Props for Pagination component
 */
export interface PaginationProps {
  pagination: PaginationMetadata | null;
  onPageChange: (page: number) => void;
}

/**
 * Props for FlashcardFormDialog component
 */
export interface FlashcardFormDialogProps {
  isOpen: boolean;
  mode: "create" | "edit";
  initialData?: FlashcardDTO;
  onSubmit: (data: CreateFlashcardCommand | UpdateFlashcardCommand) => Promise<void>;
  onClose: () => void;
}
