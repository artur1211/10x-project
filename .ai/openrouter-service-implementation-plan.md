# OpenRouter Service Implementation Plan

## 1. Service Description

The `OpenRouterService` is a TypeScript service class that provides a type-safe, robust interface for interacting with the OpenRouter API. This service will handle all LLM-based chat completions for the 10x-project flashcard generation platform.

**Core Responsibilities**:

- Manage authenticated requests to OpenRouter API
- Construct properly formatted chat completion requests
- Parse and validate API responses
- Handle errors with meaningful, actionable error messages
- Support structured JSON responses via JSON Schema
- Provide type-safe interfaces for all operations

**Location**: `./src/lib/services/openrouter.service.ts`

**Dependencies**:

- `zod`: Request/response validation
- Native `fetch`: HTTP requests
- TypeScript 5: Type safety

## 2. Constructor Description

### Constructor Signature

```typescript
constructor(config: OpenRouterConfig)
```

### Configuration Interface

```typescript
interface OpenRouterConfig {
  apiKey: string; // Required: OpenRouter API key
  baseUrl?: string; // Optional: API base URL (default: 'https://openrouter.ai/api/v1')
  defaultModel?: string; // Optional: Default model to use (default: 'google/gemini-2.0-flash-exp:free')
  timeout?: number; // Optional: Request timeout in ms (default: 30000)
  maxRetries?: number; // Optional: Max retry attempts (default: 3)
  siteName?: string; // Optional: Site name for OpenRouter analytics
  siteUrl?: string; // Optional: Site URL for OpenRouter analytics
}
```

### Configuration Validation Schema

```typescript
const OpenRouterConfigSchema = z.object({
  apiKey: z.string().min(1, "API key is required"),
  baseUrl: z.string().url().optional().default("https://openrouter.ai/api/v1"),
  defaultModel: z.string().optional().default("google/gemini-2.0-flash-exp:free"),
  timeout: z.number().positive().optional().default(30000),
  maxRetries: z.number().int().min(0).max(5).optional().default(3),
  siteName: z.string().optional(),
  siteUrl: z.string().url().optional(),
});
```

### Initialization Logic

The constructor should:

1. Validate configuration using Zod schema
2. Store validated configuration in private fields
3. Throw descriptive error if validation fails
4. Set default values for optional parameters

## 3. Public Methods and Fields

### 3.1 Method: `chat()`

Primary method for chat completion requests.

#### Signature

```typescript
async chat<T = unknown>(
  messages: ChatMessage[],
  options?: ChatOptions<T>
): Promise<ChatResponse<T>>
```

#### Parameters

**ChatMessage Interface**:

```typescript
interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}
```

**ChatOptions Interface**:

```typescript
interface ChatOptions<T = unknown> {
  model?: string; // Override default model
  temperature?: number; // 0-2, controls randomness (default: 0.7)
  maxTokens?: number; // Max response tokens (default: 2000)
  topP?: number; // Nucleus sampling (default: 1)
  frequencyPenalty?: number; // -2 to 2 (default: 0)
  presencePenalty?: number; // -2 to 2 (default: 0)
  responseFormat?: ResponseFormat<T>; // Structured output schema
  stop?: string[]; // Stop sequences
}
```

**ResponseFormat Interface**:

```typescript
interface ResponseFormat<T = unknown> {
  type: "json_schema";
  json_schema: {
    name: string; // Schema name (alphanumeric + underscores)
    strict: boolean; // Should be true for structured output
    schema: JsonSchema; // JSON Schema object
  };
  validator?: z.ZodSchema<T>; // Optional Zod schema for validation
}

interface JsonSchema {
  type: "object";
  properties: Record<string, any>;
  required: string[];
  additionalProperties: boolean;
}
```

**ChatResponse Interface**:

```typescript
interface ChatResponse<T = unknown> {
  id: string; // OpenRouter response ID
  model: string; // Model used
  content: string; // Raw response content
  parsedContent?: T; // Parsed structured content (if responseFormat provided)
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  finishReason: string; // 'stop', 'length', 'content_filter', etc.
}
```

#### Example Usage

**Example 1: Simple Chat (System + User Message)**

```typescript
const openRouter = new OpenRouterService({
  apiKey: process.env.OPENROUTER_API_KEY!,
  siteName: "10x-project",
  siteUrl: "https://10x-project.example.com",
});

const response = await openRouter.chat(
  [
    {
      role: "system",
      content: "You are a helpful assistant that generates educational flashcards.",
    },
    {
      role: "user",
      content: "Generate 3 flashcards about photosynthesis.",
    },
  ],
  {
    temperature: 0.7,
    maxTokens: 1500,
  }
);

console.log(response.content);
```

**Example 2: Structured Response with JSON Schema**

```typescript
// Define Zod schema for validation
const FlashcardSchema = z.object({
  question: z.string().min(1),
  answer: z.string().min(1),
  difficulty: z.enum(["easy", "medium", "hard"]).optional(),
});

const FlashcardsResponseSchema = z.object({
  flashcards: z.array(FlashcardSchema).min(1),
});

type FlashcardsResponse = z.infer<typeof FlashcardsResponseSchema>;

// Create response format with JSON schema
const responseFormat: ResponseFormat<FlashcardsResponse> = {
  type: "json_schema",
  json_schema: {
    name: "flashcard_generation",
    strict: true,
    schema: {
      type: "object",
      properties: {
        flashcards: {
          type: "array",
          items: {
            type: "object",
            properties: {
              question: { type: "string" },
              answer: { type: "string" },
              difficulty: {
                type: "string",
                enum: ["easy", "medium", "hard"],
              },
            },
            required: ["question", "answer"],
            additionalProperties: false,
          },
        },
      },
      required: ["flashcards"],
      additionalProperties: false,
    },
  },
  validator: FlashcardsResponseSchema,
};

const response = await openRouter.chat<FlashcardsResponse>(
  [
    {
      role: "system",
      content:
        "You are an expert at creating educational flashcards. Generate flashcards with clear questions and concise answers.",
    },
    {
      role: "user",
      content: "Create 5 flashcards about the water cycle.",
    },
  ],
  {
    model: "google/gemini-2.0-flash-exp:free",
    responseFormat,
    temperature: 0.8,
  }
);

// parsedContent is type-safe and validated
const flashcards = response.parsedContent!.flashcards;
flashcards.forEach((card) => {
  console.log(`Q: ${card.question}`);
  console.log(`A: ${card.answer}`);
});
```

**Example 3: Model Parameters Configuration**

```typescript
const response = await openRouter.chat(
  [
    {
      role: "system",
      content: "You are a creative writing assistant.",
    },
    {
      role: "user",
      content: "Write a short story about a time traveler.",
    },
  ],
  {
    model: "google/gemini-2.0-flash-exp:free", // Specify model
    temperature: 1.2, // Higher for more creativity
    maxTokens: 3000, // Allow longer responses
    topP: 0.95, // Nucleus sampling
    frequencyPenalty: 0.3, // Reduce repetition
    presencePenalty: 0.2, // Encourage topic diversity
    stop: ["\n---\n", "THE END"], // Stop sequences
  }
);
```

### 3.2 Method: `chatStream()` (Optional for MVP)

For streaming responses (can be implemented in future iterations).

```typescript
async chatStream(
  messages: ChatMessage[],
  options?: ChatOptions
): AsyncGenerator<ChatStreamChunk, void, unknown>
```

### 3.3 Method: `validateModel()`

Check if a model is available.

```typescript
async validateModel(modelName: string): Promise<boolean>
```

### 3.4 Getter: `availableModels`

Property to access available models (can be cached).

```typescript
get availableModels(): string[]
```

## 4. Private Methods and Fields

### 4.1 Private Fields

```typescript
private readonly apiKey: string;
private readonly baseUrl: string;
private readonly defaultModel: string;
private readonly timeout: number;
private readonly maxRetries: number;
private readonly siteName?: string;
private readonly siteUrl?: string;
```

### 4.2 Private Method: `buildRequest()`

Constructs the HTTP request for OpenRouter API.

```typescript
private buildRequest(
  messages: ChatMessage[],
  options?: ChatOptions
): RequestInit & { url: string }
```

**Implementation Details**:

```typescript
private buildRequest(
  messages: ChatMessage[],
  options?: ChatOptions
): RequestInit & { url: string } {
  const model = options?.model ?? this.defaultModel;

  // Build request body
  const body: any = {
    model,
    messages,
  };

  // Add optional parameters if provided
  if (options?.temperature !== undefined) {
    body.temperature = options.temperature;
  }
  if (options?.maxTokens !== undefined) {
    body.max_tokens = options.maxTokens;
  }
  if (options?.topP !== undefined) {
    body.top_p = options.topP;
  }
  if (options?.frequencyPenalty !== undefined) {
    body.frequency_penalty = options.frequencyPenalty;
  }
  if (options?.presencePenalty !== undefined) {
    body.presence_penalty = options.presencePenalty;
  }
  if (options?.stop !== undefined) {
    body.stop = options.stop;
  }

  // Add response_format if provided
  if (options?.responseFormat) {
    body.response_format = {
      type: options.responseFormat.type,
      json_schema: options.responseFormat.json_schema
    };
  }

  // Build headers
  const headers: Record<string, string> = {
    'Authorization': `Bearer ${this.apiKey}`,
    'Content-Type': 'application/json',
  };

  // Add optional headers for analytics
  if (this.siteName) {
    headers['X-Title'] = this.siteName;
  }
  if (this.siteUrl) {
    headers['HTTP-Referer'] = this.siteUrl;
  }

  return {
    url: `${this.baseUrl}/chat/completions`,
    method: 'POST',
    headers,
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(this.timeout)
  };
}
```

### 4.3 Private Method: `executeRequest()`

Executes HTTP request with retry logic.

```typescript
private async executeRequest(
  request: RequestInit & { url: string },
  attempt: number = 0
): Promise<Response>
```

**Implementation Details**:

```typescript
private async executeRequest(
  request: RequestInit & { url: string },
  attempt: number = 0
): Promise<Response> {
  try {
    const { url, ...init } = request;
    const response = await fetch(url, init);

    // If successful or non-retryable error, return
    if (response.ok || !this.shouldRetry(response.status)) {
      return response;
    }

    // Retry logic
    if (attempt < this.maxRetries) {
      const delay = this.calculateBackoff(attempt);
      await this.sleep(delay);
      return this.executeRequest(request, attempt + 1);
    }

    // Max retries exceeded
    return response;
  } catch (error) {
    // Network errors - retry if possible
    if (attempt < this.maxRetries) {
      const delay = this.calculateBackoff(attempt);
      await this.sleep(delay);
      return this.executeRequest(request, attempt + 1);
    }

    throw error;
  }
}
```

### 4.4 Private Method: `parseResponse()`

Parses and validates API response.

```typescript
private async parseResponse<T>(
  response: Response,
  validator?: z.ZodSchema<T>
): Promise<ChatResponse<T>>
```

**Implementation Details**:

```typescript
private async parseResponse<T>(
  response: Response,
  validator?: z.ZodSchema<T>
): Promise<ChatResponse<T>> {
  const data = await response.json();

  // Basic response structure validation
  if (!data.choices || !Array.isArray(data.choices) || data.choices.length === 0) {
    throw new OpenRouterResponseError('Invalid response structure from OpenRouter');
  }

  const choice = data.choices[0];
  const content = choice.message?.content ?? '';

  // Parse structured content if validator provided
  let parsedContent: T | undefined;
  if (validator && content) {
    try {
      const json = JSON.parse(content);
      parsedContent = validator.parse(json);
    } catch (error) {
      throw new OpenRouterValidationError(
        'Response content does not match expected schema',
        { content, error }
      );
    }
  }

  return {
    id: data.id,
    model: data.model,
    content,
    parsedContent,
    usage: {
      promptTokens: data.usage?.prompt_tokens ?? 0,
      completionTokens: data.usage?.completion_tokens ?? 0,
      totalTokens: data.usage?.total_tokens ?? 0,
    },
    finishReason: choice.finish_reason ?? 'unknown',
  };
}
```

### 4.5 Private Method: `handleError()`

Maps HTTP errors to custom error types.

```typescript
private async handleError(response: Response): Promise<never>
```

**Implementation Details**:

```typescript
private async handleError(response: Response): Promise<never> {
  let errorData: any;
  try {
    errorData = await response.json();
  } catch {
    errorData = { message: 'Unknown error' };
  }

  const errorMessage = errorData.error?.message ?? errorData.message ?? 'OpenRouter API error';

  switch (response.status) {
    case 400:
      throw new OpenRouterValidationError(errorMessage, errorData);
    case 401:
      throw new OpenRouterAuthError('Invalid API key', errorData);
    case 403:
      throw new OpenRouterAuthError('Access forbidden', errorData);
    case 404:
      throw new OpenRouterModelError('Model not found or not available', errorData);
    case 429:
      throw new OpenRouterRateLimitError('Rate limit exceeded', errorData);
    case 500:
    case 502:
    case 503:
      throw new OpenRouterServerError('OpenRouter service error', errorData);
    default:
      throw new OpenRouterError(errorMessage, errorData);
  }
}
```

### 4.6 Private Utility Methods

```typescript
// Check if status code is retryable
private shouldRetry(status: number): boolean {
  return status === 429 || status >= 500;
}

// Calculate exponential backoff delay
private calculateBackoff(attempt: number): number {
  return Math.min(1000 * Math.pow(2, attempt), 10000);
}

// Sleep utility
private sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
```

## 5. Error Handling

### 5.1 Custom Error Classes

Create a hierarchy of custom error classes in `./src/lib/errors/openrouter.errors.ts`:

```typescript
// Base error class
export class OpenRouterError extends Error {
  constructor(
    message: string,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = "OpenRouterError";
    Object.setPrototypeOf(this, OpenRouterError.prototype);
  }
}

// Authentication errors (401, 403)
export class OpenRouterAuthError extends OpenRouterError {
  constructor(message: string, details?: unknown) {
    super(message, details);
    this.name = "OpenRouterAuthError";
  }
}

// Validation errors (400)
export class OpenRouterValidationError extends OpenRouterError {
  constructor(message: string, details?: unknown) {
    super(message, details);
    this.name = "OpenRouterValidationError";
  }
}

// Rate limit errors (429)
export class OpenRouterRateLimitError extends OpenRouterError {
  constructor(message: string, details?: unknown) {
    super(message, details);
    this.name = "OpenRouterRateLimitError";
  }
}

// Model errors (404, model not available)
export class OpenRouterModelError extends OpenRouterError {
  constructor(message: string, details?: unknown) {
    super(message, details);
    this.name = "OpenRouterModelError";
  }
}

// Server errors (500, 502, 503)
export class OpenRouterServerError extends OpenRouterError {
  constructor(message: string, details?: unknown) {
    super(message, details);
    this.name = "OpenRouterServerError";
  }
}

// Response parsing errors
export class OpenRouterResponseError extends OpenRouterError {
  constructor(message: string, details?: unknown) {
    super(message, details);
    this.name = "OpenRouterResponseError";
  }
}

// Network/timeout errors
export class OpenRouterNetworkError extends OpenRouterError {
  constructor(message: string, details?: unknown) {
    super(message, details);
    this.name = "OpenRouterNetworkError";
  }
}
```

### 5.2 Error Handling in API Routes

When using the service in API routes (`./src/pages/api`):

```typescript
import type { APIRoute } from "astro";
import { OpenRouterService } from "@/lib/services/openrouter.service";
import {
  OpenRouterAuthError,
  OpenRouterRateLimitError,
  OpenRouterValidationError,
  OpenRouterError,
} from "@/lib/errors/openrouter.errors";

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const openRouter = new OpenRouterService({
      apiKey: import.meta.env.OPENROUTER_API_KEY,
    });

    // ... process request ...

    const response = await openRouter.chat(messages, options);

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // Handle OpenRouter-specific errors
    if (error instanceof OpenRouterAuthError) {
      return new Response(
        JSON.stringify({
          error: "Authentication failed",
          message: "There was an issue with API authentication. Please contact support.",
        }),
        { status: 500 }
      ); // Don't expose auth details to client
    }

    if (error instanceof OpenRouterRateLimitError) {
      return new Response(
        JSON.stringify({
          error: "Rate limit exceeded",
          message: "Too many requests. Please try again later.",
        }),
        { status: 429 }
      );
    }

    if (error instanceof OpenRouterValidationError) {
      return new Response(
        JSON.stringify({
          error: "Invalid request",
          message: error.message,
        }),
        { status: 400 }
      );
    }

    if (error instanceof OpenRouterError) {
      console.error("OpenRouter error:", error);
      return new Response(
        JSON.stringify({
          error: "AI service error",
          message: "Unable to complete your request. Please try again.",
        }),
        { status: 503 }
      );
    }

    // Handle unexpected errors
    console.error("Unexpected error:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        message: "An unexpected error occurred.",
      }),
      { status: 500 }
    );
  }
};
```

### 5.3 Error Scenarios and Handling

| Error Scenario             | HTTP Status | Error Type                  | Retry? | User Message                                           |
| -------------------------- | ----------- | --------------------------- | ------ | ------------------------------------------------------ |
| Invalid API key            | 401         | `OpenRouterAuthError`       | No     | "Service configuration error. Please contact support." |
| Rate limit exceeded        | 429         | `OpenRouterRateLimitError`  | Yes    | "Too many requests. Please try again in a moment."     |
| Invalid request parameters | 400         | `OpenRouterValidationError` | No     | "Invalid request. Please check your input."            |
| Model not available        | 404         | `OpenRouterModelError`      | No     | "The AI model is currently unavailable."               |
| Server error               | 500-503     | `OpenRouterServerError`     | Yes    | "AI service is temporarily unavailable."               |
| Network timeout            | -           | `OpenRouterNetworkError`    | Yes    | "Request timed out. Please try again."                 |
| Invalid response format    | -           | `OpenRouterResponseError`   | No     | "Received invalid response from AI service."           |
| Response validation failed | -           | `OpenRouterValidationError` | No     | "AI response did not match expected format."           |

## 6. Security Considerations

### 6.1 API Key Management

**DO:**

- Store API key in environment variables (`.env` file, never committed)
- Use `import.meta.env.OPENROUTER_API_KEY` to access
- Validate API key presence at service initialization
- Never log or expose API key in error messages

**DON'T:**

- Hard-code API key in source files
- Send API key to client-side code
- Include API key in error messages or logs

### 6.2 Request Sanitization

**Input Validation:**

```typescript
// Validate and sanitize messages before sending
const MessageSchema = z.object({
  role: z.enum(["system", "user", "assistant"]),
  content: z.string().max(10000), // Limit message length
});

const MessagesSchema = z.array(MessageSchema).min(1).max(50);
```

**Content Filtering:**

- Implement content moderation for user inputs if needed
- Respect OpenRouter's usage policies
- Handle content filter responses appropriately

### 6.3 Rate Limiting

Implement client-side rate limiting to prevent abuse:

```typescript
// In service or middleware
class RateLimiter {
  private requests: number[] = [];
  private readonly maxRequests: number;
  private readonly windowMs: number;

  constructor(maxRequests: number = 10, windowMs: number = 60000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

  async checkLimit(): Promise<void> {
    const now = Date.now();
    this.requests = this.requests.filter((time) => now - time < this.windowMs);

    if (this.requests.length >= this.maxRequests) {
      throw new Error("Rate limit exceeded");
    }

    this.requests.push(now);
  }
}
```

### 6.4 Response Validation

Always validate responses before using them:

```typescript
// Use Zod schemas to validate structured responses
// Never trust raw API responses without validation
// Sanitize content before displaying to users
```

### 6.5 Timeout Protection

```typescript
// Always set request timeouts to prevent hanging requests
// Use AbortSignal.timeout() for built-in timeout support
// Default timeout: 30 seconds (configurable)
```

### 6.6 Error Information Disclosure

```typescript
// In production: Never expose internal errors to client
// Log detailed errors server-side
// Return generic messages to client
// Don't include sensitive details in error responses
```

## 7. Step-by-Step Implementation Plan

### Phase 1: Foundation Setup

#### Step 1: Create Error Classes

**File**: `./src/lib/errors/openrouter.errors.ts`

1. Create base `OpenRouterError` class
2. Create specialized error classes:
   - `OpenRouterAuthError`
   - `OpenRouterValidationError`
   - `OpenRouterRateLimitError`
   - `OpenRouterModelError`
   - `OpenRouterServerError`
   - `OpenRouterResponseError`
   - `OpenRouterNetworkError`
3. Export all error classes

#### Step 2: Define Type Interfaces

**File**: `./src/lib/services/openrouter.types.ts`

1. Define `OpenRouterConfig` interface
2. Define `ChatMessage` interface
3. Define `ChatOptions` interface
4. Define `ResponseFormat` interface
5. Define `JsonSchema` interface
6. Define `ChatResponse` interface
7. Define `ChatStreamChunk` interface (for future)
8. Export all interfaces

#### Step 3: Create Zod Validation Schemas

**File**: `./src/lib/services/openrouter.schemas.ts`

1. Create `OpenRouterConfigSchema`
2. Create `ChatMessageSchema`
3. Create `ChatOptionsSchema`
4. Export schemas

### Phase 2: Service Implementation

#### Step 4: Create Service Class Structure

**File**: `./src/lib/services/openrouter.service.ts`

1. Import dependencies (types, errors, zod)
2. Create `OpenRouterService` class
3. Define private fields for configuration
4. Implement constructor with validation

```typescript
export class OpenRouterService {
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly defaultModel: string;
  private readonly timeout: number;
  private readonly maxRetries: number;
  private readonly siteName?: string;
  private readonly siteUrl?: string;

  constructor(config: OpenRouterConfig) {
    // Validate config
    const validated = OpenRouterConfigSchema.parse(config);

    // Assign to private fields
    this.apiKey = validated.apiKey;
    this.baseUrl = validated.baseUrl;
    this.defaultModel = validated.defaultModel;
    this.timeout = validated.timeout;
    this.maxRetries = validated.maxRetries;
    this.siteName = validated.siteName;
    this.siteUrl = validated.siteUrl;
  }
}
```

#### Step 5: Implement Private Utility Methods

1. Implement `shouldRetry()` method
2. Implement `calculateBackoff()` method
3. Implement `sleep()` method

#### Step 6: Implement `buildRequest()` Method

1. Extract model from options or use default
2. Build request body with messages
3. Add optional parameters (temperature, maxTokens, etc.)
4. Handle `response_format` formatting
5. Build headers with authorization
6. Add optional analytics headers
7. Return complete request configuration

#### Step 7: Implement `executeRequest()` Method

1. Execute fetch request
2. Handle successful responses
3. Implement retry logic for retryable errors
4. Calculate and apply exponential backoff
5. Handle network errors
6. Throw error if max retries exceeded

#### Step 8: Implement `handleError()` Method

1. Parse error response JSON
2. Extract error message
3. Map HTTP status codes to custom error types
4. Throw appropriate error instance

#### Step 9: Implement `parseResponse()` Method

1. Parse response JSON
2. Validate basic response structure
3. Extract message content
4. Parse JSON content if validator provided
5. Validate parsed content with Zod schema
6. Return typed `ChatResponse` object

#### Step 10: Implement `chat()` Method

1. Validate messages array
2. Build request using `buildRequest()`
3. Execute request using `executeRequest()`
4. Check response status
5. Handle errors using `handleError()`
6. Parse response using `parseResponse()`
7. Return typed chat response

```typescript
async chat<T = unknown>(
  messages: ChatMessage[],
  options?: ChatOptions<T>
): Promise<ChatResponse<T>> {
  // Validate messages
  const validatedMessages = MessagesSchema.parse(messages);

  // Build request
  const request = this.buildRequest(validatedMessages, options);

  // Execute with retry logic
  const response = await this.executeRequest(request);

  // Handle errors
  if (!response.ok) {
    await this.handleError(response);
  }

  // Parse and return response
  return this.parseResponse<T>(
    response,
    options?.responseFormat?.validator
  );
}
```
