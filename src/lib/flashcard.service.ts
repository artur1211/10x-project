import type { SupabaseClient } from "@/db/supabase.client";
import type { FlashcardDTO, FlashcardInsert, FlashcardUpdate, UserFlashcardStats, FlashcardEntity } from "@/types";
import { NotFoundError, ForbiddenError } from "./flashcard.errors";

/**
 * Constants
 */
const FLASHCARD_LIMIT_PER_USER = 500;

/**
 * FlashcardService handles all business logic for flashcard CRUD operations
 */
export class FlashcardService {
  private readonly supabase: SupabaseClient;

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase;
  }

  /**
   * ============================================================================
   * HELPER METHODS
   * ============================================================================
   */

  /**
   * Helper method to map FlashcardEntity to FlashcardDTO (omits user_id)
   */
  private static mapToFlashcardDTO(flashcard: FlashcardEntity): FlashcardDTO {
    return {
      id: flashcard.id,
      front_text: flashcard.front_text,
      back_text: flashcard.back_text,
      generation_batch_id: flashcard.generation_batch_id,
      is_ai_generated: flashcard.is_ai_generated,
      was_edited: flashcard.was_edited,
      created_at: flashcard.created_at,
      updated_at: flashcard.updated_at,
    };
  }

  /**
   * Gets the total count of flashcards for a user
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
   * Gets user flashcard statistics
   */
  async getUserFlashcardStats(userId: string): Promise<UserFlashcardStats> {
    const totalFlashcards = await this.getUserFlashcardCount(userId);

    return {
      total_flashcards: totalFlashcards,
      flashcard_limit: FLASHCARD_LIMIT_PER_USER,
      remaining_capacity: Math.max(0, FLASHCARD_LIMIT_PER_USER - totalFlashcards),
    };
  }

  /**
   * ============================================================================
   * CREATE METHODS
   * ============================================================================
   */

  /**
   * Creates a new manual flashcard
   * Enforces the 500 card limit per user
   */
  async createFlashcard(userId: string, frontText: string, backText: string): Promise<FlashcardDTO> {
    // 1. Check flashcard limit
    const stats = await this.getUserFlashcardStats(userId);
    if (stats.remaining_capacity === 0) {
      throw new ForbiddenError(
        "You have reached the limit of 500 flashcards. Delete some cards to create new ones.",
        stats.total_flashcards,
        FLASHCARD_LIMIT_PER_USER
      );
    }

    // 2. Prepare flashcard data
    const flashcardInsert: FlashcardInsert = {
      user_id: userId,
      front_text: frontText,
      back_text: backText,
      is_ai_generated: false,
      was_edited: false,
      generation_batch_id: null,
    };

    // 3. Insert into database
    const { data, error } = await this.supabase.from("flashcards").insert(flashcardInsert).select().single();

    if (error || !data) {
      throw new Error(`Failed to create flashcard: ${error?.message || "Unknown error"}`);
    }

    // 4. Return DTO
    return FlashcardService.mapToFlashcardDTO(data);
  }

  /**
   * ============================================================================
   * READ METHODS
   * ============================================================================
   */

  /**
   * Gets a paginated, sorted, and filtered list of flashcards for a user
   */
  async getFlashcards(
    userId: string,
    options: {
      page: number;
      limit: number;
      search?: string;
      sortBy: "created_at" | "updated_at";
      sortOrder: "asc" | "desc";
    }
  ): Promise<{ flashcards: FlashcardDTO[]; totalCount: number }> {
    const { page, limit, search, sortBy, sortOrder } = options;

    // Calculate offset for pagination
    const offset = (page - 1) * limit;

    // Build base query
    let query = this.supabase.from("flashcards").select("*", { count: "exact" }).eq("user_id", userId);

    // Apply search filter if provided
    if (search && search.trim()) {
      const searchTerm = `%${search.trim()}%`;
      query = query.or(`front_text.ilike.${searchTerm},back_text.ilike.${searchTerm}`);
    }

    // Apply sorting
    query = query.order(sortBy, { ascending: sortOrder === "asc" });

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    // Execute query
    const { data, error, count } = await query;

    if (error) {
      throw new Error(`Failed to fetch flashcards: ${error.message}`);
    }

    return {
      flashcards: (data || []).map(FlashcardService.mapToFlashcardDTO),
      totalCount: count ?? 0,
    };
  }

  /**
   * Gets a single flashcard by ID
   * Ensures the flashcard belongs to the user (authorization check)
   */
  async getFlashcardById(userId: string, flashcardId: string): Promise<FlashcardDTO> {
    const { data, error } = await this.supabase
      .from("flashcards")
      .select("*")
      .eq("id", flashcardId)
      .eq("user_id", userId)
      .single();

    if (error || !data) {
      throw new NotFoundError("Flashcard not found or does not belong to user");
    }

    return FlashcardService.mapToFlashcardDTO(data);
  }

  /**
   * ============================================================================
   * UPDATE METHODS
   * ============================================================================
   */

  /**
   * Updates an existing flashcard
   * Sets was_edited=true when applied
   * Ensures the flashcard belongs to the user (authorization check)
   */
  async updateFlashcard(
    userId: string,
    flashcardId: string,
    updates: {
      frontText?: string;
      backText?: string;
    }
  ): Promise<FlashcardDTO> {
    // 1. Verify flashcard exists and belongs to user
    await this.getFlashcardById(userId, flashcardId);

    // 2. Prepare update data
    const flashcardUpdate: FlashcardUpdate = {
      was_edited: true,
    };

    if (updates.frontText !== undefined) {
      flashcardUpdate.front_text = updates.frontText;
    }

    if (updates.backText !== undefined) {
      flashcardUpdate.back_text = updates.backText;
    }

    // 3. Update in database
    const { data, error } = await this.supabase
      .from("flashcards")
      .update(flashcardUpdate)
      .eq("id", flashcardId)
      .eq("user_id", userId)
      .select()
      .single();

    if (error || !data) {
      throw new Error(`Failed to update flashcard: ${error?.message || "Unknown error"}`);
    }

    // 4. Return updated DTO
    return FlashcardService.mapToFlashcardDTO(data);
  }

  /**
   * ============================================================================
   * DELETE METHODS
   * ============================================================================
   */

  /**
   * Deletes a single flashcard
   * Ensures the flashcard belongs to the user (authorization check)
   */
  async deleteFlashcard(userId: string, flashcardId: string): Promise<string> {
    // 1. Verify flashcard exists and belongs to user
    await this.getFlashcardById(userId, flashcardId);

    // 2. Delete from database
    const { error } = await this.supabase.from("flashcards").delete().eq("id", flashcardId).eq("user_id", userId);

    if (error) {
      throw new Error(`Failed to delete flashcard: ${error.message}`);
    }

    // 3. Return deleted ID
    return flashcardId;
  }

  /**
   * Deletes multiple flashcards in bulk
   * Ensures all flashcards belong to the user (authorization check)
   */
  async deleteFlashcards(
    userId: string,
    flashcardIds: string[]
  ): Promise<{ deletedIds: string[]; deletedCount: number }> {
    // 1. Filter to only IDs that exist and belong to user
    const { data: existingFlashcards, error: fetchError } = await this.supabase
      .from("flashcards")
      .select("id")
      .eq("user_id", userId)
      .in("id", flashcardIds);

    if (fetchError) {
      throw new Error(`Failed to verify flashcards: ${fetchError.message}`);
    }

    // Get list of IDs that actually exist and belong to user
    const validIds = (existingFlashcards || []).map((fc) => fc.id);

    // If no valid IDs, nothing to delete
    if (validIds.length === 0) {
      return {
        deletedIds: [],
        deletedCount: 0,
      };
    }

    // 2. Delete the flashcards
    const { error: deleteError } = await this.supabase
      .from("flashcards")
      .delete()
      .eq("user_id", userId)
      .in("id", validIds);

    if (deleteError) {
      throw new Error(`Failed to delete flashcards: ${deleteError.message}`);
    }

    // 3. Return result
    return {
      deletedIds: validIds,
      deletedCount: validIds.length,
    };
  }
}
