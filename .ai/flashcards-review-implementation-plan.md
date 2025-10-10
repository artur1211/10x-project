# API Endpoint Implementation Plan: Review AI-Generated Flashcards

## 1. Endpoint Overview

This endpoint processes user review decisions for AI-generated flashcards from a specific generation batch. Users can accept, reject, or edit generated flashcards. Accepted and edited cards are persisted to the database, while rejected cards are discarded. The endpoint enforces the 500 flashcard limit per user and ensures batches can only be reviewed once. Upon successful processing, it returns statistics about the review (accepted/rejected/edited counts) and the created flashcard entities.

**MVP Note:** This implementation uses `DEFAULT_USER_ID` from `src/db/supabase.client.ts` instead of real authentication. All operations are performed under a single hardcoded user. Real Supabase authentication will be implemented in a future iteration.

**Business Rules:**

- Maximum 500 flashcards per user (enforced at application level)
- Each batch can only be reviewed once
- Only accepted and edited cards are stored in the database
- Rejected cards are counted but not persisted
- Users can only review their own batches (MVP: all batches belong to DEFAULT_USER_ID)

## 2. Request Details

- **HTTP Method:** `POST`
- **URL Structure:** `/api/flashcards/batch/:batchId/review`
- **Authentication:** MVP Mode - Uses `DEFAULT_USER_ID` from `src/db/supabase.client.ts` (real auth to be implemented later)

### Path Parameters:

- **batchId** (required): UUID - Identifier of the AI generation batch to review

### Request Body:

```typescript
{
  "decisions": [
    {
      "index": 0,                    // 0-based position in generated batch
      "action": "accept",            // "accept" | "reject" | "edit"
      "front_text": "string",        // 10-500 characters
      "back_text": "string"          // 10-1000 characters
    }
  ]
}
```

**Validation Rules:**

- `decisions`: Non-empty array
- `index`: Non-negative integer, unique within decisions array, within range [0, total_cards_generated)
- `action`: Must be one of "accept", "reject", or "edit"
- `front_text`: Required, 10-500 characters
- `back_text`: Required, 10-1000 characters
- All indices in decisions array must be unique (no duplicate reviews)

## 3. Used Types

From `src/types.ts`:

### Input Types:

- `ReviewFlashcardsCommand` (lines 172-174) - Request body structure
- `ReviewDecision` (lines 162-167) - Individual decision structure

### Output Types:

- `ReviewFlashcardsResponse` (lines 179-185) - Success response
- `FlashcardDTO` (line 62) - Flashcard data without user_id

### Database Types:

- `FlashcardInsert` (line 235) - Type for inserting flashcards
- `AIGenerationBatchUpdate` (line 250) - Type for updating batch
- `AIGenerationBatchEntity` (line 15) - Batch entity from database

### Error Types:

- `ApiError` (lines 39-53) - Standardized error response

## 4. Response Details

### Success Response (201 Created):

```typescript
{
  "batch_id": "uuid",
  "cards_accepted": 10,           // Count of accepted cards
  "cards_rejected": 3,            // Count of rejected cards
  "cards_edited": 2,              // Count of edited cards
  "created_flashcards": [         // Array of created flashcards
    {
      "id": "uuid",
      "front_text": "string",
      "back_text": "string",
      "is_ai_generated": true,
      "was_edited": true,         // true if action was "edit"
      "generation_batch_id": "uuid",
      "created_at": "2025-10-08T12:00:00Z",
      "updated_at": "2025-10-08T12:00:00Z"
    }
  ]
}
```

### Error Responses:

**404 Not Found:**

```json
{
  "error": "BATCH_NOT_FOUND",
  "message": "AI generation batch not found or does not belong to user"
}
```

**400 Bad Request:**

```json
{
  "error": "VALIDATION_ERROR",
  "message": "Invalid review decisions",
  "details": [
    {
      "field": "decisions[0].front_text",
      "message": "Must be between 10 and 500 characters",
      "received_length": 5
    }
  ]
}
```

**403 Forbidden:**

```json
{
  "error": "FLASHCARD_LIMIT_EXCEEDED",
  "message": "Accepting these cards would exceed your limit of 500 flashcards",
  "current_count": 495,
  "limit": 500,
  "suggestion": "Delete some existing flashcards or reject more generated cards"
}
```

**409 Conflict:**

```json
{
  "error": "BATCH_ALREADY_REVIEWED",
  "message": "This batch has already been reviewed"
}
```

**500 Internal Server Error:**

```json
{
  "error": "INTERNAL_SERVER_ERROR",
  "message": "Failed to process review"
}
```

## 5. Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. Request Validation & User Setup                              │
│    - Extract batchId from path params (validate UUID format)    │
│    - Parse request body with Zod schema                         │
│    - Validate decisions array structure and content             │
│    - Use DEFAULT_USER_ID from supabase.client.ts (MVP mode)     │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ 2. Fetch and Verify Batch                                       │
│    - Query ai_generation_batches by id and DEFAULT_USER_ID      │
│    - Return 404 if not found                                    │
│    - Verify batch indices match decisions                       │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ 3. Check Batch Review Status                                    │
│    - Check if (cards_accepted + cards_rejected) > 0             │
│    - Return 409 Conflict if already reviewed                    │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ 4. Validate Flashcard Limit                                     │
│    - Count DEFAULT_USER_ID's existing flashcards                │
│    - Count accepted/edited decisions                            │
│    - Return 403 if (existing + accepted) > 500                  │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ 5. Database Transaction                                         │
│    a. Insert flashcards for accepted/edited decisions           │
│       - Set user_id = DEFAULT_USER_ID                           │
│       - Set is_ai_generated = true                              │
│       - Set was_edited = (action === "edit")                    │
│       - Set generation_batch_id = batchId                       │
│    b. Update ai_generation_batches statistics                   │
│       - cards_accepted = count of "accept" + "edit"             │
│       - cards_rejected = count of "reject"                      │
│       - cards_edited = count of "edit"                          │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ 6. Return Success Response (201)                                │
│    - Include batch_id and statistics                            │
│    - Include created flashcards (without user_id)               │
└─────────────────────────────────────────────────────────────────┘
```

## 6. Security Considerations

### Authentication (MVP Mode)

- **Method:** Uses `DEFAULT_USER_ID` from `src/db/supabase.client.ts`
- **Current Implementation:** Single hardcoded user for MVP phase
- **Future Migration:** Will be replaced with Supabase Auth (`context.locals.supabase.auth.getUser()`)
- **Note:** All requests currently operate under the same user context

### Authorization (MVP Mode)

- **Ownership Verification:** Batch must have `user_id = DEFAULT_USER_ID`
- **Query Pattern:** Always include `DEFAULT_USER_ID` in WHERE clause when fetching batch
- **Failure Response:** 404 if batch not found
- **Note:** In production, this will verify `batch.user_id === authenticated_user.id`

### Input Validation

- **UUID Validation:** Verify batchId is valid UUID format before database query
- **Zod Schema:** Use strict Zod schema for all request body validation
- **Text Sanitization:** Validate character limits (10-500 for front, 10-1000 for back)
- **Index Validation:**
  - Ensure indices are within bounds [0, total_cards_generated)
  - Check for duplicate indices
  - Verify all decisions reference valid generated cards

### Data Integrity

- **Transaction:** Use database transaction to ensure atomicity
- **Idempotency Check:** Prevent double-review by checking batch status before processing
- **Limit Enforcement:** Verify 500 card limit before creating flashcards

### Potential Attack Vectors

1. **Batch Hijacking (MVP Note):** Currently mitigated by DEFAULT_USER_ID verification. In production, will require authenticated user_id matching.
2. **Limit Bypass:** Mitigated by pre-transaction flashcard count check
3. **Double Review:** Mitigated by batch status verification
4. **Index Manipulation:** Mitigated by bounds checking and duplicate detection
5. **SQL Injection:** Mitigated by Supabase parameterized queries
6. **XSS via Text Content:** Mitigated by character limits and validation (frontend should also sanitize on display)

**MVP Security Limitations:**
- Single user context means no isolation between different users
- No authentication means endpoint is publicly accessible
- These limitations are acceptable for MVP but must be addressed before production

## 7. Performance Considerations

### Potential Bottlenecks

1. **Flashcard Count Query:** Counting user's existing flashcards could be slow for users near limit
2. **Bulk Insert:** Inserting multiple flashcards in a single transaction
3. **Transaction Lock Duration:** Long-running transaction could cause contention

### Optimization Strategies

1. **Database Indexing:**
   - Ensure index on `flashcards.user_id` for fast counting
   - Ensure index on `ai_generation_batches(id, user_id)` for batch lookup

2. **Batch Insert:**
   - Use Supabase bulk insert for multiple flashcards
   - Single `.insert()` call with array of flashcard objects

3. **Query Optimization:**
   - Fetch batch with single query including all needed fields
   - Use `.select('count')` for efficient counting

4. **Transaction Scope:**
   - Keep transaction minimal: only inserts and updates
   - Perform all validation before transaction starts

5. **Caching Considerations:**
   - User flashcard count could be cached with short TTL
   - Batch data doesn't need caching (single-use operation)

### Expected Load

- Typical request size: 5-10 decisions per review
- Maximum decisions: Limited by generation (5-10 per 1000 chars input)
- Database writes: 1 batch update + N flashcard inserts (where N = accepted + edited count)
- Expected response time: < 500ms for typical 10-card review

## 8. Implementation Steps

### Step 1: Create Zod Validation Schema

**File:** `src/pages/api/flashcards/batch/[batchId]/review.ts`

```typescript
import { z } from "zod";

const ReviewDecisionSchema = z.object({
  index: z.number().int().nonnegative(),
  action: z.enum(["accept", "reject", "edit"]),
  front_text: z.string().min(10).max(500),
  back_text: z.string().min(10).max(1000),
});

const ReviewFlashcardsSchema = z.object({
  decisions: z.array(ReviewDecisionSchema).min(1),
});
```

### Step 2: Create Flashcards Service

**File:** `src/lib/services/flashcardBatchService.ts`

**Note:** This service has been unified with the generation logic into a single batch service following the unified service pattern.

Create service with the following methods:

- `getAIGenerationBatch(supabase, batchId, userId)` - Fetch and verify batch ownership
- `getUserFlashcardCount(supabase, userId)` - Count existing flashcards
- `reviewAIGeneratedFlashcards(supabase, batchId, userId, decisions)` - Main service logic
  - Validate batch status (not already reviewed)
  - Validate indices against batch.total_cards_generated
  - Check for duplicate indices
  - Calculate statistics (accepted, rejected, edited counts)
  - Verify flashcard limit
  - Execute transaction
  - Return created flashcards and statistics

### Step 3: Implement API Route Handler

**File:** `src/pages/api/flashcards/batch/[batchId]/review.ts`

```typescript
import { DEFAULT_USER_ID } from "@/db/supabase.client";
import { reviewAIGeneratedFlashcards } from "@/lib/services/flashcardBatchService";

export const prerender = false;

export async function POST(context: APIContext) {
  // 1. Extract path parameter (batchId)
  // 2. Use DEFAULT_USER_ID for MVP (no real auth)
  // 3. Validate request body with Zod
  // 4. Call service method with DEFAULT_USER_ID
  // 5. Handle errors with appropriate status codes
  // 6. Return 201 with ReviewFlashcardsResponse
}
```

### Step 4: Implement Error Handling

- Create error response helper function following ApiError type
- Map service errors to HTTP status codes:
  - Validation errors → 400
  - Not found errors → 404
  - Conflict errors → 409
  - Limit errors → 403
  - Database errors → 500
- Include detailed error messages and suggestions where applicable

### Step 5: Implement Service Logic

**Service method pseudocode:**

```typescript
async function reviewAIGeneratedFlashcards(supabase, batchId, userId, decisions) {
  // 1. Fetch batch with ownership check
  const batch = await getAIGenerationBatch(supabase, batchId, userId);
  if (!batch) throw NotFoundError;

  // 2. Check if already reviewed
  if (batch.cards_accepted + batch.cards_rejected > 0) {
    throw ConflictError("Batch already reviewed");
  }

  // 3. Validate decision indices
  const indices = decisions.map((d) => d.index);
  if (new Set(indices).size !== indices.length) {
    throw ValidationError("Duplicate indices");
  }
  if (Math.max(...indices) >= batch.total_cards_generated) {
    throw ValidationError("Index out of bounds");
  }

  // 4. Calculate statistics
  const acceptedDecisions = decisions.filter((d) => d.action === "accept" || d.action === "edit");
  const rejectedDecisions = decisions.filter((d) => d.action === "reject");
  const editedDecisions = decisions.filter((d) => d.action === "edit");

  // 5. Check flashcard limit
  const currentCount = await getUserFlashcardCount(supabase, userId);
  if (currentCount + acceptedDecisions.length > 500) {
    throw LimitExceededError;
  }

  // 6. Begin transaction
  const flashcardsToInsert = acceptedDecisions.map((decision) => ({
    user_id: userId, // Will be DEFAULT_USER_ID in MVP mode
    generation_batch_id: batchId,
    front_text: decision.front_text,
    back_text: decision.back_text,
    is_ai_generated: true,
    was_edited: decision.action === "edit",
  }));

  // Insert flashcards
  const { data: createdFlashcards, error: insertError } = await supabase
    .from("flashcards")
    .insert(flashcardsToInsert)
    .select();

  if (insertError) throw insertError;

  // Update batch statistics
  const { error: updateError } = await supabase
    .from("ai_generation_batches")
    .update({
      cards_accepted: acceptedDecisions.length,
      cards_rejected: rejectedDecisions.length,
      cards_edited: editedDecisions.length,
    })
    .eq("id", batchId);

  if (updateError) throw updateError;

  // 7. Return response
  return {
    batch_id: batchId,
    cards_accepted: acceptedDecisions.length,
    cards_rejected: rejectedDecisions.length,
    cards_edited: editedDecisions.length,
    created_flashcards: createdFlashcards.map(omitUserId),
  };
}
```

### Step 6: Add Database Indexes (if not exist)

```sql
-- Ensure these indexes exist for optimal performance
CREATE INDEX IF NOT EXISTS idx_flashcards_user_id ON flashcards(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_generation_batches_user_id ON ai_generation_batches(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_generation_batches_id_user_id ON ai_generation_batches(id, user_id);
```

### Step 7: Testing Checklist

- [ ] Test with valid review decisions (accept/reject/edit mix)
- [ ] Test with non-existent batch (404)
- [ ] Test with batch not belonging to DEFAULT_USER_ID (404) [will become "other user's batch" in production]
- [ ] Test with already reviewed batch (409)
- [ ] Test with decisions exceeding 500 card limit (403)
- [ ] Test with invalid indices (400)
- [ ] Test with duplicate indices (400)
- [ ] Test with text length violations (400)
- [ ] Test with empty decisions array (400)
- [ ] Test with invalid UUID format (400)
- [ ] Test with malformed request body (400)
- [ ] Test transaction rollback on error
- [ ] Test concurrent review attempts
- [ ] Test performance with 10+ cards

**MVP Testing Notes:**
- Authentication tests skipped (using DEFAULT_USER_ID)
- Authorization tests simplified (single user context)
- Add full auth/authz tests when implementing real authentication

### Step 8: Documentation

- Add endpoint to API documentation
- Document rate limits (if applicable)
- Add example requests and responses
- Document business rules and constraints
- Add troubleshooting guide for common errors
