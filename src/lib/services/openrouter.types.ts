import type { z } from "zod";

export interface OpenRouterConfig {
  apiKey: string;
  baseUrl?: string;
  model?: string;
  timeout?: number;
  maxRetries?: number;
  siteName?: string;
  siteUrl?: string;
}

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface JsonSchema {
  type: "object";
  properties: Record<string, unknown>;
  required: string[];
  additionalProperties: boolean;
}

export interface ResponseFormat<T = unknown> {
  type: "json_schema";
  json_schema: {
    name: string;
    strict: boolean;
    schema: JsonSchema;
  };
  validator?: z.ZodSchema<T>;
}

export interface ChatOptions<T = unknown> {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
  responseFormat?: ResponseFormat<T>;
  stop?: string[];
}

export interface ChatResponse<T = unknown> {
  id: string;
  model: string;
  content: string;
  parsedContent?: T;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  finishReason: string;
}

export interface ChatStreamChunk {
  id: string;
  model: string;
  delta: string;
  finishReason?: string;
}
