import type { z } from "zod";
import type { OpenRouterConfig, ChatMessage, ChatOptions, ChatResponse } from "./openrouter.types";
import { OpenRouterConfigSchema, MessagesSchema } from "./openrouter.schemas";
import {
  OpenRouterError,
  OpenRouterAuthError,
  OpenRouterValidationError,
  OpenRouterRateLimitError,
  OpenRouterModelError,
  OpenRouterServerError,
  OpenRouterResponseError,
} from "./openrouter.errors";

export class OpenRouterService {
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly model: string;
  private readonly timeout: number;
  private readonly maxRetries: number;

  constructor(config: OpenRouterConfig) {
    // Validate config
    const validated = OpenRouterConfigSchema.parse(config);

    // Assign to private fields
    this.apiKey = validated.apiKey;
    this.baseUrl = validated.baseUrl;
    this.model = validated.model;
    this.timeout = validated.timeout;
    this.maxRetries = validated.maxRetries;
  }

  /**
   * Primary method for chat completion requests
   */
  async chat<T = unknown>(messages: ChatMessage[], options?: ChatOptions<T>): Promise<ChatResponse<T>> {
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
    return this.parseResponse<T>(response, options?.responseFormat?.validator);
  }

  /**
   * Constructs the HTTP request for OpenRouter API
   */
  private buildRequest(messages: ChatMessage[], options?: ChatOptions): RequestInit & { url: string } {
    const model = options?.model ?? this.model;

    // Build request body
    const body: Record<string, unknown> = {
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
        json_schema: options.responseFormat.json_schema,
      };
    }

    // Build headers
    const headers: Record<string, string> = {
      Authorization: `Bearer ${this.apiKey}`,
      "Content-Type": "application/json",
    };

    return {
      url: `${this.baseUrl}/chat/completions`,
      method: "POST",
      headers,
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(this.timeout),
    };
  }

  /**
   * Executes HTTP request with retry logic
   */
  private async executeRequest(request: RequestInit & { url: string }, attempt = 0): Promise<Response> {
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

  /**
   * Maps HTTP errors to custom error types
   */
  private async handleError(response: Response): Promise<never> {
    let errorData: { error?: { message?: string }; message?: string };
    try {
      errorData = await response.json();
    } catch {
      errorData = { message: "Unknown error" };
    }

    const errorMessage = errorData.error?.message ?? errorData.message ?? "OpenRouter API error";

    switch (response.status) {
      case 400:
        throw new OpenRouterValidationError(errorMessage, errorData);
      case 401:
        throw new OpenRouterAuthError("Invalid API key", errorData);
      case 403:
        throw new OpenRouterAuthError("Access forbidden", errorData);
      case 404:
        throw new OpenRouterModelError("Model not found or not available", errorData);
      case 429:
        throw new OpenRouterRateLimitError("Rate limit exceeded", errorData);
      case 500:
      case 502:
      case 503:
        throw new OpenRouterServerError("OpenRouter service error", errorData);
      default:
        throw new OpenRouterError(errorMessage, errorData);
    }
  }

  /**
   * Parses and validates API response
   */
  private async parseResponse<T>(response: Response, validator?: z.ZodSchema<T>): Promise<ChatResponse<T>> {
    const data = await response.json();

    // Basic response structure validation
    if (!data.choices || !Array.isArray(data.choices) || data.choices.length === 0) {
      throw new OpenRouterResponseError("Invalid response structure from OpenRouter");
    }

    const choice = data.choices[0];
    const content = choice.message?.content ?? "";

    // Parse structured content if validator provided
    let parsedContent: T | undefined;
    if (validator && content) {
      try {
        const json = JSON.parse(content);
        parsedContent = validator.parse(json);
      } catch (error) {
        throw new OpenRouterValidationError("Response content does not match expected schema", { content, error });
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
      finishReason: choice.finish_reason ?? "unknown",
    };
  }

  /**
   * Check if status code is retryable
   */
  private shouldRetry(status: number): boolean {
    return status === 429 || status >= 500;
  }

  /**
   * Calculate exponential backoff delay
   */
  private calculateBackoff(attempt: number): number {
    return Math.min(1000 * Math.pow(2, attempt), 10000);
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
