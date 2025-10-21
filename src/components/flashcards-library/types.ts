import type { FlashcardDTO } from "@/types";

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
