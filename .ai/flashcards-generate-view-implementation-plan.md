# View Implementation Plan: Generate Flashcards

## 1. Overview

The Generate Flashcards view is an AI-powered interface that allows users to transform study material text (1,000-10,000 characters) into flashcards automatically. The view provides a multi-step workflow: text input with validation → AI generation with loading feedback → card review interface with individual and bulk actions → success confirmation. Users can accept, reject, or edit generated cards before saving them to their collection.

## 2. View Routing

**Path:** `/generate`

This page should be accessible from:

- Main navigation menu
- Dashboard (primary action button)
- After manual flashcard creation (alternative generation option)
- Error states suggesting AI generation as an alternative

## 3. Component Structure

```
GenerateFlashcardsPage (Astro)
└── FlashcardGenerator (React) [main orchestrating component]
    ├── FlashcardGeneratorForm (React) [input phase]
    │   ├── Textarea (Shadcn/ui)
    │   ├── CharacterCounter (React)
    │   └── Button (Shadcn/ui) [Generate]
    │
    ├── LoadingIndicator (React) [generation phase]
    │
    ├── ErrorDisplay (React) [error state]
    │   ├── Alert (Shadcn/ui)
    │   └── Action Buttons (Shadcn/ui)
    │
    ├── CardReviewSection (React) [review phase]
    │   ├── BulkActionBar (React)
    │   │   ├── ActionSummary (React)
    │   │   ├── Button [Accept All]
    │   │   ├── Button [Reject All]
    │   │   └── Button [Save Decisions]
    │   │
    │   └── CardReviewGrid (React)
    │       └── GeneratedCardItem (React) [multiple instances]
    │           ├── Card (Shadcn/ui)
    │           ├── Badge [status indicator]
    │           └── CardActions
    │               ├── Button [Accept]
    │               ├── Button [Edit]
    │               └── Button [Reject]
    │
    ├── EditCardModal (React) [edit phase]
    │   └── Dialog (Shadcn/ui)
    │       ├── Textarea [Front Text]
    │       ├── CharacterCounter
    │       ├── Textarea [Back Text]
    │       ├── CharacterCounter
    │       └── DialogActions
    │           ├── Button [Cancel]
    │           └── Button [Save]
    │
    └── SuccessConfirmation (React) [completion phase]
        └── Dialog (Shadcn/ui)
            ├── Statistics Display
            └── DialogActions
                ├── Button [View Flashcards]
                └── Button [Generate More]
```

## 4. Component Details

### 4.1 GenerateFlashcardsPage (Astro)

**Purpose:** Static page wrapper providing layout structure and SEO metadata.

**Main elements:**

- Page layout with header and main content area
- Meta tags for SEO (title, description)
- Client-side React component container

**Handled events:** None (static container)

**Validation:** None

**Types:** None

**Props:** None (root page component)

---

### 4.2 FlashcardGenerator (React)

**Purpose:** Main orchestrating component managing the entire generation and review workflow. Handles state management, API calls, and phase transitions.

**Main elements:**

- Conditionally renders child components based on workflow phase
- Manages global state for the generation process
- Coordinates API interactions

**Handled events:**

- Generation submission
- Review submission
- Reset/retry actions
- Phase transitions

**Validation:**

- Overall workflow state consistency
- Prevents double submissions
- Ensures all cards reviewed before review submission

**Types:**

- `GenerationState` (ViewModel)
- `CardReviewState[]` (ViewModel)
- `GenerateFlashcardsResponse` (DTO)
- `ReviewFlashcardsResponse` (DTO)
- `ApiError` (DTO)

**Props:** None (root component for this feature)

---

### 4.3 FlashcardGeneratorForm (React)

**Purpose:** Text input interface with real-time validation and generation trigger.

**Main elements:**

- `<form>` element with onSubmit handler
- `<Textarea>` (Shadcn) for text input
- `<CharacterCounter>` component showing validation status
- `<Button>` (Shadcn) to trigger generation
- Instructions/help text explaining requirements

**Handled events:**

- `onChange`: Updates input text state, triggers character count recalculation
- `onSubmit`: Validates and initiates flashcard generation API call

**Validation:**

- Input text length must be 1,000-10,000 characters (after trim)
- Real-time character count with status indicators
- Form submission prevented when validation fails
- Generate button disabled when invalid

**Types:**

- `inputText: string` (local state)
- `charCount: CharacterCountState` (ViewModel)
- `isGenerating: boolean` (from parent)
- `onGenerate: (text: string) => Promise<void>` (callback)

**Props:**

```typescript
interface FlashcardGeneratorFormProps {
  inputText: string;
  onInputChange: (text: string) => void;
  onGenerate: (text: string) => Promise<void>;
  isGenerating: boolean;
  isDisabled: boolean;
}
```

---

### 4.4 CharacterCounter (React)

**Purpose:** Display character count with color-coded validation feedback.

**Main elements:**

- `<div>` with aria-live="polite" for screen reader announcements
- Current count display
- Validation status message
- Color-coded styling based on status

**Handled events:** None (display only)

**Validation:** None (receives validation state as props)

**Types:**

- `CharacterCountState` (ViewModel)

**Props:**

```typescript
interface CharacterCounterProps {
  current: number;
  min: number;
  max: number;
  status: "too-short" | "valid" | "warning" | "too-long";
  className?: string;
}
```

---

### 4.5 LoadingIndicator (React)

**Purpose:** Display loading state during API operations with accessibility support.

**Main elements:**

- `<div>` with role="status" and aria-live="polite"
- Spinner animation
- Loading message text
- Optional progress indicator

**Handled events:** None

**Validation:** None

**Types:**

- `message?: string` (optional prop)

**Props:**

```typescript
interface LoadingIndicatorProps {
  message?: string;
  className?: string;
}
```

---

### 4.6 ErrorDisplay (React)

**Purpose:** Display error messages with contextual actions based on error type.

**Main elements:**

- `<Alert>` component (Shadcn) with error styling
- Error title and message
- Detailed error information (if available)
- Action buttons based on error type:
  - Retry button (for 503 errors)
  - Manual creation link (for 429 errors)
  - Delete flashcards link (for 403 limit errors)
  - Contact support link (for persistent issues)

**Handled events:**

- `onRetry`: Retry the failed operation
- `onDismiss`: Dismiss error message
- `onNavigate`: Navigate to alternative paths

**Validation:** None

**Types:**

- `ApiError` (DTO)
- `errorType: 'generation' | 'review'` (determines available actions)

**Props:**

```typescript
interface ErrorDisplayProps {
  error: ApiError;
  onRetry?: () => void;
  onDismiss?: () => void;
  preservedInput?: string; // Show that input was preserved
}
```

---

### 4.7 CardReviewSection (React)

**Purpose:** Container for card review interface, including bulk actions and card grid.

**Main elements:**

- `<BulkActionBar>` at the top
- `<CardReviewGrid>` displaying all cards
- Section heading with instructions

**Handled events:**

- Delegates to child components

**Validation:**

- Receives validation state from parent hook (canSubmit)
- Validation ensures all cards reviewed (no pending cards)

**Types:**

- `GeneratedCardPreview[]` (from API)
- `CardReviewState[]` (ViewModel)

**Props:**

```typescript
interface CardReviewSectionProps {
  cards: GeneratedCardPreview[];
  reviewStates: CardReviewState[];
  onAccept: (index: number) => void;
  onReject: (index: number) => void;
  onEdit: (index: number) => void;
  onAcceptAll: () => void;
  onRejectAll: () => void;
  onSubmit: () => Promise<void>;
  isSubmitting: boolean;
  canSubmit: boolean; // Passed from parent hook
}
```

---

### 4.8 BulkActionBar (React)

**Purpose:** Provide summary statistics and bulk action controls.

**Main elements:**

- `<div>` container with flex layout
- Statistics summary showing accepted/rejected/edited/pending counts
- "Accept All" button
- "Reject All" button
- "Save Decisions" primary button (disabled when there are pending cards)
- Warning message when there are pending cards to review

**Handled events:**

- `onClick` for Accept All button: Marks all pending cards as accepted
- `onClick` for Reject All button: Marks all pending cards as rejected
- `onClick` for Save Decisions button: Submits review decisions to API

**Validation:**

- ALL cards must be reviewed (pending count === 0)
- Save button disabled when validation fails
- Display warning message when pending cards exist:
  - If pending > 0: "Please review all X pending card(s) before saving"

**Types:**

- `BulkActionSummary` (ViewModel)
- `cardReviews: CardReviewState[]` (from parent)

**Props:**

```typescript
interface BulkActionBarProps {
  summary: BulkActionSummary; // { total, accepted, rejected, edited, pending }
  onAcceptAll: () => void;
  onRejectAll: () => void;
  onSubmit: () => Promise<void>;
  isSubmitting: boolean;
  canSubmit: boolean; // all cards reviewed (pending === 0)
}
```

---

### 4.9 CardReviewGrid (React)

**Purpose:** Display generated cards in a responsive grid layout.

**Main elements:**

- Grid container with responsive columns (1 on mobile, 2 on tablet, 3 on desktop)
- Multiple `<GeneratedCardItem>` components
- Empty state message if no cards

**Handled events:**

- Delegates card-specific events to parent

**Validation:** None (delegates to child components)

**Types:**

- `GeneratedCardPreview[]` (DTO)
- `CardReviewState[]` (ViewModel)

**Props:**

```typescript
interface CardReviewGridProps {
  cards: GeneratedCardPreview[];
  reviewStates: CardReviewState[];
  onAccept: (index: number) => void;
  onReject: (index: number) => void;
  onEdit: (index: number) => void;
}
```

---

### 4.10 GeneratedCardItem (React)

**Purpose:** Display individual card with both front and back text visible and action buttons.

**Main elements:**

- `<Card>` component (Shadcn) with conditional styling based on action state
- Badge showing current status (Pending/Accepted/Rejected/Edited)
- Card content area displaying both front and back text simultaneously
- Front text display (always visible)
- Back text display (always visible)
- Action buttons container with:
  - "Accept" button (green, check icon) - always enabled
  - "Edit" button (blue, pencil icon) - always enabled
  - "Reject" button (red, X icon) - always enabled
- Visual feedback for current action state (border color, opacity)
- All buttons remain enabled to allow users to change their decisions at any time

**Handled events:**

- `onClick` (Accept button): Marks card as accepted, clears any edited text, triggers onAccept callback
- `onClick` (Edit button): Opens edit modal with card data, triggers onEdit callback
- `onClick` (Reject button): Marks card as rejected, clears any edited text, triggers onReject callback

**Validation:** None (actions only)

**Types:**

- `GeneratedCardPreview` (DTO)
- `CardReviewState` (ViewModel)

**Props:**

```typescript
interface GeneratedCardItemProps {
  card: GeneratedCardPreview;
  reviewState: CardReviewState;
  onAccept: (index: number) => void;
  onReject: (index: number) => void;
  onEdit: (index: number) => void;
}
```

---

### 4.11 EditCardModal (React)

**Purpose:** Modal dialog for editing card text with validation.

**Main elements:**

- `<Dialog>` component (Shadcn) with modal backdrop
- Dialog title "Edit Flashcard"
- Form containing:
  - Label and `<Textarea>` for front text
  - `<CharacterCounter>` for front (10-500 chars)
  - Label and `<Textarea>` for back text
  - `<CharacterCounter>` for back (10-1,000 chars)
  - Validation error messages (inline)
- Dialog footer with:
  - "Cancel" button (secondary)
  - "Save Changes" button (primary, disabled when invalid)

**Handled events:**

- `onChange` (front textarea): Updates front text state, recalculates character count
- `onChange` (back textarea): Updates back text state, recalculates character count
- `onClick` (Cancel): Closes modal without saving, resets state
- `onClick` (Save): Validates and saves changes if valid, triggers onSave callback

**Validation:**

- Front text must be 10-500 characters (after trim)
- Back text must be 10-1,000 characters (after trim)
- Both fields required
- Real-time validation with character counters
- Save button disabled when either field invalid
- Display inline error messages for invalid fields

**Types:**

- `EditModalState` (ViewModel)
- `CharacterCountState` (for front and back)
- `GeneratedCardPreview` (for initial values)

**Props:**

```typescript
interface EditCardModalProps {
  isOpen: boolean;
  card: GeneratedCardPreview | null;
  onSave: (index: number, frontText: string, backText: string) => void;
  onCancel: () => void;
}
```

---

### 4.12 SuccessConfirmation (React)

**Purpose:** Display success message with statistics and navigation options after saving.

**Main elements:**

- `<Dialog>` component (Shadcn) with success styling
- Success icon and title "Flashcards Created!"
- Statistics summary:
  - Total cards created
  - Cards accepted without changes
  - Cards edited
  - Cards rejected
- Navigation buttons:
  - "View My Flashcards" (primary) - navigates to /flashcards
  - "Generate More" (secondary) - resets form for new generation

**Handled events:**

- `onClick` (View Flashcards): Navigates to flashcards list page
- `onClick` (Generate More): Resets state, closes modal, returns to input form

**Validation:** None

**Types:**

- `ReviewFlashcardsResponse` (DTO)

**Props:**

```typescript
interface SuccessConfirmationProps {
  isOpen: boolean;
  result: ReviewFlashcardsResponse;
  onViewFlashcards: () => void;
  onGenerateMore: () => void;
}
```

## 5. Types

### 5.1 Existing DTOs (from types.ts)

These types are already defined and should be imported:

```typescript
// Request/Response types
import type {
  GenerateFlashcardsCommand,
  GenerateFlashcardsResponse,
  GeneratedCardPreview,
  ReviewFlashcardsCommand,
  ReviewDecision,
  ReviewFlashcardsResponse,
  FlashcardDTO,
  ApiError,
} from "@/types";
```

**GenerateFlashcardsCommand:**

```typescript
interface GenerateFlashcardsCommand {
  input_text: string; // 1000-10000 characters
}
```

**GenerateFlashcardsResponse:**

```typescript
interface GenerateFlashcardsResponse {
  batch_id: string; // UUID
  generated_at: string; // ISO timestamp
  input_text_length: number;
  generated_cards: GeneratedCardPreview[];
  total_cards_generated: number;
  time_taken_ms: number;
  model_used: string; // e.g., "anthropic/claude-3-haiku"
}
```

**GeneratedCardPreview:**

```typescript
interface GeneratedCardPreview {
  index: number; // 0-based index
  front_text: string;
  back_text: string;
}
```

**ReviewFlashcardsCommand:**

```typescript
interface ReviewFlashcardsCommand {
  decisions: ReviewDecision[];
}
```

**ReviewDecision:**

```typescript
interface ReviewDecision {
  index: number; // matches GeneratedCardPreview.index
  action: "accept" | "reject" | "edit";
  front_text: string; // always provided (original for accept, edited for edit)
  back_text: string; // always provided (original for accept, edited for edit)
}
```

**ReviewFlashcardsResponse:**

```typescript
interface ReviewFlashcardsResponse {
  batch_id: string;
  cards_accepted: number;
  cards_rejected: number;
  cards_edited: number;
  created_flashcards: FlashcardDTO[];
}
```

**ApiError:**

```typescript
interface ApiError {
  error: string; // Error code
  message: string; // Human-readable message
  details?: {
    // Validation errors
    field: string;
    message: string;
    received_length?: number;
  }[];
  current_count?: number; // For limit errors
  limit?: number; // For limit errors
  suggestion?: string; // Helpful suggestion
}
```

### 5.2 New ViewModels

These types should be created for the view implementation:

**CharacterCountState:**

```typescript
interface CharacterCountState {
  current: number; // Current character count (trimmed)
  min: number; // Minimum allowed characters
  max: number; // Maximum allowed characters
  isValid: boolean; // Whether count is within valid range
  status: "too-short" | "valid" | "warning" | "too-long";
  // too-short: current < min
  // valid: min <= current <= max * 0.9
  // warning: max * 0.9 < current <= max
  // too-long: current > max
}
```

_Purpose:_ Encapsulates character count validation logic with UI status indicators.

**CardReviewState:**

```typescript
interface CardReviewState {
  index: number; // Matches GeneratedCardPreview.index
  action: "pending" | "accept" | "reject" | "edit";
  // pending: no decision yet
  // accept: user accepted card as-is (clears editedCard)
  // reject: user rejected card (clears editedCard)
  // edit: user edited card
  originalCard: GeneratedCardPreview; // Original generated card
  editedCard?: GeneratedCardPreview; // Modified card (when action === 'edit'), cleared when accepting/rejecting
  isFlipped: boolean; // Legacy field, not used for display (both sides shown simultaneously)
}
```

_Purpose:_ Tracks review state for each individual card including user decisions and UI state. Note that cards now display both front and back text simultaneously rather than requiring flipping.

**GenerationState (Discriminated Union):**

```typescript
type GenerationState =
  | { status: "idle" } // Initial state, ready for input
  | { status: "generating" } // API call in progress
  | { status: "reviewing"; data: GenerateFlashcardsResponse } // Showing review interface
  | { status: "submitting" } // Submitting review decisions
  | { status: "success"; data: ReviewFlashcardsResponse } // Successfully saved
  | { status: "error"; error: ApiError; phase: "generation" | "review" }; // Error occurred
```

_Purpose:_ Represents the entire workflow state machine, ensuring type-safe state transitions.

**EditModalState:**

```typescript
interface EditModalState {
  isOpen: boolean; // Whether modal is visible
  cardIndex: number | null; // Index of card being edited (null when closed)
  frontText: string; // Current front text in editor
  backText: string; // Current back text in editor
  frontValidation: CharacterCountState; // Front text validation state
  backValidation: CharacterCountState; // Back text validation state
  hasChanges: boolean; // Whether text differs from original
}
```

_Purpose:_ Manages all state related to the edit modal including validation.

**BulkActionSummary:**

```typescript
interface BulkActionSummary {
  total: number; // Total cards generated
  accepted: number; // Cards with action 'accept'
  rejected: number; // Cards with action 'reject'
  edited: number; // Cards with action 'edit'
  pending: number; // Cards with action 'pending'
}
```

_Purpose:_ Summary statistics for bulk action bar display and validation.

## 6. State Management

### 6.1 State Architecture

The view uses a **centralized custom hook** pattern with the following state structure:

**Primary Hook: `useFlashcardGeneration()`**

This custom hook encapsulates all generation and review logic, providing a clean interface to components.

```typescript
function useFlashcardGeneration() {
  // Core state
  const [inputText, setInputText] = useState<string>("");
  const [generationState, setGenerationState] = useState<GenerationState>({ status: "idle" });
  const [cardReviews, setCardReviews] = useState<CardReviewState[]>([]);
  const [editModalState, setEditModalState] = useState<EditModalState>({
    isOpen: false,
    cardIndex: null,
    frontText: "",
    backText: "",
    frontValidation: {
      /* ... */
    },
    backValidation: {
      /* ... */
    },
    hasChanges: false,
  });

  // Derived state (computed values)
  const charCount = useCharacterCount(inputText, 1000, 10000);
  const bulkSummary = useMemo(() => calculateBulkSummary(cardReviews), [cardReviews]);
  const canGenerate = charCount.isValid && generationState.status === "idle";
  const canSubmitReview = bulkSummary.pending === 0; // All cards must be reviewed

  // API functions
  const generateFlashcards = async () => {
    /* ... */
  };
  const submitReview = async () => {
    /* ... */
  };

  // Card action functions
  const acceptCard = (index: number) => {
    /* Sets action to 'accept', clears editedCard */
  };
  const rejectCard = (index: number) => {
    /* Sets action to 'reject', clears editedCard */
  };
  const editCard = (index: number, frontText: string, backText: string) => {
    /* Sets action to 'edit', stores editedCard */
  };
  const acceptAll = () => {
    /* Sets all pending cards to 'accept' */
  };
  const rejectAll = () => {
    /* Sets all pending cards to 'reject' */
  };

  // Modal functions
  const openEditModal = (index: number) => {
    /* ... */
  };
  const closeEditModal = () => {
    /* ... */
  };
  const saveEdit = () => {
    /* ... */
  };

  // Reset function
  const reset = () => {
    /* ... */
  };

  return {
    // State
    inputText,
    setInputText,
    charCount,
    generationState,
    cardReviews,
    editModalState,
    bulkSummary,
    canGenerate,
    canSubmitReview,

    // Actions
    generateFlashcards,
    acceptCard,
    rejectCard,
    openEditModal,
    closeEditModal,
    saveEdit,
    acceptAll,
    rejectAll,
    submitReview,
    reset,
  };
}
```

### 6.2 Supporting Hook: `useCharacterCount()`

Reusable hook for character count validation:

```typescript
function useCharacterCount(text: string, min: number, max: number): CharacterCountState {
  return useMemo(() => {
    const current = text.trim().length;
    const isValid = current >= min && current <= max;

    let status: CharacterCountState["status"];
    if (current < min) status = "too-short";
    else if (current > max) status = "too-long";
    else if (current > max * 0.9) status = "warning";
    else status = "valid";

    return { current, min, max, isValid, status };
  }, [text, min, max]);
}
```

### 6.3 State Flow

**Phase 1: Input (idle)**

- User types in textarea → `setInputText` updates
- `useCharacterCount` recalculates validation
- Generate button enabled/disabled based on `canGenerate`

**Phase 2: Generation (generating)**

- User clicks Generate → `generateFlashcards()` called
- State changes to `{ status: 'generating' }`
- Loading indicator displays
- On success: State changes to `{ status: 'reviewing', data: response }`
- On error: State changes to `{ status: 'error', error: apiError, phase: 'generation' }`

**Phase 3: Review (reviewing)**

- `cardReviews` initialized from `generationState.data.generated_cards`
- User interactions update individual `CardReviewState` objects
- Bulk actions update multiple cards at once
- `bulkSummary` recalculated on each change
- Save button enabled when `canSubmitReview === true`

**Phase 4: Submission (submitting)**

- User clicks Save Decisions → `submitReview()` called
- State changes to `{ status: 'submitting' }`
- Loading indicator displays
- On success: State changes to `{ status: 'success', data: response }`
- On error: State changes to `{ status: 'error', error: apiError, phase: 'review' }`

**Phase 5: Completion (success)**

- Success modal displays with statistics
- User can navigate to flashcards list or reset for new generation
- `reset()` returns to idle state

### 6.4 State Persistence

**During errors:**

- `inputText` is preserved to allow retry
- `cardReviews` is preserved during review submission errors
- Only reset on explicit user action (reset button or successful completion)

**Edit modal:**

- Local state for text fields during editing
- Changes only applied to `cardReviews` when user clicks Save
- Cancel button discards local changes

## 7. API Integration

### 7.1 Generate Flashcards Endpoint

**Endpoint:** `POST /api/flashcards/batch`

**Request Type:** `GenerateFlashcardsCommand`

```typescript
{
  input_text: string; // 1000-10000 characters (trimmed)
}
```

**Response Type:** `GenerateFlashcardsResponse`

```typescript
{
  batch_id: string,
  generated_at: string,
  input_text_length: number,
  generated_cards: GeneratedCardPreview[],
  total_cards_generated: number,
  time_taken_ms: number,
  model_used: string
}
```

**Implementation:**

```typescript
async function generateFlashcards() {
  try {
    setGenerationState({ status: "generating" });

    const response = await fetch("/api/flashcards/batch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        input_text: inputText.trim(),
      } satisfies GenerateFlashcardsCommand),
    });

    if (!response.ok) {
      const error: ApiError = await response.json();
      throw error;
    }

    const data: GenerateFlashcardsResponse = await response.json();

    // Initialize card review states
    const initialReviews: CardReviewState[] = data.generated_cards.map((card) => ({
      index: card.index,
      action: "pending",
      originalCard: card,
      isFlipped: false,
    }));

    setCardReviews(initialReviews);
    setGenerationState({ status: "reviewing", data });
  } catch (error) {
    const apiError = error as ApiError;
    setGenerationState({
      status: "error",
      error: apiError,
      phase: "generation",
    });
  }
}
```

**Error Responses:**

- **400 Bad Request:** Invalid input length or format
- **429 Too Many Requests:** AI generation budget limit reached
- **503 Service Unavailable:** AI service temporarily unavailable

### 7.2 Submit Review Endpoint

**Endpoint:** `POST /api/flashcards/batch/:batchId/review`

**Request Type:** `ReviewFlashcardsCommand`

```typescript
{
  decisions: ReviewDecision[] // Array of review decisions
}
```

**Response Type:** `ReviewFlashcardsResponse`

```typescript
{
  batch_id: string,
  cards_accepted: number,
  cards_rejected: number,
  cards_edited: number,
  created_flashcards: FlashcardDTO[]
}
```

**Implementation:**

```typescript
async function submitReview() {
  if (generationState.status !== "reviewing") return;

  try {
    setGenerationState({
      status: "submitting",
      // Preserve data for potential retry
    });

    // Build decisions array from cardReviews
    const decisions: ReviewDecision[] = cardReviews
      .filter((review) => review.action !== "pending")
      .map((review) => {
        const card = review.action === "edit" ? review.editedCard! : review.originalCard;
        return {
          index: review.index,
          action: review.action as "accept" | "reject" | "edit",
          front_text: card.front_text,
          back_text: card.back_text,
        };
      });

    const response = await fetch(`/api/flashcards/batch/${generationState.data.batch_id}/review`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        decisions,
      } satisfies ReviewFlashcardsCommand),
    });

    if (!response.ok) {
      const error: ApiError = await response.json();
      throw error;
    }

    const data: ReviewFlashcardsResponse = await response.json();
    setGenerationState({ status: "success", data });
  } catch (error) {
    const apiError = error as ApiError;
    setGenerationState({
      status: "error",
      error: apiError,
      phase: "review",
    });
  }
}
```

**Error Responses:**

- **400 Bad Request:** Invalid decisions format or validation errors
- **403 Forbidden:** Accepting cards would exceed 500 card limit
- **404 Not Found:** Batch not found or doesn't belong to user
- **409 Conflict:** Batch already reviewed

## 8. User Interactions

### 8.1 Text Input Interaction

**Action:** User types in textarea

**Handler:** `onChange` event on textarea → `setInputText(value)`

**Immediate Effects:**

- Input text state updates
- Character counter recalculates and updates display
- Character counter color changes based on validation status
- Generate button enabled/disabled state updates

**Validation Feedback:**

- Red counter + disabled button: < 1,000 chars or > 10,000 chars
- Yellow counter: > 9,000 chars (warning)
- Green counter + enabled button: 1,000-9,000 chars

### 8.2 Generate Flashcards Interaction

**Action:** User clicks "Generate Flashcards" button

**Preconditions:**

- Input text length is 1,000-10,000 characters
- Not currently generating (button disabled during generation)

**Handler:** `onClick` → `generateFlashcards()`

**Flow:**

1. Button becomes disabled
2. Loading indicator appears with message "Generating flashcards..."
3. API call to POST /api/flashcards/batch
4. On success:
   - Loading indicator disappears
   - Card review grid appears with all generated cards
   - Bulk action bar displays
   - All cards initially in "pending" state
5. On error:
   - Loading indicator disappears
   - Error display appears with appropriate message and actions
   - Input text preserved for retry

### 8.3 Accept Card Interaction

**Action:** User clicks "Accept" button on a card

**Handler:** `onClick` → `acceptCard(index)`

**Effects:**

- Card action changes to 'accept' (from any previous state)
- Any edited text is cleared, restoring original card content
- Visual feedback: green border, checkmark icon
- Bulk summary updates accordingly
- All action buttons remain enabled for changing decision
- Save Decisions button becomes enabled when all cards reviewed

### 8.4 Reject Card Interaction

**Action:** User clicks "Reject" button on a card

**Handler:** `onClick` → `rejectCard(index)`

**Effects:**

- Card action changes to 'reject' (from any previous state)
- Any edited text is cleared, restoring original card content
- Visual feedback: red border, reduced opacity, X icon
- Bulk summary updates accordingly
- All action buttons remain enabled for changing decision
- Card excluded from final save

### 8.6 Edit Card Interaction

**Action:** User clicks "Edit" button on a card

**Handler:** `onClick` → `openEditModal(index)`

**Effects:**

- Edit modal opens
- Modal pre-filled with card's current text (original or previously edited)
- Both textareas and character counters display
- Focus moves to front text field

**Edit Modal Sub-interactions:**

**8.6a Text Editing:**

- User types in textareas
- Character counters update in real-time
- Save button disabled if either field invalid
- Inline validation errors display below fields

**8.6b Save Changes:**

- User clicks "Save Changes" button
- Validation checks both fields
- If valid:
  - Modal closes
  - Card action changes to 'edit'
  - Edited text displayed on card
  - Visual feedback: blue border, pencil icon
  - Bulk summary updates: pending count -1, edited count +1
- If invalid:
  - Modal remains open
  - Validation errors highlighted

**8.6c Cancel Edit:**

- User clicks "Cancel" button or closes modal
- Modal closes without saving changes
- Card state unchanged
- Local edit state discarded

### 8.7 Accept All Interaction

**Action:** User clicks "Accept All" button in bulk action bar

**Handler:** `onClick` → `acceptAll()`

**Effects:**

- All cards with 'pending' action change to 'accept'
- Visual feedback: all cards show green border, checkmarks
- Bulk summary updates: all pending → accepted
- Save Decisions button becomes enabled

### 8.8 Reject All Interaction

**Action:** User clicks "Reject All" button in bulk action bar

**Handler:** `onClick` → `rejectAll()`

**Effects:**

- All cards with 'pending' action change to 'reject'
- Visual feedback: all cards show red border, reduced opacity
- Bulk summary updates: all pending → rejected
- Save Decisions button becomes enabled (all cards reviewed)

### 8.9 Save Decisions Interaction

**Action:** User clicks "Save Decisions" button

**Preconditions:**

- All cards have been reviewed (no pending cards)
- Not currently submitting

**Handler:** `onClick` → `submitReview()`

**Flow:**

1. Button becomes disabled
2. Loading indicator appears with message "Saving flashcards..."
3. Build decisions array from card reviews
4. API call to POST /api/flashcards/batch/:batchId/review
5. On success:
   - Loading indicator disappears
   - Success confirmation modal appears
   - Statistics displayed (accepted, rejected, edited counts)
   - Options to view flashcards or generate more
6. On error (403 - limit exceeded):
   - Loading indicator disappears
   - Error displays with current count and limit
   - Suggestions to reject more cards or delete existing flashcards
   - Card reviews preserved for modification
7. On other errors:
   - Error display with appropriate message and actions

### 8.10 Success Modal Interactions

**8.10a View Flashcards:**

- User clicks "View My Flashcards" button
- Navigation to `/flashcards` page
- User sees their complete flashcard collection including newly created cards

**8.10b Generate More:**

- User clicks "Generate More" button
- Success modal closes
- State resets to idle
- Form clears and ready for new input
- Focus moves to textarea

### 8.11 Error Recovery Interactions

**8.11a Retry Generation:**

- User clicks "Retry" button in error display (503 errors)
- Error clears
- `generateFlashcards()` called again with preserved input
- Loading indicator appears

**8.11b Manual Creation (Budget Limit):**

- User clicks "Create Manually" link (429 errors)
- Navigation to `/flashcards/create` page
- Input text can be copied if user wishes

**8.11c Delete Flashcards (Limit Exceeded):**

- User clicks "Manage Flashcards" link (403 errors)
- Navigation to `/flashcards` page
- User can delete cards to free up space
- Can return to generation page to retry

**8.11d Dismiss Error:**

- User clicks "Dismiss" or close button
- Error display clears
- Returns to previous state (input form or review grid)

## 9. Conditions and Validation

### 9.1 Input Text Validation

**Condition:** Input text must be 1,000-10,000 characters after trimming whitespace.

**Components Affected:**

- FlashcardGeneratorForm
- CharacterCounter

**Validation Logic:**

```typescript
const trimmedLength = inputText.trim().length;
const isValid = trimmedLength >= 1000 && trimmedLength <= 10000;
```

**UI Effects:**

- **Too Short (< 1,000):**
  - Character counter: Red text
  - Message: "Minimum 1,000 characters required"
  - Generate button: Disabled
  - Button tooltip: "Enter at least 1,000 characters"

- **Valid (1,000-9,000):**
  - Character counter: Green text
  - Message: "X / 10,000 characters"
  - Generate button: Enabled

- **Warning (9,000-10,000):**
  - Character counter: Yellow text
  - Message: "X / 10,000 characters (approaching limit)"
  - Generate button: Enabled

- **Too Long (> 10,000):**
  - Character counter: Red text
  - Message: "Maximum 10,000 characters exceeded"
  - Generate button: Disabled
  - Button tooltip: "Reduce to 10,000 characters or less"

**Accessibility:**

- Character counter has `aria-live="polite"` for screen reader updates
- Generate button has `aria-disabled` with descriptive label

### 9.2 All Cards Reviewed

**Condition:** Before submitting review, ALL cards must be reviewed (no pending cards).

**Components Affected:**

- BulkActionBar
- FlashcardGenerator (submitReview function)
- CardReviewSection

**Validation Logic:**

```typescript
const canSubmitReview = bulkSummary.pending === 0; // All cards must be reviewed
```

**UI Effects:**

- **Cards Still Pending:**
  - Save Decisions button: Disabled
  - Warning message displayed: "Please review all X pending card(s) before saving"
  - Button tooltip: "Review all X pending card(s) first"

- **All Cards Reviewed:**
  - Save Decisions button: Enabled
  - Warning message hidden
  - Button tooltip: "Save decisions for X card(s)"

**Edge Cases:**

- If user has pending cards → shows pending count warning and button disabled
- If user rejects all cards → button enabled (users can submit with all rejected)
- If user clicks "Reject All" → button enabled immediately
- User can change any decision at any time before saving

### 9.3 Edit Modal Validation

**Condition:** Front text 10-500 characters, back text 10-1,000 characters (both trimmed).

**Components Affected:**

- EditCardModal
- CharacterCounter (within modal)

**Validation Logic:**

```typescript
const frontValid = frontText.trim().length >= 10 && frontText.trim().length <= 500;
const backValid = backText.trim().length >= 10 && backText.trim().length <= 1000;
const canSave = frontValid && backValid;
```

**UI Effects:**

**Front Text:**

- **Too Short (< 10):**
  - Counter: Red, "Minimum 10 characters"
  - Inline error: "Front text must be at least 10 characters"
  - Save button: Disabled

- **Valid (10-450):**
  - Counter: Green, "X / 500 characters"
  - No error message
  - Check passed for Save button

- **Warning (450-500):**
  - Counter: Yellow, "X / 500 characters"
  - No error message
  - Check passed for Save button

- **Too Long (> 500):**
  - Counter: Red, "Maximum 500 characters exceeded"
  - Inline error: "Front text must not exceed 500 characters"
  - Save button: Disabled

**Back Text:**

- **Too Short (< 10):**
  - Counter: Red, "Minimum 10 characters"
  - Inline error: "Back text must be at least 10 characters"
  - Save button: Disabled

- **Valid (10-900):**
  - Counter: Green, "X / 1,000 characters"
  - No error message
  - Check passed for Save button

- **Warning (900-1,000):**
  - Counter: Yellow, "X / 1,000 characters"
  - No error message
  - Check passed for Save button

- **Too Long (> 1,000):**
  - Counter: Red, "Maximum 1,000 characters exceeded"
  - Inline error: "Back text must not exceed 1,000 characters"
  - Save button: Disabled

**Save Button State:**

- Disabled when either field invalid
- Enabled only when both fields valid
- Displays tooltip explaining why disabled if applicable

### 9.4 UUID Validation

**Condition:** Batch ID must be valid UUID format.

**Components Affected:**

- FlashcardGenerator (submitReview function)

**Validation Logic:**
This is handled automatically by using the batch_id from the API response. No manual validation needed on frontend, but API validates and returns 400 if invalid.

**Error Handling:**

- 400 error from API: Display "Invalid batch ID format"
- Should not occur in normal flow (only if manually manipulating URLs)

### 9.5 Flashcard Limit (500 cards)

**Condition:** User cannot exceed 500 total flashcards.

**Components Affected:**

- FlashcardGenerator (error handling)
- ErrorDisplay

**Validation Logic:**
This is enforced by the API. Frontend handles the error response.

**API Response (403):**

```typescript
{
  error: "FLASHCARD_LIMIT_EXCEEDED",
  message: "Cannot accept X cards. Would exceed limit of 500.",
  current_count: 485,
  limit: 500,
  suggestion: "Delete some existing flashcards or reject more generated cards"
}
```

**UI Effects:**

- Error alert displays with clear message
- Shows current count: "You have 485 flashcards"
- Shows limit: "Limit: 500 flashcards"
- Shows attempted addition: "Attempted to add 20 more"
- Suggestions:
  - "Reject some cards in this batch to accept fewer"
  - "Delete existing flashcards to free up space"
- Action buttons:
  - "Manage Flashcards" → navigate to /flashcards
  - "Modify Selection" → stay on review page
- Card reviews preserved so user can change decisions

### 9.6 Batch Already Reviewed

**Condition:** Same batch cannot be reviewed twice.

**Components Affected:**

- FlashcardGenerator (error handling)
- ErrorDisplay

**API Response (409):**

```typescript
{
  error: "BATCH_ALREADY_REVIEWED",
  message: "This batch has already been reviewed and saved"
}
```

**UI Effects:**

- Error alert: "This batch has already been processed"
- Explanation: "These flashcards may have already been added to your collection"
- Action buttons:
  - "View My Flashcards" → navigate to /flashcards
  - "Generate New Cards" → reset to input form

**Prevention:**

- Disable Save Decisions button during submission
- Show loading state to prevent double-click
- Only enable after response received

### 9.7 Batch Not Found

**Condition:** Batch must exist and belong to authenticated user.

**Components Affected:**

- FlashcardGenerator (error handling)
- ErrorDisplay

**API Response (404):**

```typescript
{
  error: "BATCH_NOT_FOUND",
  message: "Batch not found or does not belong to user"
}
```

**UI Effects:**

- Error alert: "Batch not found"
- Explanation: "The generation batch could not be found"
- Action: "Generate New Cards" → reset to input form

**Prevention:**

- Should not occur in normal flow
- Only use batch_id from generation response
- Don't allow manual batch_id entry

## 10. Error Handling

### 10.1 Generation Errors

**10.1.1 Invalid Input (400)**

**Scenario:** Input doesn't meet validation requirements

**API Response:**

```typescript
{
  error: "Bad Request",
  message: "Validation failed",
  details: [
    {
      field: "input_text",
      message: "String must contain at least 1000 character(s)",
      received_length: 500
    }
  ]
}
```

**Handling:**

- Display error message in alert component
- Show received length vs. required length
- Preserve input text
- Keep generate button visible
- Focus returns to textarea
- Allow immediate correction and retry

**UI Display:**

```
⚠️ Validation Error
Your input is too short. Please add more text.
• Input text: 500 characters (minimum: 1,000 characters)

[Fix Input and Try Again]
```

---

**10.1.2 Budget Limit Reached (429)**

**Scenario:** Monthly AI generation budget exhausted

**API Response:**

```typescript
{
  error: "Too Many Requests",
  message: "AI generation budget limit reached for this month",
  suggestion: "Try manual flashcard creation instead"
}
```

**Handling:**

- Display clear message about budget limit
- Explain it's a temporary limitation
- Suggest manual creation alternative
- Preserve input text (can be used for manual creation)
- Provide link to manual creation page
- Optionally show when budget resets

**UI Display:**

```
🚫 Generation Limit Reached
The AI generation limit has been reached for this month. You can still create flashcards manually.

Suggestions:
• Create flashcards manually from your text
• Wait for the monthly limit to reset

[Create Manually] [View My Flashcards]
```

---

**10.1.3 Service Unavailable (503)**

**Scenario:** AI service temporarily down

**API Response:**

```typescript
{
  error: "Service Unavailable",
  message: "AI generation service is temporarily unavailable"
}
```

**Handling:**

- Display temporary error message
- Offer retry button
- Preserve input text for retry
- Suggest trying again shortly
- No navigation away (can retry immediately)

**UI Display:**

```
⏸️ Service Temporarily Unavailable
The AI generation service is currently unavailable. Please try again in a moment.

[Retry] [Cancel]
```

---

**10.1.4 Network Error**

**Scenario:** Request failed due to network issues

**Handling:**

- Detect fetch failures (not response errors)
- Display generic network error
- Offer retry button
- Preserve all state
- Check browser console for details

**UI Display:**

```
🔌 Network Error
Unable to connect to the server. Please check your internet connection.

[Retry] [Cancel]
```

### 10.2 Review Submission Errors

**10.2.1 Flashcard Limit Exceeded (403)**

**Scenario:** Accepting cards would exceed 500 card limit

**API Response:**

```typescript
{
  error: "FLASHCARD_LIMIT_EXCEEDED",
  message: "Cannot accept 20 cards. Would exceed limit of 500. Current count: 485",
  current_count: 485,
  limit: 500,
  suggestion: "Delete some existing flashcards or reject more generated cards"
}
```

**Handling:**

- Display detailed limit information
- Show math: current + accepted > limit
- Preserve card review state (allow modification)
- Suggest two paths: reject more cards OR delete existing cards
- Provide navigation to flashcard management
- Calculate and show how many cards can be accepted: limit - current_count

**UI Display:**

```
⚠️ Flashcard Limit Exceeded
You have 485 flashcards and are trying to add 20 more, which exceeds the limit of 500.

Options:
• You can accept up to 15 cards from this batch
• Reject 5 or more cards in your current selection
• Delete some existing flashcards to free up space

[Manage Flashcards] [Modify Selection]
```

---

**10.2.2 Batch Not Found (404)**

**Scenario:** Batch doesn't exist or belongs to different user

**API Response:**

```typescript
{
  error: "BATCH_NOT_FOUND",
  message: "Batch not found or does not belong to user"
}
```

**Handling:**

- Display error explaining batch not found
- Should rarely occur (internal consistency issue)
- Offer to start fresh generation
- Clear review state
- Return to input form

**UI Display:**

```
❌ Batch Not Found
The generation batch could not be found. Please start a new generation.

[Start New Generation]
```

---

**10.2.3 Batch Already Reviewed (409)**

**Scenario:** Attempting to review same batch twice

**API Response:**

```typescript
{
  error: "BATCH_ALREADY_REVIEWED",
  message: "This batch has already been reviewed and saved"
}
```

**Handling:**

- Display message that batch already processed
- Explain flashcards may already be in collection
- Offer navigation to view flashcards
- Offer to start new generation
- Prevent further submission attempts

**UI Display:**

```
ℹ️ Already Processed
This batch has already been reviewed and saved to your collection.

[View My Flashcards] [Generate New Cards]
```

---

**10.2.4 Validation Error (400)**

**Scenario:** Review decisions don't meet validation requirements

**API Response:**

```typescript
{
  error: "VALIDATION_ERROR",
  message: "Invalid review decisions",
  details: [
    {
      field: "decisions[3].front_text",
      message: "String must contain at least 10 character(s)",
      received_length: 5
    }
  ]
}
```

**Handling:**

- Display validation error message
- Highlight specific cards with errors (if identifiable by index)
- Show field-level error details
- Preserve review state
- Allow user to fix issues (re-edit cards)
- Provide "Review and Fix" action

**UI Display:**

```
⚠️ Validation Error
Some edited cards don't meet the requirements.

Issues found:
• Card 4: Front text must be at least 10 characters (currently 5)

Please edit the affected cards and try again.

[Review Cards] [Dismiss]
```

---

**10.2.5 Network Error During Submission**

**Scenario:** Network failure during review submission

**Handling:**

- Display network error message
- Preserve all review decisions
- Offer retry button
- Important: decisions are preserved, so retry is safe
- User doesn't lose their review work

**UI Display:**

```
🔌 Network Error
Failed to save your decisions due to a network error. Your selections have been preserved.

[Retry Saving] [Cancel]
```

### 10.3 Error Recovery Patterns

**General Recovery Strategy:**

1. **Preserve User Work**
   - Never clear input text or card decisions on error
   - Only reset on explicit user action (reset/cancel)

2. **Provide Clear Actions**
   - Always offer specific next steps
   - Use action-oriented button labels
   - Avoid dead-ends (always provide a path forward)

3. **Retry When Appropriate**
   - Offer retry for transient errors (503, network)
   - Don't offer retry for permanent errors (429, 409)

4. **Alternative Paths**
   - Suggest manual creation when AI unavailable
   - Link to flashcard management for limit issues
   - Provide contact/support for persistent issues

5. **Error Logging**
   - Log errors to console for debugging
   - Include request/response details
   - Track error frequency for monitoring

**Error Display Component Pattern:**

```typescript
function ErrorDisplay({ error, onRetry, onDismiss }: ErrorDisplayProps) {
  // Determine error type and appropriate actions
  const errorConfig = useMemo(() => {
    switch (error.error) {
      case 'Too Many Requests':
        return {
          icon: '🚫',
          title: 'Generation Limit Reached',
          canRetry: false,
          actions: ['manual-creation', 'view-flashcards'],
        };
      case 'Service Unavailable':
        return {
          icon: '⏸️',
          title: 'Service Temporarily Unavailable',
          canRetry: true,
          actions: ['retry', 'cancel'],
        };
      // ... more cases
    }
  }, [error]);

  return (
    <Alert variant="destructive">
      <AlertTitle>{errorConfig.icon} {errorConfig.title}</AlertTitle>
      <AlertDescription>
        {error.message}
        {/* Render details if available */}
        {/* Render suggestions if available */}
      </AlertDescription>
      {/* Render action buttons based on errorConfig.actions */}
    </Alert>
  );
}
```

## 11. Implementation Steps

### Step 1: Project Setup and Dependencies

**Tasks:**

- Verify Shadcn/ui components are available: Button, Textarea, Card, Dialog, Alert, Badge
- If missing, install needed Shadcn components: `npx shadcn@latest add [component]`
- Create feature directory: `src/components/flashcard-generation/`
- Create subdirectories: `components/`, `hooks/`, `types.ts`, `utils.ts`

**Files to create:**

- `src/components/flashcard-generation/types.ts` - ViewModels and local types
- `src/components/flashcard-generation/utils.ts` - Helper functions
- `src/components/flashcard-generation/hooks/` - Custom hooks

### Step 2: Define ViewModels and Types

**File:** `src/components/flashcard-generation/types.ts`

**Tasks:**

- Define `CharacterCountState` interface
- Define `CardReviewState` interface
- Define `GenerationState` discriminated union
- Define `EditModalState` interface
- Define `BulkActionSummary` interface
- Export all component prop interfaces
- Import and re-export relevant DTOs from `@/types`

**Validation:**

- Ensure all types are properly typed with TypeScript
- Verify discriminated union works correctly for `GenerationState`

### Step 3: Implement Utility Functions

**File:** `src/components/flashcard-generation/utils.ts`

**Tasks:**

- Implement `calculateCharacterCount()` function
- Implement `getCharCountStatus()` function
- Implement `calculateBulkSummary()` function
- Implement `buildReviewDecisions()` function (converts CardReviewState[] to ReviewDecision[])
- Implement `initializeCardReviews()` function (creates initial CardReviewState[] from API response)

**Example:**

```typescript
export function calculateCharacterCount(text: string, min: number, max: number): CharacterCountState {
  const current = text.trim().length;
  const isValid = current >= min && current <= max;

  let status: CharacterCountState["status"];
  if (current < min) status = "too-short";
  else if (current > max) status = "too-long";
  else if (current > max * 0.9) status = "warning";
  else status = "valid";

  return { current, min, max, isValid, status };
}

export function calculateBulkSummary(reviews: CardReviewState[]): BulkActionSummary {
  return {
    total: reviews.length,
    accepted: reviews.filter((r) => r.action === "accept").length,
    rejected: reviews.filter((r) => r.action === "reject").length,
    edited: reviews.filter((r) => r.action === "edit").length,
    pending: reviews.filter((r) => r.action === "pending").length,
  };
}
```

### Step 4: Create useCharacterCount Hook

**File:** `src/components/flashcard-generation/hooks/useCharacterCount.ts`

**Tasks:**

- Create hook that accepts text, min, max parameters
- Use `useMemo` for calculation optimization
- Return `CharacterCountState` object
- Add JSDoc documentation

**Example:**

```typescript
export function useCharacterCount(text: string, min: number, max: number): CharacterCountState {
  return useMemo(() => calculateCharacterCount(text, min, max), [text, min, max]);
}
```

### Step 5: Create useFlashcardGeneration Hook

**File:** `src/components/flashcard-generation/hooks/useFlashcardGeneration.ts`

**Tasks:**

- Set up all state variables (inputText, generationState, cardReviews, editModalState)
- Implement `generateFlashcards()` async function with error handling
- Implement `submitReview()` async function with error handling
- Implement card action functions (acceptCard, rejectCard, editCard, acceptAll, rejectAll)
- Implement modal functions (openEditModal, closeEditModal, saveEdit)
- Implement `reset()` function
- Calculate derived state (charCount, bulkSummary, canGenerate, canSubmitReview)
- Return clean interface object

**Key considerations:**

- Use try-catch for all API calls
- Properly type all async functions
- Use functional state updates for arrays
- Implement proper error handling for each API call

### Step 6: Create CharacterCounter Component

**File:** `src/components/flashcard-generation/components/CharacterCounter.tsx`

**Tasks:**

- Accept props: current, min, max, status, className
- Render counter display with color coding
- Add aria-live="polite" for accessibility
- Display appropriate message based on status
- Style with Tailwind classes

**Color mapping:**

- too-short: red (text-red-600)
- valid: green (text-green-600)
- warning: yellow (text-yellow-600)
- too-long: red (text-red-600)

### Step 7: Create LoadingIndicator Component

**File:** `src/components/flashcard-generation/components/LoadingIndicator.tsx`

**Tasks:**

- Accept props: message, className
- Render spinner animation
- Display message text
- Add role="status" and aria-live="polite"
- Use Shadcn loading spinner

### Step 8: Create ErrorDisplay Component

**File:** `src/components/flashcard-generation/components/ErrorDisplay.tsx`

**Tasks:**

- Accept props: error (ApiError), onRetry, onDismiss
- Use Shadcn Alert component
- Render error icon, title, and message
- Display details array if present
- Show current_count and limit for 403 errors
- Render appropriate action buttons based on error type
- Implement error type detection logic

**Error type handling:**

- 400: Show details, offer dismiss
- 429: Show budget message, link to manual creation
- 503: Show retry button
- 403: Show limit details, link to manage flashcards
- 404/409: Show reset option

### Step 9: Create FlashcardGeneratorForm Component

**File:** `src/components/flashcard-generation/components/FlashcardGeneratorForm.tsx`

**Tasks:**

- Accept props: inputText, onInputChange, onGenerate, isGenerating, isDisabled
- Render form with onSubmit handler
- Use Shadcn Textarea component
- Add CharacterCounter component
- Add Generate button (Shadcn Button)
- Implement validation logic
- Add helpful instructions/labels
- Handle form submission (prevent default, validate, call onGenerate)

**Accessibility:**

- Label textarea appropriately
- Add aria-describedby linking textarea to character counter
- Add aria-disabled and title tooltip to button when disabled

### Step 10: Create GeneratedCardItem Component

**File:** `src/components/flashcard-generation/components/GeneratedCardItem.tsx`

**Tasks:**

- Accept props: card (GeneratedCardPreview), reviewState (CardReviewState), onAccept, onReject, onEdit
- Use Shadcn Card component
- Display both front and back text simultaneously (no flipping)
- Add status badge (Pending/Accepted/Rejected/Edited)
- Render action buttons with icons (all buttons always enabled)
- Apply conditional styling based on action state
- Implement acceptCard and rejectCard to clear editedCard field

**Styling by state:**

- pending: default border
- accept: green border (border-green-500)
- reject: red border, reduced opacity (border-red-500, opacity-50)
- edit: blue border (border-blue-500)

### Step 11: Create CardReviewGrid Component

**File:** `src/components/flashcard-generation/components/CardReviewGrid.tsx`

**Tasks:**

- Accept props: cards, reviewStates, onAccept, onReject, onEdit
- Render responsive grid layout
- Map over cards and render GeneratedCardItem for each
- Use Tailwind grid classes: `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4`
- Handle empty state (no cards generated)

### Step 12: Create BulkActionBar Component

**File:** `src/components/flashcard-generation/components/BulkActionBar.tsx`

**Tasks:**

- Accept props: summary (BulkActionSummary), onAcceptAll, onRejectAll, onSubmit, isSubmitting, canSubmit
- Render summary statistics
- Add Accept All button
- Add Reject All button
- Add Save Decisions button (primary, disabled when !canSubmit)
- Display warning message when canSubmit is false
- Use flex layout for responsive design

**Summary display format:**

```
📊 Total: 15 | ✅ Accepted: 8 | ✏️ Edited: 2 | ❌ Rejected: 3 | ⏸️ Pending: 2
```

### Step 13: Create EditCardModal Component

**File:** `src/components/flashcard-generation/components/EditCardModal.tsx`

**Tasks:**

- Accept props: isOpen, card, onSave, onCancel
- Use Shadcn Dialog component
- Maintain local state for frontText, backText
- Use useCharacterCount for both front and back
- Render two textareas with character counters
- Add CharacterCounter components
- Implement validation logic
- Disable Save button when either field invalid
- Display inline validation errors
- Handle save and cancel actions

**Form layout:**

```
Front Text
[Textarea]
[CharacterCounter]
[Validation error if any]

Back Text
[Textarea]
[CharacterCounter]
[Validation error if any]

[Cancel] [Save Changes]
```

### Step 14: Create SuccessConfirmation Component

**File:** `src/components/flashcard-generation/components/SuccessConfirmation.tsx`

**Tasks:**

- Accept props: isOpen, result (ReviewFlashcardsResponse), onViewFlashcards, onGenerateMore
- Use Shadcn Dialog component
- Display success icon and title
- Show statistics from result
- Add View Flashcards button
- Add Generate More button
- Use celebration styling (green accents)

**Statistics display:**

```
✅ Successfully created 10 flashcards!

📊 Summary:
• Accepted: 8 cards
• Edited: 2 cards
• Rejected: 5 cards
```

### Step 15: Create CardReviewSection Component

**File:** `src/components/flashcard-generation/components/CardReviewSection.tsx`

**Tasks:**

- Accept props from parent hook
- Render section heading
- Include BulkActionBar
- Include CardReviewGrid
- Add instructions text
- Wrap in section element with proper spacing

### Step 16: Create Main FlashcardGenerator Component

**File:** `src/components/flashcard-generation/FlashcardGenerator.tsx`

**Tasks:**

- Use `useFlashcardGeneration()` hook
- Implement conditional rendering based on generationState.status
- Render FlashcardGeneratorForm when idle
- Render LoadingIndicator when generating or submitting
- Render ErrorDisplay when error state
- Render CardReviewSection when reviewing
- Render EditCardModal (controlled by editModalState)
- Render SuccessConfirmation when success state
- Add client:load directive for Astro

**Conditional rendering structure:**

```typescript
{generationState.status === 'idle' && <FlashcardGeneratorForm ... />}
{generationState.status === 'generating' && <LoadingIndicator ... />}
{generationState.status === 'error' && <ErrorDisplay ... />}
{generationState.status === 'reviewing' && <CardReviewSection ... />}
{generationState.status === 'submitting' && <LoadingIndicator ... />}
<EditCardModal ... />
{generationState.status === 'success' && <SuccessConfirmation ... />}
```

### Step 17: Create Astro Page

**File:** `src/pages/generate.astro`

**Tasks:**

- Import base layout
- Import FlashcardGenerator component
- Add page metadata (title, description)
- Render component with client:load directive
- Add page-level styling if needed

**Example structure:**

```astro
---
import BaseLayout from "@/layouts/BaseLayout.astro";
import FlashcardGenerator from "@/components/flashcard-generation/FlashcardGenerator";
---

<BaseLayout title="Generate Flashcards" description="Create flashcards from text using AI">
  <main class="container mx-auto px-4 py-8">
    <h1 class="text-3xl font-bold mb-6">Generate Flashcards</h1>
    <FlashcardGenerator client:load />
  </main>
</BaseLayout>
```

### Step 18: Style Components

**Tasks:**

- Review all components for consistent styling
- Ensure responsive design works on mobile, tablet, desktop
- Test dark mode if applicable
- Verify color accessibility (contrast ratios)
- Add hover states and transitions
- Ensure loading states are visually clear
- Test with screen readers for accessibility

**Key styling areas:**

- Character counter color coding
- Card action state styling (borders, opacity)
- Button states (disabled, loading, hover)
- Modal responsive behavior (full-screen on mobile)
- Grid responsiveness

### Step 19: Test User Flows

**Test scenarios:**

1. **Happy Path:**
   - Enter valid text
   - Generate flashcards
   - Review cards (mix of accept, edit, reject)
   - Submit review
   - View success modal
   - Generate more or view flashcards

2. **Validation Errors:**
   - Try to generate with < 1,000 chars
   - Try to generate with > 10,000 chars
   - Try to save with no cards accepted
   - Try to save edited card with invalid text length

3. **API Errors:**
   - Simulate 429 error (budget limit)
   - Simulate 503 error (service unavailable)
   - Simulate 403 error (flashcard limit)
   - Simulate network error

4. **Edge Cases:**
   - Generate maximum cards (50+)
   - Edit card multiple times
   - Accept all then reject all
   - Close edit modal without saving
   - Browser back button during review

5. **Accessibility:**
   - Navigate with keyboard only
   - Test with screen reader
   - Verify ARIA labels
   - Check focus management

### Step 20: Integration Testing

**Tasks:**

- Test with real API endpoints
- Verify error responses match documentation
- Test with slow network (throttling)
- Verify batch_id is correctly passed to review endpoint
- Test state persistence during errors
- Verify navigation links work correctly

### Step 21: Performance Optimization

**Tasks:**

- Add React.memo() to GeneratedCardItem
- Verify useMemo usage in hooks
- Test with 100+ generated cards
- Optimize re-renders with React DevTools
- Consider virtualization if performance issues
- Test on low-end devices

### Step 22: Documentation

**Tasks:**

- Add JSDoc comments to all functions
- Document component props with TypeScript
- Add README in feature directory explaining architecture
- Document error handling patterns
- Create storybook stories (optional)

### Step 23: Code Review and Refinement

**Tasks:**

- Review code for consistency
- Check for TypeScript errors
- Run linters and fix issues
- Verify all TODO comments resolved
- Ensure consistent naming conventions
- Remove console.logs (except intentional ones)

### Step 24: Final QA

**Tasks:**

- Full regression test of all user flows
- Cross-browser testing (Chrome, Firefox, Safari, Edge)
- Mobile device testing (iOS, Android)
- Accessibility audit with automated tools
- Performance testing with Lighthouse
- Final visual QA on all screen sizes

### Step 25: Deployment Preparation

**Tasks:**

- Verify environment variables configured
- Check API endpoints point to correct environment
- Test error logging is working
- Verify analytics tracking (if implemented)
- Update CLAUDE.md if new patterns introduced
- Prepare deployment notes

---

## Summary

This implementation plan provides a comprehensive guide for building the Generate Flashcards view with:

- **Clear component structure** with well-defined responsibilities
- **Type-safe implementation** using TypeScript and existing DTOs
- **Centralized state management** with custom hooks
- **Robust error handling** for all API scenarios
- **Comprehensive validation** matching API requirements
- **Accessibility support** with ARIA attributes and keyboard navigation
- **Responsive design** for mobile, tablet, and desktop
- **Step-by-step implementation** guide with 25 detailed steps

The architecture follows React best practices, leverages the tech stack (Astro, React, Shadcn/ui, Tailwind), and adheres to the project's coding conventions outlined in CLAUDE.md.
