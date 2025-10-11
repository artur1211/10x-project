import { z } from "zod";

export const OpenRouterConfigSchema = z.object({
  apiKey: z.string().min(1, "API key is required"),
  baseUrl: z.string().url().optional().default("https://openrouter.ai/api/v1"),
  model: z.string().optional().default("google/gemini-2.0-flash-exp:free"),
  timeout: z.number().positive().optional().default(30000),
  maxRetries: z.number().int().min(0).max(5).optional().default(3),
  siteName: z.string().optional(),
  siteUrl: z.string().url().optional(),
});

export const ChatMessageSchema = z.object({
  role: z.enum(["system", "user", "assistant"]),
  content: z.string().max(10000),
});

export const MessagesSchema = z.array(ChatMessageSchema).min(1).max(50);

export const ChatOptionsSchema = z
  .object({
    model: z.string().optional(),
    temperature: z.number().min(0).max(2).optional(),
    maxTokens: z.number().positive().optional(),
    topP: z.number().min(0).max(1).optional(),
    frequencyPenalty: z.number().min(-2).max(2).optional(),
    presencePenalty: z.number().min(-2).max(2).optional(),
    responseFormat: z.any().optional(),
    stop: z.array(z.string()).optional(),
  })
  .optional();
