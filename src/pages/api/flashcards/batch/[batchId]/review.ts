import type { APIContext } from "astro";
import { DEFAULT_USER_ID } from "@/db/supabase.client";
import { reviewFlashcardsSchema } from "@/lib/flashcardBatch.schemas";
import { FlashcardBatchService } from "@/lib/flashcardBatch.service.ts";
import {
  BatchNotFoundError,
  BatchAlreadyReviewedError,
  FlashcardLimitExceededError,
  ValidationError,
} from "@/lib/flashcardBatch.errors";
import type { ApiError, ReviewFlashcardsResponse } from "@/types";

export const prerender = false;

/**
 * Helper function to validate UUID format
 */
function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

/**
 * POST /api/flashcards/batch/:batchId/review
 *
 * Processes user review decisions for AI-generated flashcards.
 * Accepts, rejects, or edits generated flashcards based on user decisions.
 *
 * @param context - Astro API context containing request and locals
 * @returns Response with created flashcards and review statistics (201)
 *          or error response (400, 403, 404, 409, 500)
 */
export async function POST(context: APIContext): Promise<Response> {
  // 1. Extract and validate path parameter (batchId)
  const { batchId } = context.params;

  if (!batchId || !isValidUUID(batchId)) {
    const errorResponse: ApiError = {
      error: "VALIDATION_ERROR",
      message: "Invalid batch ID format. Must be a valid UUID.",
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // 2. Use DEFAULT_USER_ID for MVP (no real auth)
  if (!DEFAULT_USER_ID) {
    const errorResponse: ApiError = {
      error: "INTERNAL_SERVER_ERROR",
      message: "Default user not configured",
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  const userId = DEFAULT_USER_ID;

  // 3. Parse request body
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

  // 4. Validate request body with Zod
  const validationResult = reviewFlashcardsSchema.safeParse(requestBody);
  if (!validationResult.success) {
    const errorResponse: ApiError = {
      error: "VALIDATION_ERROR",
      message: "Invalid review decisions",
      details: validationResult.error.issues.map((issue) => {
        const field = issue.path.join(".");
        const message = issue.message;

        // Try to extract length information if available
        let receivedLength: number | undefined;
        if (field.includes("front_text") && requestBody.decisions) {
          const match = field.match(/decisions\[(\d+)\]\.front_text/);
          if (match) {
            const index = parseInt(match[1], 10);
            receivedLength = requestBody.decisions[index]?.front_text?.length;
          }
        } else if (field.includes("back_text") && requestBody.decisions) {
          const match = field.match(/decisions\[(\d+)\]\.back_text/);
          if (match) {
            const index = parseInt(match[1], 10);
            receivedLength = requestBody.decisions[index]?.back_text?.length;
          }
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

  const { decisions } = validationResult.data;

  // 5. Call service method with error handling
  try {
    const flashcardBatchService = new FlashcardBatchService(context.locals.supabase);
    const result: ReviewFlashcardsResponse = await flashcardBatchService.reviewAIGeneratedFlashcards(
      batchId,
      userId,
      decisions
    );

    return new Response(JSON.stringify(result), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // Handle specific error types with appropriate HTTP status codes
    if (error instanceof BatchNotFoundError) {
      const errorResponse: ApiError = {
        error: "BATCH_NOT_FOUND",
        message: error.message,
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (error instanceof BatchAlreadyReviewedError) {
      const errorResponse: ApiError = {
        error: "BATCH_ALREADY_REVIEWED",
        message: error.message,
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 409,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (error instanceof FlashcardLimitExceededError) {
      const errorResponse: ApiError = {
        error: "FLASHCARD_LIMIT_EXCEEDED",
        message: error.message,
        current_count: error.currentCount,
        limit: error.limit,
        suggestion: "Delete some existing flashcards or reject more generated cards",
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (error instanceof ValidationError) {
      const errorResponse: ApiError = {
        error: "VALIDATION_ERROR",
        message: error.message,
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Generic error handler
    console.error("Unexpected error in review endpoint:", error);
    const errorResponse: ApiError = {
      error: "INTERNAL_SERVER_ERROR",
      message: "Failed to process review",
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
