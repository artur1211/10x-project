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

// Re-export DTOs for convenience
export type {
  GenerateFlashcardsCommand,
  GenerateFlashcardsResponse,
  GeneratedCardPreview,
  ReviewFlashcardsCommand,
  ReviewDecision,
  ReviewFlashcardsResponse,
  FlashcardDTO,
  ApiError,
};

/**
 * Character count validation state with UI status indicators
 */
export interface CharacterCountState {
  current: number;
  min: number;
  max: number;
  isValid: boolean;
  status: "too-short" | "valid" | "warning" | "too-long";
}

/**
 * Review state for individual generated card
 */
export interface CardReviewState {
  index: number;
  action: "pending" | "accept" | "reject" | "edit";
  originalCard: GeneratedCardPreview;
  editedCard?: GeneratedCardPreview;
  isFlipped: boolean;
}

/**
 * Generation workflow state machine
 */
export type GenerationState =
  | { status: "idle" }
  | { status: "generating" }
  | { status: "reviewing"; data: GenerateFlashcardsResponse }
  | { status: "submitting" }
  | { status: "success"; data: ReviewFlashcardsResponse }
  | { status: "error"; error: ApiError; phase: "generation" | "review" };

/**
 * Edit modal state
 */
export interface EditModalState {
  isOpen: boolean;
  cardIndex: number | null;
  frontText: string;
  backText: string;
  frontValidation: CharacterCountState;
  backValidation: CharacterCountState;
  hasChanges: boolean;
}

/**
 * Summary statistics for bulk actions
 */
export interface BulkActionSummary {
  total: number;
  accepted: number;
  rejected: number;
  edited: number;
  pending: number;
}

/**
 * Props for FlashcardGeneratorForm
 */
export interface FlashcardGeneratorFormProps {
  inputText: string;
  onInputChange: (text: string) => void;
  onGenerate: (text: string) => Promise<void>;
  isGenerating: boolean;
  isDisabled: boolean;
}

/**
 * Props for CharacterCounter
 */
export interface CharacterCounterProps {
  current: number;
  min: number;
  max: number;
  status: "too-short" | "valid" | "warning" | "too-long";
  className?: string;
}

/**
 * Props for LoadingIndicator
 */
export interface LoadingIndicatorProps {
  message?: string;
  className?: string;
}

/**
 * Props for ErrorDisplay
 */
export interface ErrorDisplayProps {
  error: ApiError;
  onRetry?: () => void;
  onDismiss?: () => void;
  preservedInput?: string;
}

/**
 * Props for GeneratedCardItem
 */
export interface GeneratedCardItemProps {
  card: GeneratedCardPreview;
  reviewState: CardReviewState;
  onAccept: (index: number) => void;
  onReject: (index: number) => void;
  onEdit: (index: number) => void;
}

/**
 * Props for CardReviewGrid
 */
export interface CardReviewGridProps {
  cards: GeneratedCardPreview[];
  reviewStates: CardReviewState[];
  onAccept: (index: number) => void;
  onReject: (index: number) => void;
  onEdit: (index: number) => void;
}

/**
 * Props for BulkActionBar
 */
export interface BulkActionBarProps {
  summary: BulkActionSummary;
  onAcceptAll: () => void;
  onRejectAll: () => void;
  onSubmit: () => Promise<void>;
  isSubmitting: boolean;
  canSubmit: boolean;
}

/**
 * Props for EditCardModal
 */
export interface EditCardModalProps {
  isOpen: boolean;
  card: GeneratedCardPreview | null;
  cardIndex: number | null;
  onSave: (index: number, frontText: string, backText: string) => void;
  onCancel: () => void;
}

/**
 * Props for SuccessConfirmation
 */
export interface SuccessConfirmationProps {
  isOpen: boolean;
  result: ReviewFlashcardsResponse;
  onViewFlashcards: () => void;
  onGenerateMore: () => void;
}

/**
 * Props for CardReviewSection
 */
export interface CardReviewSectionProps {
  cards: GeneratedCardPreview[];
  reviewStates: CardReviewState[];
  onAccept: (index: number) => void;
  onReject: (index: number) => void;
  onEdit: (index: number) => void;
  onAcceptAll: () => void;
  onRejectAll: () => void;
  onSubmit: () => Promise<void>;
  isSubmitting: boolean;
  canSubmit: boolean;
}
