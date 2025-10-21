import { z } from "zod";

// ============================================================================
// Flashcard CRUD Schemas
// ============================================================================

/**
 * Schema for creating a manual flashcard
 * POST /api/flashcards
 */
export const createFlashcardSchema = z.object({
  front_text: z
    .string()
    .min(10, "Front text must be at least 10 characters")
    .max(500, "Front text must not exceed 500 characters")
    .trim(),
  back_text: z
    .string()
    .min(10, "Back text must be at least 10 characters")
    .max(1000, "Back text must not exceed 1000 characters")
    .trim(),
});

export type CreateFlashcardInput = z.infer<typeof createFlashcardSchema>;

/**
 * Schema for updating a flashcard
 * PATCH /api/flashcards/:id
 */
export const updateFlashcardSchema = z
  .object({
    front_text: z
      .string()
      .min(10, "Front text must be at least 10 characters")
      .max(500, "Front text must not exceed 500 characters")
      .trim()
      .optional(),
    back_text: z
      .string()
      .min(10, "Back text must be at least 10 characters")
      .max(1000, "Back text must not exceed 1000 characters")
      .trim()
      .optional(),
  })
  .refine((data) => data.front_text !== undefined || data.back_text !== undefined, {
    message: "At least one of front_text or back_text must be provided",
  });

export type UpdateFlashcardInput = z.infer<typeof updateFlashcardSchema>;

/**
 * Schema for query parameters in GET /api/flashcards
 */
export const getFlashcardsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce
    .number()
    .int()
    .positive()
    .default(20)
    .refine((val) => val <= 100, {
      message: "Limit cannot exceed 100",
    }),
  search: z.string().optional(),
  sort_by: z.enum(["created_at", "updated_at"]).default("created_at"),
  sort_order: z.enum(["asc", "desc"]).default("desc"),
});

export type GetFlashcardsQuery = z.infer<typeof getFlashcardsQuerySchema>;

/**
 * Schema for bulk delete query parameter
 * DELETE /api/flashcards?ids=uuid1,uuid2,uuid3
 */
export const bulkDeleteSchema = z.object({
  ids: z
    .string()
    .min(1, "At least one ID is required")
    .refine(
      (val) => {
        // Split by comma and validate each UUID
        const ids = val.split(",").map((id) => id.trim());
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        return ids.every((id) => uuidRegex.test(id));
      },
      {
        message: "All IDs must be valid UUIDs",
      }
    ),
});

export type BulkDeleteInput = z.infer<typeof bulkDeleteSchema>;

/**
 * Schema for UUID path parameter validation
 */
export const uuidParamSchema = z.object({
  id: z.string().uuid("Invalid UUID format"),
});

export type UuidParam = z.infer<typeof uuidParamSchema>;
