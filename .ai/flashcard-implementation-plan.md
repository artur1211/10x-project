# API Endpoint Implementation Plan: Flashcards CRUD

## 1. Endpoint Overview

This document outlines the implementation plan for the `/api/flashcards` REST API resource. This resource provides comprehensive CRUD (Create, Read, Update, Delete) functionality for managing a user's flashcards. It includes endpoints for listing all flashcards with pagination, sorting, and searching, as well as creating, retrieving, updating, and deleting individual or multiple flashcards. All operations are authenticated and authorized, ensuring users can only access their own data.

## 2. Request Details

The API is structured around two main paths: `/api/flashcards` for collection-level operations and `/api/flashcards/[id]` for item-specific operations.

| Method   | Path                   | Description                                         |
| -------- | ---------------------- | --------------------------------------------------- |
| `GET`    | `/api/flashcards`      | Retrieve a paginated list of the user's flashcards. |
| `POST`   | `/api/flashcards`      | Create a new manual flashcard.                      |
| `DELETE` | `/api/flashcards`      | Bulk delete flashcards.                             |
| `GET`    | `/api/flashcards/[id]` | Retrieve a single flashcard by its ID.              |
| `PATCH`  | `/api/flashcards/[id]` | Update an existing flashcard.                       |
| `DELETE` | `/api/flashcards/[id]` | Delete a single flashcard.                          |

### Parameters & Bodies

- **`GET /api/flashcards`** (Query Parameters):
  - `page` (integer, default: 1): Page number for pagination.
  - `limit` (integer, default: 20, max: 100): Number of items per page.
  - `search` (string, optional): Text to search in `front_text` and `back_text`.
  - `sort_by` (enum: "created_at" | "updated_at", default: "created_at"): Field to sort by.
  - `sort_order` (enum: "asc" | "desc", default: "desc"): Sorting direction.
- **`POST /api/flashcards`** (Request Body): `CreateFlashcardCommand`
- **`PATCH /api/flashcards/[id]`** (Request Body): `UpdateFlashcardCommand`
- **`DELETE /api/flashcards`** (Query Parameters):
  - `ids` (string, required): Comma-separated list of flashcard UUIDs.

## 3. Used Types

The implementation will utilize the following existing types from `src/types.ts`:

- **Commands**: `CreateFlashcardCommand`, `UpdateFlashcardCommand`
- **DTOs**: `FlashcardDTO`, `UserFlashcardStats`, `PaginationMetadata`
- **Responses**: `FlashcardsListResponse`, `DeleteFlashcardResponse`, `DeleteFlashcardsResponse`
- **Database**: `FlashcardInsert`, `FlashcardUpdate`

## 4. Response Details

- **Success Codes**:
  - `200 OK`: Successful retrieval (`GET`), update (`PATCH`), or deletion (`DELETE`).
  - `201 Created`: Successful creation (`POST`).
- **Error Codes**:
  - `400 Bad Request`: Invalid syntax in query parameters or request body.
  - `401 Unauthorized`: Missing or invalid user session.
  - `403 Forbidden`: Action denied (e.g., flashcard limit reached).
  - `404 Not Found`: The requested resource does not exist or does not belong to the user.
  - `500 Internal Server Error`: An unexpected error occurred on the server.

## 5. Data Flow

1.  **Request Reception**: An incoming HTTP request arrives at the appropriate Astro API route (`src/pages/api/flashcards/index.ts` or `src/pages/api/flashcards/[id].ts`).
2.  **Authentication**: Astro middleware verifies the user's session. The API handler performs a secondary check for `Astro.locals.session`. If no session exists, it returns a `401 Unauthorized`.
3.  **Input Validation**: The handler uses a predefined Zod schema to parse and validate URL parameters, query strings, and the request body. If validation fails, it returns a `400 Bad Request` with details.
4.  **Service Layer Call**: The handler calls the corresponding function in the `FlashcardService` (`src/lib/flashcard.service.ts`), passing the authenticated `userId` and the validated data.
5.  **Database Interaction**: The `FlashcardService` constructs and executes a query using the Supabase client. All queries are strictly scoped to the `userId` to enforce data ownership.
6.  **Response Handling**:
    - If the database operation is successful, the service returns the data (or a success confirmation) to the handler.
    - If the resource is not found (or doesn't belong to the user), the service throws a custom `NotFoundError`.
    - If a business rule is violated (e.g., card limit), it throws a `ForbiddenError`.
7.  **Response Formatting**: The API handler catches any errors thrown by the service and maps them to the appropriate HTTP status code and JSON error response. For successful operations, it formats the data into the specified DTO and returns it with the correct status code.

## 6. Security Considerations

- **Authentication**: Every endpoint will verify the presence of a valid user session via `Astro.locals.session`.
- **Authorization**: All database queries within the `FlashcardService` will be strictly scoped using a `where('user_id', '=', userId)` clause to prevent users from accessing or modifying other users' data (preventing IDOR vulnerabilities).
- **Input Validation**: Zod schemas will be used at the API boundary to sanitize and validate all incoming data, preventing malformed requests and potential injection attacks.
- **Rate Limiting**: The `limit` query parameter will be capped at 100 to prevent database strain from large data requests. The application-level limit of 500 flashcards per user will be enforced in the `createFlashcard` service method.

## 7. Performance Considerations

- **Database Indexing**: The `flashcards` table should have an index on the `user_id` column to ensure fast lookups for user-specific data. Indexes on `created_at` and `updated_at` will improve sorting performance.
- **Pagination**: All list queries must be paginated to avoid fetching large datasets and to ensure fast response times.
- **Efficient Queries**: Database queries will be optimized to select only the necessary columns. The user stats (`total_flashcards`) will be fetched via an efficient `count` query.

## 8. Implementation Steps

1.  **Create Zod Schemas (`src/lib/flashcard.schemas.ts`)**:
    - Define a schema for `GET /api/flashcards` query parameters, including defaults, type coercion, and a `.refine()` to cap the `limit`.
    - Define a schema for `POST /api/flashcards` request body (`CreateFlashcardCommand`).
    - Define a schema for `PATCH /api/flashcards/:id` request body (`UpdateFlashcardCommand`).
    - Define a schema for `DELETE /api/flashcards` query parameter (`ids`).
    - Define a schema for UUID path parameters.

2.  **Implement Flashcard Service (`src/lib/flashcard.service.ts`)**:
    - Create a new file for the `FlashcardService`.
    - Implement the `getUserFlashcardStats(supabase, userId)` function to get the count of a user's cards.
    - Implement the `createFlashcard` function. It should first call `getUserFlashcardStats` and throw an error if the user is at their 500-card limit. Otherwise, it inserts the new card.
    - Implement the `getFlashcards` function, which builds a dynamic Supabase query based on validated `search`, `sort_by`, and `sort_order` parameters, and applies pagination logic. It should also return the total count for pagination metadata.
    - Implement `getFlashcardById`, `updateFlashcard`, `deleteFlashcard`, and `deleteFlashcards`, ensuring every query is filtered by both `id`/`ids` and the authenticated `userId`.

3.  **Create API Route for Collection (`src/pages/api/flashcards/index.ts`)**:
    - Create the file to handle `GET`, `POST`, and `DELETE` requests for the `/api/flashcards` path.
    - Implement the `GET` handler: Authenticate, validate query params with the Zod schema, call the `getFlashcards` and `getUserFlashcardStats` service functions, and construct the `FlashcardsListResponse`.
    - Implement the `POST` handler: Authenticate, validate the request body, call the `createFlashcard` service function, and return the newly created flashcard with a `201` status.
    - Implement the `DELETE` handler: Authenticate, validate the `ids` query parameter, split the string into an array, call the `deleteFlashcards` service function, and return the `DeleteFlashcardsResponse`.

4.  **Create API Route for Single Item (`src/pages/api/flashcards/[id].ts`)**:
    - Create the file to handle `GET`, `PATCH`, and `DELETE` requests for the `/api/flashcards/[id]` path.
    - Implement the `GET` handler: Authenticate, validate the `id` path parameter, call `getFlashcardById`, and return the `FlashcardDTO` or a `404`.
    - Implement the `PATCH` handler: Authenticate, validate `id` and the request body, call `updateFlashcard`, and return the updated `FlashcardDTO`.
    - Implement the `DELETE` handler: Authenticate, validate `id`, call `deleteFlashcard`, and return the `DeleteFlashcardResponse`.

5.  **Add Unit and Integration Tests**:
    - Write Vitest unit tests for the `FlashcardService` logic, mocking the Supabase client to test different scenarios like success cases, not found errors, and exceeding limits.
    - Write Playwright E2E tests for the API endpoints to verify authentication, validation, and correct responses for all CRUD operations, using MSW to mock the database layer.
