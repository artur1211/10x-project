import type { SupabaseClient } from "@/db/supabase.client";
import type {
  AIGenerationBatchEntity,
  FlashcardDTO,
  FlashcardInsert,
  GeneratedCardPreview,
  ReviewDecision,
  ReviewFlashcardsResponse,
} from "@/types";
import { OpenRouterService } from "./openrouter.service";
import type { ResponseFormat } from "./openrouter.types";
import {
  FlashcardGenerationResponseSchema,
  FLASHCARD_GENERATION_JSON_SCHEMA,
  type FlashcardGenerationResponse,
} from "./flashcardBatch.schemas";
import { buildFlashcardGenerationMessages } from "./flashcardBatch.prompts.ts";
import { OpenRouterError, OpenRouterValidationError, OpenRouterRateLimitError } from "./openrouter.errors";
import type { GenerationResult } from "./flashcardBatch.types";
import {
  BatchNotFoundError,
  BatchAlreadyReviewedError,
  FlashcardLimitExceededError,
  ValidationError,
  FlashcardGenerationError,
} from "./flashcardBatch.errors";

export class FlashcardBatchService {
  private readonly supabase: SupabaseClient;
  private readonly defaultApiKey?: string;

  constructor(supabase: SupabaseClient, defaultApiKey?: string) {
    this.supabase = supabase;
    this.defaultApiKey = defaultApiKey;
  }

  /**
   * ============================================================================
   * GENERATION METHODS
   * ============================================================================
   */

  /**
   * Generates flashcards from input text using OpenRouter AI
   */
  async generateFlashcardsFromText(inputText: string, apiKey?: string): Promise<GenerationResult> {
    // Validate input
    if (!inputText || inputText.trim().length < 100) {
      throw new ValidationError("Input text must be at least 100 characters long");
    }

    if (inputText.length > 10000) {
      throw new ValidationError("Input text must not exceed 10,000 characters");
    }

    // Get API key from parameter, instance default, or environment
    const openRouterApiKey = apiKey || this.defaultApiKey || import.meta.env.OPENROUTER_API_KEY;
    if (!openRouterApiKey) {
      throw new FlashcardGenerationError(
        "OpenRouter API key is not configured. Please set OPENROUTER_API_KEY environment variable."
      );
    }

    try {
      // Initialize OpenRouter service
      const openRouter = new OpenRouterService({
        apiKey: openRouterApiKey,
        model: "openai/gpt-4o-mini",
        timeout: 60000, // 60 second timeout for generation
        maxRetries: 2,
      });

      // Build messages for AI
      const messages = buildFlashcardGenerationMessages(inputText);

      // Define response format with JSON schema
      const responseFormat: ResponseFormat<FlashcardGenerationResponse> = {
        type: "json_schema",
        json_schema: {
          name: "flashcard_generation",
          strict: true,
          schema: FLASHCARD_GENERATION_JSON_SCHEMA,
        },
        validator: FlashcardGenerationResponseSchema,
      };

      // Call OpenRouter API
      const response = await openRouter.chat<FlashcardGenerationResponse>(messages, {
        responseFormat,
        temperature: 0.7,
        maxTokens: 4000,
      });

      // Validate that we got parsed content
      if (!response.parsedContent) {
        throw new FlashcardGenerationError("AI response did not contain valid flashcard data");
      }

      // Transform AI response to GeneratedCardPreview format
      const cards: GeneratedCardPreview[] = response.parsedContent.flashcards.map((card, index) => ({
        index,
        front_text: card.question,
        back_text: card.answer,
      }));

      // Validate we got at least some cards
      if (cards.length === 0) {
        throw new FlashcardGenerationError("AI did not generate any flashcards");
      }

      return {
        cards,
        modelUsed: response.model,
      };
    } catch (error) {
      // Handle specific OpenRouter errors
      if (error instanceof OpenRouterRateLimitError) {
        throw new FlashcardGenerationError("Rate limit exceeded. Please try again in a few moments.", error);
      }

      if (error instanceof OpenRouterValidationError) {
        throw new FlashcardGenerationError(
          "Failed to generate valid flashcards. Please try with different input text.",
          error
        );
      }

      if (error instanceof OpenRouterError) {
        throw new FlashcardGenerationError("AI service is temporarily unavailable. Please try again later.", error);
      }

      // Re-throw validation errors as-is
      if (error instanceof ValidationError) {
        throw error;
      }

      // Re-throw FlashcardGenerationError as-is
      if (error instanceof FlashcardGenerationError) {
        throw error;
      }

      // Wrap unexpected errors
      throw new FlashcardGenerationError("An unexpected error occurred during flashcard generation", error);
    }
  }

  /**
   * ============================================================================
   * REVIEW METHODS
   * ============================================================================
   */

  /**
   * Fetches an AI generation batch and verifies it belongs to the user
   */
  async getAIGenerationBatch(batchId: string, userId: string): Promise<AIGenerationBatchEntity | null> {
    const { data, error } = await this.supabase
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
  async getUserFlashcardCount(userId: string): Promise<number> {
    const { count, error } = await this.supabase
      .from("flashcards")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId);

    if (error) {
      throw new Error(`Failed to count user flashcards: ${error.message}`);
    }

    return count ?? 0;
  }

  /**
   * Helper method to omit user_id from flashcard entity
   */
  private static mapToFlashcardDTO(
    flashcard: FlashcardInsert & { id: string; created_at: string; updated_at: string }
  ): FlashcardDTO {
    return {
      id: flashcard.id,
      front_text: flashcard.front_text,
      back_text: flashcard.back_text,
      generation_batch_id: flashcard.generation_batch_id ?? null,
      is_ai_generated: flashcard.is_ai_generated,
      was_edited: flashcard.was_edited,
      created_at: flashcard.created_at,
      updated_at: flashcard.updated_at,
    };
  }

  /**
   * Main service method for reviewing AI-generated flashcards
   * Handles all business logic including validation, limits, and database operations
   */
  async reviewAIGeneratedFlashcards(
    batchId: string,
    userId: string,
    decisions: ReviewDecision[]
  ): Promise<ReviewFlashcardsResponse> {
    // 1. Fetch batch with ownership check
    const batch = await this.getAIGenerationBatch(batchId, userId);
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
    const currentCount = await this.getUserFlashcardCount(userId);
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
      const { data: insertedData, error: insertError } = await this.supabase
        .from("flashcards")
        .insert(flashcardsToInsert)
        .select();

      if (insertError) {
        throw new Error(`Failed to insert flashcards: ${insertError.message}`);
      }

      createdFlashcards = insertedData ?? [];
    }

    // Update batch statistics
    const { error: updateError } = await this.supabase
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
      created_flashcards: createdFlashcards.map(FlashcardBatchService.mapToFlashcardDTO),
    };
  }
}
