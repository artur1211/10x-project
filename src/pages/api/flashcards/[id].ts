import type { APIContext } from "astro";
import { updateFlashcardSchema, uuidParamSchema } from "@/lib/flashcard.schemas";
import { FlashcardService } from "@/lib/flashcard.service";
import { NotFoundError } from "@/lib/flashcard.errors";
import type { ApiError, FlashcardDTO, DeleteFlashcardResponse } from "@/types";

export const prerender = false;

/**
 * Helper function to validate and extract UUID from path parameter
 */
function validateUuidParam(id: string | undefined): { valid: boolean; error?: ApiError } {
  const validationResult = uuidParamSchema.safeParse({ id });
  if (!validationResult.success) {
    return {
      valid: false,
      error: {
        error: "VALIDATION_ERROR",
        message: "Invalid flashcard ID format. Must be a valid UUID.",
        details: validationResult.error.issues.map((issue) => ({
          field: issue.path.join("."),
          message: issue.message,
        })),
      },
    };
  }
  return { valid: true };
}

/**
 * GET /api/flashcards/:id
 *
 * Retrieves a single flashcard by its ID.
 *
 * @param context - Astro API context
 * @returns FlashcardDTO (200) or error response (400, 401, 404, 500)
 */
export async function GET(context: APIContext): Promise<Response> {
  // 1. Extract and validate path parameter
  const { id } = context.params;
  const uuidValidation = validateUuidParam(id);
  if (!uuidValidation.valid) {
    return new Response(JSON.stringify(uuidValidation.error), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // 2. Check authentication
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

  // 3. Call service method
  try {
    const flashcardService = new FlashcardService(context.locals.supabase);
    const flashcard: FlashcardDTO = await flashcardService.getFlashcardById(userId, id as string);

    return new Response(JSON.stringify(flashcard), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // Handle specific error types
    if (error instanceof NotFoundError) {
      const errorResponse: ApiError = {
        error: "FLASHCARD_NOT_FOUND",
        message: error.message,
        resource_type: "flashcard",
        resource_id: id,
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Generic error handler
    // eslint-disable-next-line no-console
    console.error("Unexpected error in GET /api/flashcards/:id:", error);
    const errorResponse: ApiError = {
      error: "INTERNAL_SERVER_ERROR",
      message: "Failed to fetch flashcard",
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

/**
 * PATCH /api/flashcards/:id
 *
 * Updates an existing flashcard.
 * Sets was_edited=true when applied.
 *
 * Request body (UpdateFlashcardCommand):
 * - front_text (string, optional, 10-500 characters): Updated front side
 * - back_text (string, optional, 10-1000 characters): Updated back side
 * - At least one field must be provided
 *
 * @param context - Astro API context
 * @returns Updated FlashcardDTO (200) or error response (400, 401, 404, 500)
 */
export async function PATCH(context: APIContext): Promise<Response> {
  // 1. Extract and validate path parameter
  const { id } = context.params;
  const uuidValidation = validateUuidParam(id);
  if (!uuidValidation.valid) {
    return new Response(JSON.stringify(uuidValidation.error), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // 2. Check authentication
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
  const validationResult = updateFlashcardSchema.safeParse(requestBody);
  if (!validationResult.success) {
    const errorResponse: ApiError = {
      error: "VALIDATION_ERROR",
      message: "Invalid update data",
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

  // 5. Call service method with error handling
  try {
    const flashcardService = new FlashcardService(context.locals.supabase);
    const updatedFlashcard: FlashcardDTO = await flashcardService.updateFlashcard(userId, id as string, {
      frontText: front_text,
      backText: back_text,
    });

    return new Response(JSON.stringify(updatedFlashcard), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // Handle specific error types
    if (error instanceof NotFoundError) {
      const errorResponse: ApiError = {
        error: "FLASHCARD_NOT_FOUND",
        message: error.message,
        resource_type: "flashcard",
        resource_id: id,
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Generic error handler
    // eslint-disable-next-line no-console
    console.error("Unexpected error in PATCH /api/flashcards/:id:", error);
    const errorResponse: ApiError = {
      error: "INTERNAL_SERVER_ERROR",
      message: "Failed to update flashcard",
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

/**
 * DELETE /api/flashcards/:id
 *
 * Deletes a single flashcard.
 *
 * @param context - Astro API context
 * @returns DeleteFlashcardResponse (200) or error response (400, 401, 404, 500)
 */
export async function DELETE(context: APIContext): Promise<Response> {
  // 1. Extract and validate path parameter
  const { id } = context.params;
  const uuidValidation = validateUuidParam(id);
  if (!uuidValidation.valid) {
    return new Response(JSON.stringify(uuidValidation.error), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // 2. Check authentication
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

  // 3. Call service method
  try {
    const flashcardService = new FlashcardService(context.locals.supabase);
    const deletedId = await flashcardService.deleteFlashcard(userId, id as string);

    const response: DeleteFlashcardResponse = {
      message: "Flashcard deleted successfully",
      id: deletedId,
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // Handle specific error types
    if (error instanceof NotFoundError) {
      const errorResponse: ApiError = {
        error: "FLASHCARD_NOT_FOUND",
        message: error.message,
        resource_type: "flashcard",
        resource_id: id,
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Generic error handler
    // eslint-disable-next-line no-console
    console.error("Unexpected error in DELETE /api/flashcards/:id:", error);
    const errorResponse: ApiError = {
      error: "INTERNAL_SERVER_ERROR",
      message: "Failed to delete flashcard",
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
