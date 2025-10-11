import type { Tables, TablesInsert, TablesUpdate } from "./db/database.types";

// ============================================================================
// Entity Types (Direct database table representations)
// ============================================================================

/**
 * Flashcard entity from database
 */
export type FlashcardEntity = Tables<"flashcards">;

/**
 * AI Generation Batch entity from database
 */
export type AIGenerationBatchEntity = Tables<"ai_generation_batches">;

/**
 * Study Session entity from database
 */
export type StudySessionEntity = Tables<"study_sessions">;

// ============================================================================
// Common Types
// ============================================================================

/**
 * Pagination metadata for list responses
 */
export interface PaginationMetadata {
  current_page: number;
  total_pages: number;
  total_count: number;
  limit: number;
}

/**
 * API error response structure
 */
export interface ApiError {
  error: string;
  message: string;
  details?: {
    field: string;
    message: string;
    received_length?: number;
  }[];
  current_count?: number;
  limit?: number;
  suggestion?: string;
  reset_date?: string;
  resource_type?: string;
  resource_id?: string;
}

// ============================================================================
// Flashcard DTOs
// ============================================================================

/**
 * Flashcard DTO - Omits user_id as it's implied by authentication
 */
export type FlashcardDTO = Omit<FlashcardEntity, "user_id">;

/**
 * Command for creating a manual flashcard
 * Validation rules:
 * - front_text: 10-500 characters
 * - back_text: 10-1000 characters
 */
export interface CreateFlashcardCommand {
  front_text: string;
  back_text: string;
}

/**
 * Command for updating a flashcard
 * Sets was_edited=true when applied
 */
export interface UpdateFlashcardCommand {
  front_text?: string;
  back_text?: string;
}

/**
 * User's flashcard statistics
 */
export interface UserFlashcardStats {
  total_flashcards: number;
  flashcard_limit: number;
  remaining_capacity: number;
}

/**
 * Response for GET /api/flashcards
 */
export interface FlashcardsListResponse {
  flashcards: FlashcardDTO[];
  pagination: PaginationMetadata;
  user_stats: UserFlashcardStats;
}

/**
 * Response for DELETE /api/flashcards (bulk delete)
 */
export interface DeleteFlashcardsResponse {
  message: string;
  deleted_count: number;
  deleted_ids: string[];
}

/**
 * Response for DELETE /api/flashcards/:id (single delete)
 */
export interface DeleteFlashcardResponse {
  message: string;
  id: string;
}

// ============================================================================
// AI Generation DTOs
// ============================================================================

/**
 * Command for generating flashcards from text using AI
 * Validation rules:
 * - input_text: 1000-10000 characters
 * - Generates 5-10 cards per 1000 characters
 */
export interface GenerateFlashcardsCommand {
  input_text: string;
}

/**
 * Preview of a generated flashcard (not yet persisted to database)
 */
export interface GeneratedCardPreview {
  index: number;
  front_text: string;
  back_text: string;
}

/**
 * Response for POST /api/flashcards/batch
 */
export interface GenerateFlashcardsResponse {
  batch_id: string;
  generated_at: string;
  input_text_length: number;
  generated_cards: GeneratedCardPreview[];
  total_cards_generated: number;
  time_taken_ms: number | null;
  model_used: string | null;
}

/**
 * Review decision for a single AI-generated flashcard
 * front_text and back_text must always be provided:
 * - For "accept": send original generated texts
 * - For "edit": send modified texts
 * - For "reject": texts are ignored but should be sent for consistency
 */
export interface ReviewDecision {
  index: number;
  action: "accept" | "reject" | "edit";
  front_text: string;
  back_text: string;
}

/**
 * Command for reviewing AI-generated flashcards
 */
export interface ReviewFlashcardsCommand {
  decisions: ReviewDecision[];
}

/**
 * Response for POST /api/flashcards/batch/:batchId/review
 */
export interface ReviewFlashcardsResponse {
  batch_id: string;
  cards_accepted: number;
  cards_rejected: number;
  cards_edited: number;
  created_flashcards: FlashcardDTO[];
}

// ============================================================================
// AI Generation Batch DTOs
// ============================================================================

/**
 * AI Generation Batch DTO - Omits user_id and includes computed acceptance rate
 */
export type AIGenerationBatchDTO = Omit<AIGenerationBatchEntity, "user_id"> & {
  acceptance_rate_percent?: number;
};

/**
 * AI Generation Batch with associated flashcards
 * Used in GET /api/ai-batches/:batchId
 */
export interface AIGenerationBatchWithFlashcards extends Omit<AIGenerationBatchEntity, "user_id"> {
  created_flashcards: {
    id: string;
    front_text: string;
    back_text: string;
    was_edited: boolean;
  }[];
}

/**
 * Response for GET /api/ai-batches
 */
export interface AIGenerationBatchesListResponse {
  batches: AIGenerationBatchDTO[];
  pagination: PaginationMetadata;
}

// ============================================================================
// Study Session DTOs (Future Implementation)
// ============================================================================

/**
 * Study Session DTO - Omits user_id as it's implied by authentication
 */
export type StudySessionDTO = Omit<StudySessionEntity, "user_id">;

// ============================================================================
// Database Insert/Update Types
// ============================================================================

/**
 * Type for inserting a new flashcard into the database
 */
export type FlashcardInsert = TablesInsert<"flashcards">;

/**
 * Type for updating a flashcard in the database
 */
export type FlashcardUpdate = TablesUpdate<"flashcards">;

/**
 * Type for inserting a new AI generation batch into the database
 */
export type AIGenerationBatchInsert = TablesInsert<"ai_generation_batches">;

/**
 * Type for updating an AI generation batch in the database
 */
export type AIGenerationBatchUpdate = TablesUpdate<"ai_generation_batches">;

/**
 * Type for inserting a new study session into the database
 */
export type StudySessionInsert = TablesInsert<"study_sessions">;

/**
 * Type for updating a study session in the database
 */
export type StudySessionUpdate = TablesUpdate<"study_sessions">;
