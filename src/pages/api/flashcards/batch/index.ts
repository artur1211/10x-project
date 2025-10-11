import type { APIContext } from "astro";
import { generateFlashcardsSchema } from "@/lib/flashcardBatch.schemas.ts";
import { generateFlashcardsFromText } from "@/lib/flashcardBatch.service.ts";
import type { GenerateFlashcardsResponse, ApiError, AIGenerationBatchInsert } from "@/types";
import { DEFAULT_USER_ID } from "@/db/supabase.client";

export const prerender = false;

export async function POST(context: APIContext): Promise<Response> {
  // 1. Verify DEFAULT_USER_ID is configured
  if (!DEFAULT_USER_ID) {
    const errorResponse: ApiError = {
      error: "Unauthorized",
      message: "Default user not configured",
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const userId = DEFAULT_USER_ID;

  // 2. Parse and validate request body
  let requestBody;
  try {
    requestBody = await context.request.json();
  } catch {
    const errorResponse: ApiError = {
      error: "Bad Request",
      message: "Invalid JSON body",
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Validate with Zod
  const validationResult = generateFlashcardsSchema.safeParse(requestBody);
  if (!validationResult.success) {
    const errorResponse: ApiError = {
      error: "Bad Request",
      message: "Validation failed",
      details: validationResult.error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
        received_length: requestBody.input_text?.length,
      })),
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { input_text } = validationResult.data;

  // 3. Call mock generation service
  const startTime = Date.now();
  const generationResult = await generateFlashcardsFromText(input_text);
  const timeTakenMs = Date.now() - startTime;

  // 4. Create batch record
  const batchInsert: AIGenerationBatchInsert = {
    user_id: userId,
    generated_at: new Date().toISOString(),
    input_text_length: input_text.length,
    total_cards_generated: generationResult.cards.length,
    cards_accepted: 0,
    cards_rejected: 0,
    cards_edited: 0,
    time_taken_ms: timeTakenMs,
    model_used: generationResult.modelUsed,
  };

  const { data: batchData, error: dbError } = await context.locals.supabase
    .from("ai_generation_batches")
    .insert(batchInsert)
    .select()
    .single();

  if (dbError || !batchData) {
    console.error(dbError);

    const errorResponse: ApiError = {
      error: "Internal Server Error",
      message: "An unexpected error occurred while processing your request",
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  // 5. Return response
  const response: GenerateFlashcardsResponse = {
    batch_id: batchData.id,
    generated_at: batchData.generated_at,
    input_text_length: batchData.input_text_length,
    generated_cards: generationResult.cards.map((card, index) => ({
      index,
      front_text: card.front_text,
      back_text: card.back_text,
    })),
    total_cards_generated: batchData.total_cards_generated,
    time_taken_ms: batchData.time_taken_ms,
    model_used: batchData.model_used,
  };

  return new Response(JSON.stringify(response), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
