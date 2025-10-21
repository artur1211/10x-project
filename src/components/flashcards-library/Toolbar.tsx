import React, { useState } from "react";
import { Search, Grid3x3, List, Plus, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { SortOptions, ViewMode } from "./types";
import { useDebounce } from "./useDebounce";

interface ToolbarProps {
  searchQuery: string;
  sortOptions: SortOptions;
  viewMode: ViewMode;
  selectedCount: number;
  isAtCapacity: boolean;
  onSearchChange: (query: string) => void;
  onSortChange: (options: SortOptions) => void;
  onViewToggle: (mode: ViewMode) => void;
  onCreateClick: () => void;
  onBulkDeleteClick: () => void;
}

export function Toolbar({
  searchQuery,
  sortOptions,
  viewMode,
  selectedCount,
  isAtCapacity,
  onSearchChange,
  onSortChange,
  onViewToggle,
  onCreateClick,
  onBulkDeleteClick,
}: ToolbarProps) {
  const [localSearch, setLocalSearch] = useState(searchQuery);
  const debouncedSearch = useDebounce(localSearch, 300);

  // Effect to emit debounced search
  React.useEffect(() => {
    onSearchChange(debouncedSearch);
  }, [debouncedSearch, onSearchChange]);

  const getSortLabel = () => {
    const byLabel = sortOptions.sortBy === "created_at" ? "Created" : "Updated";
    const orderLabel = sortOptions.sortOrder === "asc" ? "Oldest" : "Newest";
    return `${byLabel} - ${orderLabel}`;
  };

  return (
    <div className="flex flex-col gap-4 mb-6">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        {/* Search */}
        <div className="relative flex-1 w-full sm:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search flashcards..."
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Actions */}
        <div className="flex gap-2 items-center flex-wrap">
          {/* Sort Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                Sort: {getSortLabel()}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onSortChange({ sortBy: "created_at", sortOrder: "desc" })}>
                Created - Newest First
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onSortChange({ sortBy: "created_at", sortOrder: "asc" })}>
                Created - Oldest First
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onSortChange({ sortBy: "updated_at", sortOrder: "desc" })}>
                Updated - Newest First
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onSortChange({ sortBy: "updated_at", sortOrder: "asc" })}>
                Updated - Oldest First
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* View Toggle */}
          <div className="flex gap-1 border rounded-md p-1">
            <Button
              variant={viewMode === "grid" ? "default" : "ghost"}
              size="sm"
              onClick={() => onViewToggle("grid")}
              className="h-8 w-8 p-0"
            >
              <Grid3x3 className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "ghost"}
              size="sm"
              onClick={() => onViewToggle("list")}
              className="h-8 w-8 p-0"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>

          {/* Create Button */}
          <Button
            onClick={onCreateClick}
            disabled={isAtCapacity}
            size="sm"
            title={isAtCapacity ? "You have reached your 500 flashcard limit" : "Create a new flashcard"}
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Flashcard
          </Button>

          {/* Bulk Delete Button */}
          {selectedCount > 0 && (
            <Button variant="destructive" size="sm" onClick={onBulkDeleteClick}>
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Selected ({selectedCount})
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
