import type { SupabaseClient } from "@/db/supabase.client";
import type {
  AIGenerationBatchEntity,
  FlashcardDTO,
  FlashcardInsert,
  ReviewDecision,
  ReviewFlashcardsResponse,
} from "@/types";

/**
 * Custom error types for better error handling
 */
export class BatchNotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BatchNotFoundError";
  }
}

export class BatchAlreadyReviewedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BatchAlreadyReviewedError";
  }
}

export class FlashcardLimitExceededError extends Error {
  constructor(
    message: string,
    public currentCount: number,
    public limit: number
  ) {
    super(message);
    this.name = "FlashcardLimitExceededError";
  }
}

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}

/**
 * Fetches an AI generation batch and verifies it belongs to the user
 */
export async function getAIGenerationBatch(
  supabase: SupabaseClient,
  batchId: string,
  userId: string
): Promise<AIGenerationBatchEntity | null> {
  const { data, error } = await supabase
    .from("ai_generation_batches")
    .select("*")
    .eq("id", batchId)
    .eq("user_id", userId)
    .single();

  if (error || !data) {
    return null;
  }

  return data;
}

/**
 * Counts the number of flashcards owned by a user
 */
export async function getUserFlashcardCount(supabase: SupabaseClient, userId: string): Promise<number> {
  const { count, error } = await supabase
    .from("flashcards")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId);

  if (error) {
    throw new Error(`Failed to count user flashcards: ${error.message}`);
  }

  return count ?? 0;
}

/**
 * Helper function to omit user_id from flashcard entity
 */
function omitUserId(flashcard: FlashcardInsert & { id: string; created_at: string; updated_at: string }): FlashcardDTO {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { user_id, ...rest } = flashcard as Record<string, unknown>;
  return rest as FlashcardDTO;
}

/**
 * Main service method for reviewing AI-generated flashcards
 * Handles all business logic including validation, limits, and database operations
 */
export async function reviewAIGeneratedFlashcards(
  supabase: SupabaseClient,
  batchId: string,
  userId: string,
  decisions: ReviewDecision[]
): Promise<ReviewFlashcardsResponse> {
  // 1. Fetch batch with ownership check
  const batch = await getAIGenerationBatch(supabase, batchId, userId);
  if (!batch) {
    throw new BatchNotFoundError("AI generation batch not found or does not belong to user");
  }

  // 2. Check if already reviewed
  if (batch.cards_accepted + batch.cards_rejected > 0) {
    throw new BatchAlreadyReviewedError("This batch has already been reviewed");
  }

  // 3. Validate decision indices
  const indices = decisions.map((d) => d.index);
  const maxIndex = Math.max(...indices);

  if (maxIndex >= batch.total_cards_generated) {
    throw new ValidationError(
      `Index ${maxIndex} is out of bounds. Maximum allowed index is ${batch.total_cards_generated - 1}`
    );
  }

  // 4. Calculate statistics
  const acceptedDecisions = decisions.filter((d) => d.action === "accept");
  const rejectedDecisions = decisions.filter((d) => d.action === "reject");
  const editedDecisions = decisions.filter((d) => d.action === "edit");

  // Decisions that will create flashcards (accept + edit)
  const decisionsToCreate = [...acceptedDecisions, ...editedDecisions];

  // 5. Check flashcard limit
  const currentCount = await getUserFlashcardCount(supabase, userId);
  if (currentCount + decisionsToCreate.length > 500) {
    throw new FlashcardLimitExceededError(
      "Accepting these cards would exceed your limit of 500 flashcards",
      currentCount,
      500
    );
  }

  // 6. Prepare flashcards to insert (both accepted and edited decisions)
  const flashcardsToInsert: FlashcardInsert[] = decisionsToCreate.map((decision) => ({
    user_id: userId,
    generation_batch_id: batchId,
    front_text: decision.front_text,
    back_text: decision.back_text,
    is_ai_generated: true,
    was_edited: decision.action === "edit",
  }));

  // 7. Execute database operations in transaction-like manner
  // Note: Supabase doesn't have explicit transactions in the JS client,
  // but operations are atomic per query

  let createdFlashcards: (FlashcardInsert & { id: string; created_at: string; updated_at: string })[] = [];

  // Insert flashcards only if there are accepted/edited decisions
  if (flashcardsToInsert.length > 0) {
    const { data: insertedData, error: insertError } = await supabase
      .from("flashcards")
      .insert(flashcardsToInsert)
      .select();

    if (insertError) {
      throw new Error(`Failed to insert flashcards: ${insertError.message}`);
    }

    createdFlashcards = insertedData ?? [];
  }

  // Update batch statistics
  const { error: updateError } = await supabase
    .from("ai_generation_batches")
    .update({
      cards_accepted: acceptedDecisions.length,
      cards_rejected: rejectedDecisions.length,
      cards_edited: editedDecisions.length,
    })
    .eq("id", batchId);

  if (updateError) {
    throw new Error(`Failed to update batch statistics: ${updateError.message}`);
  }

  // 8. Return success response
  return {
    batch_id: batchId,
    cards_accepted: acceptedDecisions.length,
    cards_rejected: rejectedDecisions.length,
    cards_edited: editedDecisions.length,
    created_flashcards: createdFlashcards.map(omitUserId),
  };
}
