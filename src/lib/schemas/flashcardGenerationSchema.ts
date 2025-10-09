import { z } from "zod";

export const generateFlashcardsSchema = z.object({
  input_text: z
    .string()
    .min(1000, "Text must be at least 1000 characters")
    .max(10000, "Text must not exceed 10000 characters")
    .trim(),
});

export type GenerateFlashcardsInput = z.infer<typeof generateFlashcardsSchema>;
