# View Implementation Plan: Flashcards Library

## 1. Overview

This document outlines the implementation plan for the Flashcards Library view. This view is the central hub for users to manage their flashcard collection. It allows them to view, search, sort, create, edit, and delete flashcards. The view will also display the user's current flashcard capacity and provide tools for bulk operations.

## 2. View Routing

- **Path**: `/flashcards`
- **Implementation**: An Astro page will be created at `src/pages/flashcards.astro`. This page will be responsible for rendering the main layout and the client-side React component that powers the view. The page should not be pre-rendered to ensure user-specific data is always fresh.

## 3. Component Structure

The view will be built using a hierarchical component structure to ensure separation of concerns and reusability.

```
/src/pages/flashcards.astro
└── /src/components/flashcards-library/FlashcardsLibrary.tsx (Client-side root)
    ├── /src/components/flashcards-library/Toolbar.tsx
    │   ├── ui/Input (for search)
    │   ├── ui/DropdownMenu (for sorting)
    │   ├── ui/Button (for view toggle)
    │   └── ui/Button (for "Create" and "Delete Selected")
    ├── /src/components/flashcards-library/CapacityIndicator.tsx
    ├── /src/components/flashcards-library/FlashcardList.tsx
    │   └── /src/components/flashcards-library/FlashcardItem.tsx
    │       ├── ui/Checkbox
    │       ├── ui/Card
    │       └── ui/Button (for Edit, Delete)
    ├── /src/components/flashcards-library/Pagination.tsx
    └── Dialogs (rendered conditionally from FlashcardsLibrary.tsx)
        ├── /src/components/flashcards-library/FlashcardFormDialog.tsx
        └── /src/components/shared/ConfirmationDialog.tsx
```

## 4. Component Details

### `FlashcardsLibrary.tsx`

- **Description**: The main client-side React component that orchestrates the entire view. It manages state, fetches data from the API, and handles communication between child components.
- **Main elements**: Renders `Toolbar`, `CapacityIndicator`, `FlashcardList`, and `Pagination`. Also manages the rendering of `FlashcardFormDialog` and `ConfirmationDialog`.
- **Handled interactions**: Initiates data fetching on load and when query parameters (search, sort, page) change. Handles opening/closing of create/edit and confirmation dialogs.
- **Validation**: None directly, but passes data down that affects validation in other components (e.g., `user_stats` for capacity check).
- **Types**: `FlashcardsListResponse`, `FlashcardDTO`, `ApiError`.
- **Props**: None.

### `Toolbar.tsx`

- **Description**: A control bar for managing the flashcard list. It includes search, sorting, view toggling, a "Create Flashcard" button, and bulk action controls.
- **Main elements**: `Input` for search, `DropdownMenu` for sorting, `Button` group for view toggle, `Button` for create, and `Button` for bulk delete (visible when items are selected).
- **Handled interactions**:
  - `onSearchChange(string)`: Emits search query (debounced).
  - `onSortChange(SortOptions)`: Emits new sort parameters.
  - `onViewToggle(ViewMode)`: Emits selected view mode.
  - `onCreateClick()`: Signals to the parent to open the create dialog.
  - `onBulkDeleteClick()`: Signals to the parent to start the bulk delete process.
- **Validation**: The "Create Flashcard" button should be disabled if the user has reached their 500-card limit.
- **Types**: `SortOptions`, `ViewMode`.
- **Props**:
  - `searchQuery: string`
  - `sortOptions: SortOptions`
  - `viewMode: ViewMode`
  - `selectedCount: number`
  - `isAtCapacity: boolean`
  - `onSearchChange`, `onSortChange`, `onViewToggle`, `onCreateClick`, `onBulkDeleteClick` callbacks.

### `FlashcardList.tsx`

- **Description**: Displays the collection of flashcards in either a grid or list layout.
- **Main elements**: A `div` that dynamically applies `grid` or `flex` styling based on the `viewMode` prop. It maps over the `flashcards` array and renders a `FlashcardItem` for each.
- **Handled interactions**: Handles toggling "select all" functionality. Passes down selection and action events from `FlashcardItem` to the parent.
- **Validation**: None.
- **Types**: `FlashcardViewModel[]`, `ViewMode`.
- **Props**:
  - `flashcards: FlashcardViewModel[]`
  - `viewMode: ViewMode`
  - `onEdit(id: string)`, `onDelete(id: string)`, `onToggleSelect(id: string)` callbacks.

### `FlashcardItem.tsx`

- **Description**: Represents a single flashcard in the view. It displays the front text and provides actions to edit, delete, and select the card.
- **Main elements**: A `Card` component containing a `Checkbox`, the `front_text` of the flashcard, and action `Button`s for edit and delete.
- **Handled interactions**:
  - `onEditClick`: Signals to the parent to open the edit dialog for this card.
  - `onDeleteClick`: Signals to the parent to start the deletion process for this card.
  - `onSelectChange`: Signals to the parent that this card's selection state has changed.
- **Validation**: None.
- **Types**: `FlashcardViewModel`.
- **Props**:
  - `flashcard: FlashcardViewModel`
  - `onEdit`, `onDelete`, `onToggleSelect` callbacks.

### `FlashcardFormDialog.tsx`

- **Description**: A modal dialog containing a form to create or edit a flashcard.
- **Main elements**: `Dialog` component with `Input` for `front_text`, `Textarea` for `back_text`, and character count indicators. Includes "Save" and "Cancel" buttons.
- **Handled interactions**: `onSubmit(data)`, `onCancel()`. Manages internal form state.
- **Handled validation**:
  - `front_text`: Required, min 10 characters, max 500 characters.
  - `back_text`: Required, min 10 characters, max 1000 characters.
  - The "Save" button is disabled if the form is invalid.
  - Real-time character count feedback is displayed.
- **Types**: `CreateFlashcardCommand`, `UpdateFlashcardCommand`.
- **Props**:
  - `isOpen: boolean`
  - `mode: 'create' | 'edit'`
  - `initialData?: FlashcardDTO` (for edit mode)
  - `onSubmit(data)`, `onClose()` callbacks.

## 5. Types

In addition to the existing types from `src/types.ts`, the following local view model and state types will be required.

```typescript
// ViewModel to extend the DTO with client-side state
export interface FlashcardViewModel extends FlashcardDTO {
  isSelected: boolean;
}

// Type for managing the view display mode
export type ViewMode = "grid" | "list";

// Type for managing sorting state
export interface SortOptions {
  sortBy: "created_at" | "updated_at";
  sortOrder: "asc" | "desc";
}

// Consolidated type for all API query parameters
export interface QueryParams {
  page: number;
  limit: number;
  search: string;
  sort_by: "created_at" | "updated_at";
  sort_order: "asc" | "desc";
}
```

## 6. State Management

A custom React hook, `useFlashcardsLibrary`, will be created to encapsulate the view's logic and state. This promotes separation of concerns and keeps the main component clean.

**`useFlashcardsLibrary()` Hook:**

- **Responsibility**: Manages all client-side state, including fetched data, query parameters for the API, user selections, and UI state like the current view mode.
- **State Managed**:
  - `flashcards: FlashcardViewModel[]`
  - `pagination: PaginationMetadata | null`
  - `userStats: UserFlashcardStats | null`
  - `queryParams: QueryParams` (state will be synced with URL search params)
  - `isLoading: boolean`
  - `error: ApiError | null`
  - `viewMode: ViewMode` (persisted to `localStorage`)
  - `selectedIds: Set<string>`
- **Exposed API**:
  - State variables (listed above).
  - Handler functions: `setSearch`, `setSort`, `setPage`, `setViewMode`, `createFlashcard`, `updateFlashcard`, `deleteFlashcard`, `deleteSelectedFlashcards`, `toggleSelection`, `toggleSelectAll`.

## 7. API Integration

The view will interact with the `/api/flashcards` endpoints. A typed API client or service functions will be created to handle these calls.

- **`GET /api/flashcards`**:
  - **Request**: Sent with `QueryParams` state.
  - **Response**: `FlashcardsListResponse`. Used to populate the `flashcards`, `pagination`, and `userStats` state.
  - **Trigger**: Initial load and any change in `queryParams`.
- **`POST /api/flashcards`**:
  - **Request**: `CreateFlashcardCommand`.
  - **Response**: `FlashcardDTO`.
  - **Trigger**: Submitting the `FlashcardFormDialog` in 'create' mode. On success, the flashcard list will be refetched.
- **`PATCH /api/flashcards/:id`**:
  - **Request**: `UpdateFlashcardCommand`.
  - **Response**: `FlashcardDTO`.
  - **Trigger**: Submitting the `FlashcardFormDialog` in 'edit' mode. On success, the specific flashcard will be updated in the local state optimistically or the list will be refetched.
- **`DELETE /api/flashcards/:id` and `DELETE /api/flashcards?ids=...`**:
  - **Request**: ID in path or comma-separated IDs in query param.
  - **Response**: `DeleteFlashcardResponse` or `DeleteFlashcardsResponse`.
  - **Trigger**: Confirming deletion for a single card or bulk selection. The API call will be delayed to implement the "Undo" feature.

## 8. User Interactions

- **Searching**: User types in the search bar. A `useDebounce` hook will be used to delay the API call until the user stops typing for ~300ms. The `search` parameter in the URL will be updated.
- **Sorting**: User selects a new sort option from the dropdown. This immediately updates the `sort_by` and `sort_order` URL params and triggers an API refetch.
- **Pagination**: User clicks a page number. This updates the `page` URL param and triggers an API refetch.
- **Deleting**:
  1. User clicks the delete button. A `ConfirmationDialog` appears.
  2. On confirmation, the item is optimistically removed from the UI.
  3. A toast notification appears with an "Undo" button, visible for 10 seconds.
  4. If "Undo" is clicked, the item is restored to the UI and the API call is cancelled.
  5. If the 10-second timer completes, the `DELETE` request is sent to the API.

## 9. Conditions and Validation

- **Create/Edit Form**:
  - Real-time validation for character limits (front: 10-500, back: 10-1000) will be implemented in `FlashcardFormDialog`.
  - The "Save" button will be disabled if validation fails.
- **Capacity Limit**:
  - The "Create Flashcard" button in the `Toolbar` will be disabled if `userStats.total_flashcards >= userStats.flashcard_limit`.
  - A tooltip will inform the user why the button is disabled.
- **Bulk Actions**:
  - The "Delete Selected" button will only be visible and enabled in the `Toolbar` if one or more flashcards are selected.

## 10. Error Handling

- **API Fetch Errors**: If the initial `GET` request fails, a full-page error message will be shown with a "Retry" button.
- **Mutation Errors (Create/Update/Delete)**:
  - For create/update errors, a message will be displayed within the `FlashcardFormDialog`.
  - For delete errors, the optimistically removed card(s) will be restored to the list and an error toast will be displayed.
- **Specific HTTP Statuses**:
  - `401 Unauthorized`: A global HTTP interceptor should redirect the user to the login page.
  - `403 Forbidden`: On creation attempt, show a toast: "You have reached your flashcard limit."
  - `404 Not Found`: On edit/delete, remove the item from the list and show a toast: "This flashcard no longer exists."

## 11. Implementation Steps

1.  **Create File Structure**: Create the new directory `src/components/flashcards-library/` and placeholder files for the components listed above. Create `src/pages/flashcards.astro`.
2.  **Astro Page Setup**: Implement `src/pages/flashcards.astro` to render the `Layout` and the main `<FlashcardsLibrary client:load />` component. Ensure `prerender = false`.
3.  **Implement `useFlashcardsLibrary` Hook**: Set up the custom hook with state management for `queryParams`, `isLoading`, and `error`. Implement the initial data fetching logic using `useEffect`.
4.  **Build Static Components**: Implement the stateless UI components: `Toolbar`, `CapacityIndicator`, `FlashcardList`, `FlashcardItem`, `Pagination`. Pass props down from the `FlashcardsLibrary` component.
5.  **Wire up State and Handlers**: In `FlashcardsLibrary.tsx`, connect the `useFlashcardsLibrary` hook to the UI components. Wire up handlers for search, sort, and pagination to update the hook's state.
6.  **Implement Create/Edit Flow**:
    - Build the `FlashcardFormDialog` component with internal form management and validation (e.g., using `react-hook-form` with `Zod`).
    - Implement the `createFlashcard` and `updateFlashcard` methods in the hook.
    - Add state to `FlashcardsLibrary` to manage the dialog's visibility and mode ('create' or 'edit').
7.  **Implement Delete Flow**:
    - Implement the `deleteFlashcard` and `deleteSelectedFlashcards` methods in the hook.
    - Add logic for the `ConfirmationDialog`.
    - Implement the client-side "Undo" feature using a toast library (e.g., `sonner`) and `setTimeout`.
8.  **Refine UI and State**:
    - Implement `localStorage` persistence for `viewMode`.
    - Implement URL synchronization for `queryParams`.
    - Add loading skeletons/spinners for a better user experience during data fetching.
    - Polish styles using Tailwind CSS and ensure responsiveness.
9.  **Testing**: Write unit tests for the `useFlashcardsLibrary` hook and integration tests for the `FlashcardsLibrary` component to verify user interactions and data flow.
