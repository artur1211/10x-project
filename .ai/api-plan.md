# REST API Plan - 10x-project

## 1. Resources

| Resource              | Database Table          | Description                                                             |
| --------------------- | ----------------------- | ----------------------------------------------------------------------- |
| Flashcards            | `flashcards`            | Core entity representing study flashcards (AI-generated or manual)      |
| Study Sessions        | `study_sessions`        | Tracks user study sessions for spaced repetition and streak calculation |
| AI Generation Batches | `ai_generation_batches` | Tracks AI-powered flashcard generation attempts and metrics             |
| User Profile          | `auth.users` (Supabase) | User authentication and profile information                             |

## 2. Endpoints

### 2.1 Authentication

**Note:** Authentication is primarily handled by Supabase Auth SDK on the client side. The following endpoints are for reference and any necessary backend wrappers.

#### Register User

- **Method:** Handled by Supabase Auth SDK
- **Client SDK:** `supabase.auth.signUp({ email, password })`
- **Description:** Creates a new user account with email verification
- **Requirements:** Email format validation, password (min 8 chars, 1 number, 1 special character)

#### Login User

- **Method:** Handled by Supabase Auth SDK
- **Client SDK:** `supabase.auth.signInWithPassword({ email, password })`
- **Description:** Authenticates user and creates session (30-day expiry)

#### Password Reset

- **Method:** Handled by Supabase Auth SDK
- **Client SDK:** `supabase.auth.resetPasswordForEmail(email)`
- **Description:** Sends password reset email (24-hour expiry)

### 2.2 Flashcards

#### Get All Flashcards

- **Method:** `GET`
- **Path:** `/api/flashcards`
- **Description:** Retrieves user's flashcard collection with pagination, search, and sorting
- **Authentication:** Required
- **Query Parameters:**
  - `page` (integer, default: 1): Page number
  - `limit` (integer, default: 20, max: 100): Items per page
  - `search` (string, optional): Search term for front_text or back_text
  - `sort_by` (enum: "created_at" | "updated_at", default: "created_at"): Sort field
  - `sort_order` (enum: "asc" | "desc", default: "desc"): Sort direction
- **Response (200):**

```json
{
  "flashcards": [
    {
      "id": "uuid",
      "front_text": "string",
      "back_text": "string",
      "is_ai_generated": true,
      "was_edited": false,
      "generation_batch_id": "uuid|null",
      "created_at": "2025-10-08T12:00:00Z",
      "updated_at": "2025-10-08T12:00:00Z"
    }
  ],
  "pagination": {
    "current_page": 1,
    "total_pages": 5,
    "total_count": 95,
    "limit": 20
  },
  "user_stats": {
    "total_flashcards": 95,
    "flashcard_limit": 500,
    "remaining_capacity": 405
  }
}
```

- **Error Responses:**
  - `401 Unauthorized`: Missing or invalid authentication
  - `400 Bad Request`: Invalid query parameters

#### Get Single Flashcard

- **Method:** `GET`
- **Path:** `/api/flashcards/:id`
- **Description:** Retrieves a specific flashcard by ID
- **Authentication:** Required
- **Response (200):**

```json
{
  "id": "uuid",
  "front_text": "string",
  "back_text": "string",
  "is_ai_generated": true,
  "was_edited": false,
  "generation_batch_id": "uuid|null",
  "created_at": "2025-10-08T12:00:00Z",
  "updated_at": "2025-10-08T12:00:00Z"
}
```

- **Error Responses:**
  - `401 Unauthorized`: Missing or invalid authentication
  - `404 Not Found`: Flashcard not found or doesn't belong to user

#### Create Manual Flashcard

- **Method:** `POST`
- **Path:** `/api/flashcards`
- **Description:** Creates a new flashcard manually
- **Authentication:** Required
- **Request Payload:**

```json
{
  "front_text": "string (10-500 chars)",
  "back_text": "string (10-1000 chars)"
}
```

- **Response (201):**

```json
{
  "id": "uuid",
  "front_text": "string",
  "back_text": "string",
  "is_ai_generated": false,
  "was_edited": false,
  "generation_batch_id": null,
  "created_at": "2025-10-08T12:00:00Z",
  "updated_at": "2025-10-08T12:00:00Z"
}
```

- **Error Responses:**
  - `401 Unauthorized`: Missing or invalid authentication
  - `400 Bad Request`: Validation errors (character limits, missing fields)
  - `403 Forbidden`: Flashcard limit reached (500 cards)

#### Update Flashcard

- **Method:** `PATCH`
- **Path:** `/api/flashcards/:id`
- **Description:** Updates an existing flashcard (sets was_edited=true)
- **Authentication:** Required
- **Request Payload:**

```json
{
  "front_text": "string (10-500 chars, optional)",
  "back_text": "string (10-1000 chars, optional)"
}
```

- **Response (200):**

```json
{
  "id": "uuid",
  "front_text": "string",
  "back_text": "string",
  "is_ai_generated": true,
  "was_edited": true,
  "generation_batch_id": "uuid|null",
  "created_at": "2025-10-08T12:00:00Z",
  "updated_at": "2025-10-08T13:00:00Z"
}
```

- **Error Responses:**
  - `401 Unauthorized`: Missing or invalid authentication
  - `404 Not Found`: Flashcard not found or doesn't belong to user
  - `400 Bad Request`: Validation errors

#### Delete Single Flashcard

- **Method:** `DELETE`
- **Path:** `/api/flashcards/:id`
- **Description:** Deletes a single flashcard (hard delete)
- **Authentication:** Required
- **Response (200):**

```json
{
  "message": "Flashcard deleted successfully",
  "id": "uuid"
}
```

- **Error Responses:**
  - `401 Unauthorized`: Missing or invalid authentication
  - `404 Not Found`: Flashcard not found or doesn't belong to user

#### Delete Multiple Flashcards

- **Method:** `DELETE`
- **Path:** `/api/flashcards`
- **Description:** Deletes multiple flashcards in bulk (hard delete)
- **Authentication:** Required
- **Query Parameters:**
  - `ids` (string, required): Comma-separated list of flashcard IDs
- **Response (200):**

```json
{
  "message": "Flashcards deleted successfully",
  "deleted_count": 5,
  "deleted_ids": ["uuid1", "uuid2", "uuid3", "uuid4", "uuid5"]
}
```

- **Error Responses:**
  - `401 Unauthorized`: Missing or invalid authentication
  - `400 Bad Request`: Missing or invalid ids parameter
  - `404 Not Found`: One or more flashcards not found

---

### 2.3 AI Flashcard Generation

#### Generate Flashcards from Text

- **Method:** `POST`
- **Path:** `/api/flashcards/batch`
- **Description:** Generates flashcards from input text using AI (5-10 cards per 1,000 characters)
- **Authentication:** Required
- **Request Payload:**

```json
{
  "input_text": "string (1000-10000 chars)"
}
```

- **Response (200):**

```json
{
  "batch_id": "uuid",
  "generated_at": "2025-10-08T12:00:00Z",
  "input_text_length": 2500,
  "generated_cards": [
    {
      "index": 0,
      "front_text": "string",
      "back_text": "string"
    }
  ],
  "total_cards_generated": 15,
  "time_taken_ms": 3200,
  "model_used": "anthropic/claude-3-haiku"
}
```

- **Error Responses:**
  - `401 Unauthorized`: Missing or invalid authentication
  - `400 Bad Request`: Invalid input (character limits, validation errors)
  - `429 Too Many Requests`: AI generation budget limit reached
  - `503 Service Unavailable`: AI service unavailable

#### Review and Accept AI-Generated Flashcards

- **Method:** `POST`
- **Path:** `/api/flashcards/batch/:batchId/review`
- **Description:** Processes user's review decisions for AI-generated flashcards
- **Authentication:** Required
- **Request Payload:**

```json
{
  "decisions": [
    {
      "index": 0,
      "action": "accept|reject|edit",
      "front_text": "string (optional, for edit action)",
      "back_text": "string (optional, for edit action)"
    }
  ]
}
```

- **Response (201):**

```json
{
  "batch_id": "uuid",
  "cards_accepted": 10,
  "cards_rejected": 3,
  "cards_edited": 2,
  "created_flashcards": [
    {
      "id": "uuid",
      "front_text": "string",
      "back_text": "string",
      "is_ai_generated": true,
      "was_edited": true,
      "generation_batch_id": "uuid",
      "created_at": "2025-10-08T12:00:00Z",
      "updated_at": "2025-10-08T12:00:00Z"
    }
  ]
}
```

- **Error Responses:**
  - `401 Unauthorized`: Missing or invalid authentication
  - `404 Not Found`: Batch not found or doesn't belong to user
  - `400 Bad Request`: Invalid decisions or validation errors
  - `403 Forbidden`: Accepting cards would exceed 500 card limit
  - `409 Conflict`: Batch already reviewed

---

### 2.6 AI Generation Batches

#### Get AI Generation History

- **Method:** `GET`
- **Path:** `/api/ai-batches`
- **Description:** Retrieves user's AI generation history with metrics
- **Authentication:** Required
- **Query Parameters:**
  - `page` (integer, default: 1): Page number
  - `limit` (integer, default: 20): Items per page
- **Response (200):**

```json
{
  "batches": [
    {
      "id": "uuid",
      "generated_at": "2025-10-08T12:00:00Z",
      "input_text_length": 2500,
      "total_cards_generated": 15,
      "cards_accepted": 10,
      "cards_rejected": 3,
      "cards_edited": 2,
      "acceptance_rate_percent": 80.0,
      "time_taken_ms": 3200,
      "model_used": "anthropic/claude-3-haiku"
    }
  ],
  "pagination": {
    "current_page": 1,
    "total_pages": 3,
    "total_count": 12,
    "limit": 20
  }
}
```

- **Error Responses:**
  - `401 Unauthorized`: Missing or invalid authentication

#### Get Single AI Generation Batch

- **Method:** `GET`
- **Path:** `/api/ai-batches/:batchId`
- **Description:** Retrieves details of a specific AI generation batch
- **Authentication:** Required
- **Response (200):**

```json
{
  "id": "uuid",
  "generated_at": "2025-10-08T12:00:00Z",
  "input_text_length": 2500,
  "total_cards_generated": 15,
  "cards_accepted": 10,
  "cards_rejected": 3,
  "cards_edited": 2,
  "time_taken_ms": 3200,
  "model_used": "anthropic/claude-3-haiku",
  "created_flashcards": [
    {
      "id": "uuid",
      "front_text": "string",
      "back_text": "string",
      "was_edited": false
    }
  ]
}
```

- **Error Responses:**
  - `401 Unauthorized`: Missing or invalid authentication
  - `404 Not Found`: Batch not found or doesn't belong to user

---

## 3. Authentication and Authorization

### 3.1 Authentication Mechanism

**Primary Method:** Supabase JWT-based authentication

**Implementation Details:**

1. **User Registration & Login:**
   - Handled via Supabase Auth SDK on the client side
   - `supabase.auth.signUp()` for registration
   - `supabase.auth.signInWithPassword()` for login
   - Supabase automatically manages JWT tokens and session refresh

2. **Session Management:**
   - Access tokens valid for 1 hour (Supabase default)
   - Refresh tokens valid for 30 days (per FR-017)
   - Automatic token refresh handled by Supabase client
   - Sessions stored in secure HTTP-only cookies

3. **API Endpoint Authentication:**
   - All API endpoints (except auth-related) require valid JWT token
   - Token passed in `Authorization: Bearer <token>` header
   - Middleware validates token using Supabase server-side client
   - User ID extracted from validated JWT for authorization

4. **Implementation in Astro:**

   ```typescript
   // src/middleware/index.ts
   export const onRequest = async (context, next) => {
     const supabase = context.locals.supabase;
     const {
       data: { session },
     } = await supabase.auth.getSession();

     if (!session && isProtectedRoute(context.url.pathname)) {
       return new Response("Unauthorized", { status: 401 });
     }

     context.locals.user = session?.user || null;
     return next();
   };
   ```

### 3.2 Authorization Strategy

**Row-Level Security (RLS):**

- All database tables have RLS policies enabled
- Policies automatically filter queries by `auth.uid() = user_id`
- Users can only access their own data
- No additional application-level authorization needed for basic CRUD

**Enforcement Layers:**

1. **Database Level:** RLS policies prevent unauthorized data access
2. **API Level:** Middleware validates authentication before processing requests
3. **Application Level:** Additional business logic validation (e.g., flashcard limits)

### 3.3 Security Headers

All API responses include security headers:

- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Strict-Transport-Security: max-age=31536000; includeSubDomains`

---

## 4. Validation and Business Logic

### 4.1 Zod Schema Validation

**Implementation Guidelines:**

All API endpoints MUST use Zod schemas for input validation and type safety. Zod provides runtime type checking and ensures data exchanged with the backend is valid.

**Usage Pattern:**

```typescript
import { z } from "zod";

// Define schemas in src/types.ts or endpoint file
const CreateFlashcardSchema = z.object({
  front_text: z.string().min(10).max(500),
  back_text: z.string().min(10).max(1000),
});

// In API endpoint (src/pages/api/flashcards/index.ts)
export const POST = async (context) => {
  try {
    const body = await context.request.json();
    const validatedData = CreateFlashcardSchema.parse(body);
    // ... use validatedData
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new Response(
        JSON.stringify({
          error: "Validation Error",
          message: "Input validation failed",
          details: error.errors,
        }),
        { status: 400 }
      );
    }
  }
};
```

**Key Benefits:**

- Type-safe request/response handling
- Automatic runtime validation
- Consistent error messages
- Self-documenting API contracts
- TypeScript type inference from schemas

**Best Practices:**

- Define all validation schemas in `src/types.ts` for shared DTOs
- Use `.parse()` for throwing errors or `.safeParse()` for manual error handling
- Transform Zod errors into user-friendly API error responses
- Reuse schemas across API routes and frontend for consistency

### 4.2 Input Validation Rules

#### Flashcard Creation/Update

- **front_text:**
  - Required: Yes
  - Type: String
  - Min length: 10 characters
  - Max length: 500 characters
  - Validation: Character count, non-empty after trimming

- **back_text:**
  - Required: Yes
  - Type: String
  - Min length: 10 characters
  - Max length: 1,000 characters
  - Validation: Character count, non-empty after trimming

#### AI Generation

- **input_text:**
  - Required: Yes
  - Type: String
  - Min length: 1,000 characters
  - Max length: 10,000 characters
  - Validation: Character count, meaningful content (not just whitespace)

#### Study Session Review

- **rating:**
  - Required: Yes
  - Type: Enum
  - Allowed values: "again", "hard", "good", "easy"
  - Validation: Must be one of allowed values

### 4.2 Business Logic Rules

#### Flashcard Limit Enforcement (FR-011)

- **Rule:** Maximum 500 flashcards per user account
- **Implementation:**
  - Check current flashcard count before creation
  - Return `403 Forbidden` when limit reached
  - Display remaining capacity in GET /api/flashcards response
- **Location:** POST /api/flashcards, POST /api/flashcards/batch/:batchId/review

#### AI Generation Budget (FR-022)

- **Rule:** Global monthly budget limit for AI generation
- **Implementation:**
  - Track AI generation usage in ai_generation_batches table
  - Aggregate monthly usage on-demand
  - Return `429 Too Many Requests` when limit exceeded
  - Provide clear error message suggesting manual creation (FR-023)
- **Location:** POST /api/flashcards/batch

#### AI Generation Acceptance Rate (Success Metric)

- **Rule:** Target 75% acceptance rate for AI-generated flashcards
- **Implementation:**
  - Track in ai_generation_batches: cards_accepted, cards_rejected, cards_edited
  - Calculate: acceptance_rate = cards_accepted / total_cards_generated \* 100
  - Display metrics in GET /api/users/me/stats
- **Location:** POST /api/flashcards/batch/:batchId/review, GET /api/users/me/stats

#### Streak Calculation (FR-021)

- **Rule:** Consecutive days with at least one completed study session
- **Implementation:**
  - Calculate on-demand from study_sessions table
  - Only completed sessions (completed_at NOT NULL) count toward streak
  - Streak resets if a day is skipped (no completed sessions)
  - Timezone: User's local timezone (stored in session metadata or inferred)
- **Location:** PATCH /api/study-sessions/:sessionId/complete, GET /api/users/me/streak

#### Spaced Repetition Algorithm (FR-018, FR-019)

- **Rule:** Open-source spaced repetition implementation (e.g., SM-2 algorithm)
- **Implementation:**
  - Calculate next_review_date based on user rating
  - Update interval and ease factor for each card review
  - Determine daily new card introduction (FR-020): configurable 5-20 cards
- **Location:** POST /api/study-sessions/:sessionId/reviews

#### Flashcard Edit Tracking

- **Rule:** Track if flashcards were edited after creation/generation
- **Implementation:**
  - Set was_edited = true when PATCH /api/flashcards/:id is called
  - Track cards_edited in ai_generation_batches when edit action used during review
- **Location:** PATCH /api/flashcards/:id, POST /api/flashcards/batch/:batchId/review

### 4.3 Error Handling Strategy

#### Validation Errors (400 Bad Request)

```json
{
  "error": "Validation Error",
  "message": "Input validation failed",
  "details": [
    {
      "field": "front_text",
      "message": "Must be between 10 and 500 characters",
      "received_length": 5
    }
  ]
}
```

#### Business Logic Errors (403 Forbidden)

```json
{
  "error": "Flashcard Limit Reached",
  "message": "You have reached the maximum limit of 500 flashcards",
  "current_count": 500,
  "limit": 500,
  "suggestion": "Delete some flashcards to create new ones"
}
```

#### Rate Limiting (429 Too Many Requests)

```json
{
  "error": "AI Generation Limit Exceeded",
  "message": "Monthly AI generation budget has been reached",
  "reset_date": "2025-11-01T00:00:00Z",
  "suggestion": "Create flashcards manually or wait until next month"
}
```

#### Not Found (404)

```json
{
  "error": "Not Found",
  "message": "Flashcard not found or you don't have permission to access it",
  "resource_type": "flashcard",
  "resource_id": "uuid"
}
```

### 4.4 Data Transformation

#### Response Filtering

- Remove sensitive internal fields (e.g., user_id) from responses
- User ID is implied by authentication, no need to return it

#### Timestamp Formatting

- All timestamps in ISO 8601 format with timezone (UTC)
- Example: `2025-10-08T12:00:00Z`

#### Pagination Metadata

- Consistent pagination structure across all list endpoints
- Include: current_page, total_pages, total_count, limit

#### Computed Fields

- `acceptance_rate_percent`: Calculated from cards_accepted / total_cards_generated \* 100
- `remaining_capacity`: Calculated from 500 - total_flashcards
- `streak_active`: Boolean indicating if streak is currently active

---

## 7. Testing Strategy

### 7.1 API Testing Levels

**Unit Tests:**

- Validation functions
- Business logic utilities
- Spaced repetition algorithm calculations

**Integration Tests:**

- Database interactions with RLS policies
- Supabase authentication flow
- AI generation service integration

**End-to-End Tests:**

- Complete user workflows (register → create flashcards → study)
- AI generation and review flow
- Study session completion and streak calculation

### 7.2 Test Coverage Requirements

- Minimum 80% code coverage for business logic
- 100% coverage for validation rules
- All error scenarios tested
- Edge cases documented and tested
