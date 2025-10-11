# API Endpoint Implementation Plan: Generate Flashcards from Text

## 1. Endpoint Overview

This endpoint enables users to generate flashcards from input text using AI. The system processes text between 1,000-10,000 characters and generates flashcards using mock AI generation. The generated flashcards are returned as previews for user review and are NOT immediately persisted to the database. Instead, a batch record is created to track the generation attempt, and users must submit their review decisions through a separate endpoint to persist accepted cards.

**Key Characteristics:**

- Mock AI generation for MVP (returns 3 static flashcards)
- Creates batch tracking record immediately
- Returns preview cards for user review
- Does not persist cards to flashcards table until review
- Uses DEFAULT_USER_ID for simplified authentication (full auth to be implemented later)

## 2. Request Details

- **HTTP Method:** `POST`
- **URL Structure:** `/api/flashcards/generate`
- **Authentication:** Simplified for MVP (uses DEFAULT_USER_ID from `src/db/supabase.client.ts`)
- **Content-Type:** `application/json`

### Parameters

**Required:**

- `input_text` (string): Text content to generate flashcards from
  - Minimum: 1,000 characters
  - Maximum: 10,000 characters
  - Must be non-empty after trimming

**Optional:**

- None

### Request Body Example

```json
{
  "input_text": "Lorem ipsum dolor sit amet, consectetur adipiscing elit... (1000-10000 chars)"
}
```

## 3. Used Types

### Input Types

- **`GenerateFlashcardsCommand`** (from `src/types.ts`)
  - `input_text: string` - The text to generate flashcards from

### Output Types

- **`GenerateFlashcardsResponse`** (from `src/types.ts`)
  - `batch_id: string` - UUID of the created batch
  - `generated_at: string` - ISO 8601 timestamp
  - `input_text_length: number` - Character count of input
  - `generated_cards: GeneratedCardPreview[]` - Array of preview cards
  - `total_cards_generated: number` - Total count of generated cards
  - `time_taken_ms: number` - Generation duration in milliseconds
  - `model_used: string` - Model identifier (mock-generator-v1 for MVP)

- **`GeneratedCardPreview`** (from `src/types.ts`)
  - `index: number` - Card index in generation batch
  - `front_text: string` - Front side content
  - `back_text: string` - Back side content

### Database Types

- **`AIGenerationBatchInsert`** (from `src/types.ts`)
  - Used to create batch tracking record

### Error Types

- **`ApiError`** (from `src/types.ts`)
  - Standard error response structure

## 4. Response Details

### Success Response (200 OK)

```json
{
  "batch_id": "550e8400-e29b-41d4-a716-446655440000",
  "generated_at": "2025-10-09T14:30:00.000Z",
  "input_text_length": 2500,
  "generated_cards": [
    {
      "index": 0,
      "front_text": "Sample flashcard question 1",
      "back_text": "Sample flashcard answer 1"
    },
    {
      "index": 1,
      "front_text": "Sample flashcard question 2",
      "back_text": "Sample flashcard answer 2"
    },
    {
      "index": 2,
      "front_text": "Sample flashcard question 3",
      "back_text": "Sample flashcard answer 3"
    }
  ],
  "total_cards_generated": 3,
  "time_taken_ms": 50,
  "model_used": "mock-generator-v1"
}
```

### Error Responses

**401 Unauthorized**

```json
{
  "error": "Unauthorized",
  "message": "Default user not found"
}
```

**400 Bad Request - Validation Error**

```json
{
  "error": "Bad Request",
  "message": "Validation failed",
  "details": [
    {
      "field": "input_text",
      "message": "Text must be at least 1000 characters",
      "received_length": 500
    }
  ]
}
```

**500 Internal Server Error**

```json
{
  "error": "Internal Server Error",
  "message": "An unexpected error occurred while processing your request"
}
```

## 5. Data Flow

### Flow Diagram

```
1. Client Request
   ↓
2. Route Handler (/api/flashcards/generate.ts)
   ↓
3. Get DEFAULT_USER_ID
   ↓
4. Input Validation (Zod Schema)
   ↓
5. Call Mock Flashcard Generation Service
   ↓
6. Generate 3 Static Cards
   ↓
7. Create ai_generation_batches Record
   ↓
8. Return Preview Response to Client
```

### Detailed Flow Description

1. **Client Request**: User submits input text via POST request

2. **Route Handler**: Extract and validate request body
   - Parse JSON body
   - Run Zod validation

3. **Get DEFAULT_USER_ID**: Retrieve default user ID
   - Import DEFAULT_USER_ID from src/db/supabase.client.ts
   - Verify it exists (if not → Return 401)

4. **Input Validation**: Validate against schema
   - Check input_text length (1000-10000 chars)
   - Trim whitespace
   - If invalid → Return 400 with details

5. **Service Call**: Invoke mockFlashcardGenerationService.generate()
   - Pass input text
   - Start timer for performance tracking

6. **Mock Generation**: Return 3 static cards
   - No external API calls
   - Return predefined card structure
   - Simulates AI generation for MVP

7. **Batch Record Creation**: Insert into ai_generation_batches
   - Store: user_id (DEFAULT_USER_ID), input_text_length, total_cards_generated
   - Store: time_taken_ms, model_used (mock-generator-v1), generated_at
   - Initialize: cards_accepted=0, cards_rejected=0, cards_edited=0
   - Get batch_id from insert

8. **Response Return**: Send preview to client
   - Format as GenerateFlashcardsResponse
   - Include batch_id for review endpoint
   - Return 200 OK

### Database Operations

**Read Operations:**

- None (budget checking removed for MVP)

**Write Operations:**

- Insert new record into ai_generation_batches table

**Note:** NO writes to flashcards table occur in this endpoint. Cards are persisted only after review via POST /api/flashcards/batch/:batchId/review.

## 6. Security Considerations

### Authentication & Authorization

- **Simplified Auth for MVP**: Use DEFAULT_USER_ID constant
- **User Verification**: Check that DEFAULT_USER_ID exists
- **Future Enhancement**: Replace with full Supabase authentication

### Input Validation & Sanitization

- **Strict Length Validation**: Enforce 1000-10000 character limit
- **Type Checking**: Use Zod for runtime type safety
- **Trim Whitespace**: Clean input before processing
- **Content Filtering**: Consider filtering malicious or inappropriate content

### Data Privacy

- **User Isolation**: All records tied to DEFAULT_USER_ID for MVP
- **RLS Policies**: Rely on Supabase Row Level Security for data access
- **No Cross-User Access**: Never expose batch_ids across users (future consideration)

### Error Handling Security

- **Generic Error Messages**: Don't expose internal implementation details
- **Log Sensitive Errors**: Log detailed errors server-side only
- **Avoid Stack Traces**: Never return stack traces to client

## 7. Error Handling

### Error Categories & Handling Strategy

#### 1. Authentication Errors (401)

**Scenarios:**

- DEFAULT_USER_ID not defined
- DEFAULT_USER_ID not found in database

**Handling:**

```typescript
import { DEFAULT_USER_ID } from "@/db/supabase.client";

if (!DEFAULT_USER_ID) {
  return new Response(
    JSON.stringify({
      error: "Unauthorized",
      message: "Default user not configured",
    }),
    { status: 401, headers: { "Content-Type": "application/json" } }
  );
}
```

#### 2. Validation Errors (400)

**Scenarios:**

- input_text too short (< 1000 chars)
- input_text too long (> 10000 chars)
- input_text missing or not a string
- Malformed JSON body

**Handling:**

```typescript
// Use Zod for validation
const schema = z.object({
  input_text: z
    .string()
    .min(1000, "Text must be at least 1000 characters")
    .max(10000, "Text must not exceed 10000 characters")
    .trim(),
});

const result = schema.safeParse(requestBody);
if (!result.success) {
  return new Response(
    JSON.stringify({
      error: "Bad Request",
      message: "Validation failed",
      details: result.error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
        received_length: requestBody.input_text?.length,
      })),
    }),
    { status: 400, headers: { "Content-Type": "application/json" } }
  );
}
```

#### 3. Database Errors (500)

**Scenarios:**

- Failed to insert batch record
- Database connection issues
- Constraint violations

**Handling:**

```typescript
try {
  const { data, error } = await context.locals.supabase
    .from("ai_generation_batches")
    .insert(batchData)
    .select()
    .single();

  if (error) {
    console.error("Database error:", error);
    throw error;
  }
} catch (error) {
  console.error("Unexpected database error:", error);

  return new Response(
    JSON.stringify({
      error: "Internal Server Error",
      message: "An unexpected error occurred while processing your request",
    }),
    { status: 500, headers: { "Content-Type": "application/json" } }
  );
}
```

### Error Logging Strategy

**Server-Side Logging:**

- Log all errors with context (user_id, timestamp, error details)
- Include request metadata (input_text_length, model_used)
- Use structured logging for easier debugging
- Sanitize logs to avoid logging sensitive data

**Client-Side Errors:**

- Return user-friendly messages
- Include actionable suggestions when possible
- Provide error codes for support requests

## 8. Performance Considerations

### Potential Bottlenecks

1. **Database Operations**
   - Batch record insertion
   - Minimal impact for MVP

2. **Input Processing**
   - 10,000 character texts validation
   - Parsing and validation overhead

### Optimization Strategies

1. **Mock Generation**
   - Instant response (no external API calls)
   - Consistent performance
   - Simulates ~50ms for realistic timing

2. **Input Validation**
   - Fail fast on validation errors
   - Avoid expensive operations before validation

3. **Future Considerations**
   - When switching to real AI: implement timeout handling
   - Consider caching generated previews temporarily
   - Monitor API performance

### Performance Monitoring

**Logging:**

- Log time_taken_ms for each generation
- Track model used (mock-generator-v1 for MVP)

## 9. Implementation Steps

### Step 1: Add DEFAULT_USER_ID to Supabase Client

**File:** `src/db/supabase.client.ts`

```typescript
import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types.ts";

const supabaseUrl = import.meta.env.SUPABASE_URL;
const supabaseAnonKey = import.meta.env.SUPABASE_KEY;

export const supabaseClient = createClient<Database>(supabaseUrl, supabaseAnonKey);
export type SupabaseClient = typeof supabaseClient;

// Default user ID for MVP (replace with real auth later)
export const DEFAULT_USER_ID = import.meta.env.DEFAULT_USER_ID || "00000000-0000-0000-0000-000000000000";
```

### Step 2: Create Zod Validation Schema

**File:** `src/lib/schemas/flashcardBatch.schemas.ts`

```typescript
import { z } from "zod";

export const generateFlashcardsSchema = z.object({
  input_text: z
    .string()
    .min(1000, "Text must be at least 1000 characters")
    .max(10000, "Text must not exceed 10000 characters")
    .trim(),
});

export type GenerateFlashcardsInput = z.infer<typeof generateFlashcardsSchema>;
```

### Step 3: Create Mock Flashcard Generation Service

**File:** `src/lib/services/flashcardBatch.service.ts`

**Note:** This service has been unified with the review logic into a single batch service following the unified service pattern.

**Responsibilities:**

- Return 3 static flashcards for MVP
- Simulate realistic generation timing
- Return structured GeneratedCardPreview array

**Key Functions:**

- `generateFlashcardsFromText(inputText: string): Promise<GenerationResult>`

**Implementation:**

```typescript
import type { GeneratedCardPreview } from "@/types";

interface GenerationResult {
  cards: GeneratedCardPreview[];
  modelUsed: string;
}

export async function generateFlashcardsFromText(inputText: string): Promise<GenerationResult> {
  // Simulate processing time
  await new Promise((resolve) => setTimeout(resolve, 50));

  // Return 3 static cards for MVP
  const cards: GeneratedCardPreview[] = [
    {
      index: 0,
      front_text: "Sample flashcard question 1",
      back_text: "Sample flashcard answer 1",
    },
    {
      index: 1,
      front_text: "Sample flashcard question 2",
      back_text: "Sample flashcard answer 2",
    },
    {
      index: 2,
      front_text: "Sample flashcard question 3",
      back_text: "Sample flashcard answer 3",
    },
  ];

  return {
    cards,
    modelUsed: "mock-generator-v1",
  };
}
```

### Step 4: Create API Route Handler

**File:** `src/pages/api/flashcards/generate.ts`

**Structure:**

```typescript
import type { APIContext } from "astro";
import { generateFlashcardsSchema } from "@/lib/schemas/flashcardGenerationSchema";
import { generateFlashcardsFromText } from "@/lib/services/flashcardBatchService";
import type { GenerateFlashcardsResponse, ApiError, AIGenerationBatchInsert } from "@/types";
import { DEFAULT_USER_ID } from "@/db/supabase.client";

export const prerender = false;

export async function POST(context: APIContext): Promise<Response> {
  // 1. Verify DEFAULT_USER_ID
  // 2. Parse and validate request body
  // 3. Call mock generation service
  // 4. Create batch record
  // 5. Return response
}
```

### Step 5: Implement User ID Check

**In Route Handler:**

```typescript
// Verify DEFAULT_USER_ID is configured
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
```

### Step 6: Implement Input Validation

**In Route Handler:**

```typescript
// Parse request body
let requestBody;
try {
  requestBody = await context.request.json();
} catch (error) {
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
```

### Step 7: Implement Mock Generation Call

**In Route Handler:**

```typescript
// Start performance timer
const startTime = Date.now();

// Call mock generation service
const generationResult = await generateFlashcardsFromText(input_text);

// Calculate time taken
const timeTakenMs = Date.now() - startTime;
```

### Step 8: Create Batch Record

**In Route Handler:**

```typescript
// Prepare batch insert data
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

// Insert into database
const { data: batchData, error: dbError } = await context.locals.supabase
  .from("ai_generation_batches")
  .insert(batchInsert)
  .select()
  .single();

if (dbError || !batchData) {
  console.error("Database error creating batch:", dbError);

  const errorResponse: ApiError = {
    error: "Internal Server Error",
    message: "An unexpected error occurred while processing your request",
  };
  return new Response(JSON.stringify(errorResponse), {
    status: 500,
    headers: { "Content-Type": "application/json" },
  });
}
```

### Step 9: Return Success Response

**In Route Handler:**

```typescript
// Format response
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
```

### Step 10: Add Environment Variable (Optional)

**File:** `.env` (not committed)

```bash
# Optional: Override default user ID
DEFAULT_USER_ID=your-default-user-uuid
```

**File:** `.env.example` (committed)

```bash
# Default User Configuration (MVP only)
DEFAULT_USER_ID=00000000-0000-0000-0000-000000000000
```

### Step 13: Manual Testing

- Test with 1000 character input (minimum)
- Test with 10000 character input (maximum)
- Test with input slightly under/over limits
- Test with various character types
- Verify batch record created correctly
- Verify response includes all required fields

### Step 14: Update API Documentation

**File:** `docs/api/flashcards-generate.md`

- Document endpoint specification
- Provide request/response examples
- List all error scenarios
- Include usage guidelines
- Note MVP limitations (mock data, DEFAULT_USER_ID)
- Add code examples for frontend integration

### Step 15: Prepare for Future Enhancement

**Create TODO comments in code for:**

- Replace mock generation with real AI integration
- Implement full Supabase authentication
- Add budget checking functionality
- Configure AI model selection
- Add retry logic for API failures
