import type { APIContext } from "astro";
import { createFlashcardSchema, getFlashcardsQuerySchema, bulkDeleteSchema } from "@/lib/flashcard.schemas";
import { FlashcardService } from "@/lib/flashcard.service";
import { ForbiddenError } from "@/lib/flashcard.errors";
import type {
  ApiError,
  FlashcardsListResponse,
  FlashcardDTO,
  DeleteFlashcardsResponse,
  PaginationMetadata,
} from "@/types";

export const prerender = false;

/**
 * GET /api/flashcards
 *
 * Retrieves a paginated, sorted, and searchable list of the user's flashcards.
 *
 * Query parameters:
 * - page (integer, default: 1): Page number for pagination
 * - limit (integer, default: 20, max: 100): Number of items per page
 * - search (string, optional): Text to search in front_text and back_text
 * - sort_by (enum: "created_at" | "updated_at", default: "created_at"): Field to sort by
 * - sort_order (enum: "asc" | "desc", default: "desc"): Sorting direction
 *
 * @param context - Astro API context
 * @returns FlashcardsListResponse with flashcards, pagination metadata, and user stats (200)
 *          or error response (400, 401, 500)
 */
export async function GET(context: APIContext): Promise<Response> {
  // 1. Check authentication
  const { user } = context.locals;
  if (!user) {
    const errorResponse: ApiError = {
      error: "UNAUTHORIZED",
      message: "Authentication required",
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const userId = user.id;

  // 2. Extract and validate query parameters
  const url = new URL(context.request.url);
  const queryParams = {
    page: url.searchParams.get("page"),
    limit: url.searchParams.get("limit"),
    search: url.searchParams.get("search") || undefined,
    sort_by: url.searchParams.get("sort_by") || undefined,
    sort_order: url.searchParams.get("sort_order") || undefined,
  };

  const validationResult = getFlashcardsQuerySchema.safeParse(queryParams);
  if (!validationResult.success) {
    const errorResponse: ApiError = {
      error: "VALIDATION_ERROR",
      message: "Invalid query parameters",
      details: validationResult.error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      })),
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { page, limit, search, sort_by, sort_order } = validationResult.data;

  // 3. Call service methods
  try {
    const flashcardService = new FlashcardService(context.locals.supabase);

    // Fetch flashcards and stats in parallel
    const [{ flashcards, totalCount }, userStats] = await Promise.all([
      flashcardService.getFlashcards(userId, {
        page,
        limit,
        search,
        sortBy: sort_by,
        sortOrder: sort_order,
      }),
      flashcardService.getUserFlashcardStats(userId),
    ]);

    // 4. Build pagination metadata
    const totalPages = Math.ceil(totalCount / limit);
    const pagination: PaginationMetadata = {
      current_page: page,
      total_pages: totalPages,
      total_count: totalCount,
      limit,
    };

    // 5. Return response
    const response: FlashcardsListResponse = {
      flashcards,
      pagination,
      user_stats: userStats,
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Unexpected error in GET /api/flashcards:", error);
    const errorResponse: ApiError = {
      error: "INTERNAL_SERVER_ERROR",
      message: "Failed to fetch flashcards",
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

/**
 * POST /api/flashcards
 *
 * Creates a new manual flashcard.
 *
 * Request body (CreateFlashcardCommand):
 * - front_text (string, 10-500 characters): Front side of the flashcard
 * - back_text (string, 10-1000 characters): Back side of the flashcard
 *
 * @param context - Astro API context
 * @returns Created flashcard (201) or error response (400, 401, 403, 500)
 */
export async function POST(context: APIContext): Promise<Response> {
  // 1. Check authentication
  const { user } = context.locals;
  if (!user) {
    const errorResponse: ApiError = {
      error: "UNAUTHORIZED",
      message: "Authentication required",
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const userId = user.id;

  // 2. Parse request body
  let requestBody;
  try {
    requestBody = await context.request.json();
  } catch {
    const errorResponse: ApiError = {
      error: "VALIDATION_ERROR",
      message: "Invalid JSON body",
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // 3. Validate request body with Zod
  const validationResult = createFlashcardSchema.safeParse(requestBody);
  if (!validationResult.success) {
    const errorResponse: ApiError = {
      error: "VALIDATION_ERROR",
      message: "Invalid flashcard data",
      details: validationResult.error.issues.map((issue) => {
        const field = issue.path.join(".");
        const message = issue.message;

        // Extract length information if available
        let receivedLength: number | undefined;
        if (field === "front_text" && requestBody.front_text) {
          receivedLength = requestBody.front_text.length;
        } else if (field === "back_text" && requestBody.back_text) {
          receivedLength = requestBody.back_text.length;
        }

        return {
          field,
          message,
          ...(receivedLength !== undefined && { received_length: receivedLength }),
        };
      }),
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { front_text, back_text } = validationResult.data;

  // 4. Call service method with error handling
  try {
    const flashcardService = new FlashcardService(context.locals.supabase);
    const createdFlashcard: FlashcardDTO = await flashcardService.createFlashcard(userId, front_text, back_text);

    return new Response(JSON.stringify(createdFlashcard), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // Handle specific error types
    if (error instanceof ForbiddenError) {
      const errorResponse: ApiError = {
        error: "FLASHCARD_LIMIT_EXCEEDED",
        message: error.message,
        current_count: error.currentCount,
        limit: error.limit,
        suggestion: "Delete some existing flashcards to create new ones",
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Generic error handler
    // eslint-disable-next-line no-console
    console.error("Unexpected error in POST /api/flashcards:", error);
    const errorResponse: ApiError = {
      error: "INTERNAL_SERVER_ERROR",
      message: "Failed to create flashcard",
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

/**
 * DELETE /api/flashcards
 *
 * Deletes multiple flashcards in bulk.
 *
 * Query parameters:
 * - ids (string, required): Comma-separated list of flashcard UUIDs
 *
 * @param context - Astro API context
 * @returns DeleteFlashcardsResponse with count and deleted IDs (200)
 *          or error response (400, 401, 500)
 */
export async function DELETE(context: APIContext): Promise<Response> {
  // 1. Check authentication
  const { user } = context.locals;
  if (!user) {
    const errorResponse: ApiError = {
      error: "UNAUTHORIZED",
      message: "Authentication required",
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const userId = user.id;

  // 2. Extract and validate query parameter
  const url = new URL(context.request.url);
  const ids = url.searchParams.get("ids");

  const validationResult = bulkDeleteSchema.safeParse({ ids });
  if (!validationResult.success) {
    const errorResponse: ApiError = {
      error: "VALIDATION_ERROR",
      message: "Invalid IDs parameter",
      details: validationResult.error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      })),
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // 3. Parse IDs into array
  const flashcardIds = validationResult.data.ids
    .split(",")
    .map((id) => id.trim())
    .filter((id) => id.length > 0);

  // 4. Call service method
  try {
    const flashcardService = new FlashcardService(context.locals.supabase);
    const result = await flashcardService.deleteFlashcards(userId, flashcardIds);

    const response: DeleteFlashcardsResponse = {
      message: `Successfully deleted ${result.deletedCount} flashcard(s)`,
      deleted_count: result.deletedCount,
      deleted_ids: result.deletedIds,
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // Generic error handler
    // eslint-disable-next-line no-console
    console.error("Unexpected error in DELETE /api/flashcards:", error);
    const errorResponse: ApiError = {
      error: "INTERNAL_SERVER_ERROR",
      message: "Failed to delete flashcards",
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
