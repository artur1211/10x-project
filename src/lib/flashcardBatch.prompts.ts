import type { ChatMessage } from "./openrouter.types";

/**
 * System prompt for flashcard generation
 * Defines the AI's role and guidelines for creating educational flashcards
 */
const FLASHCARD_GENERATION_SYSTEM_PROMPT = `You are an expert educational content creator specializing in generating high-quality flashcards for spaced repetition learning.

Your task is to analyze the provided text and create effective flashcards that:
1. Focus on key concepts, definitions, facts, and relationships
2. Use clear, concise language
3. Test understanding rather than mere memorization when possible
4. Include context in questions when needed for clarity
5. Provide complete, accurate answers

Guidelines for creating flashcards:
- Questions should be specific and unambiguous
- Avoid yes/no questions; prefer questions that require recall
- Break down complex topics into multiple simple cards
- Use the exact terminology from the source material
- Keep questions between 10-500 characters
- Keep answers between 10-1000 characters
- Generate an appropriate number of cards based on content density (aim for 5-10 cards per 1000 characters)

Format your response as JSON with an array of flashcard objects, each containing "question" and "answer" fields.`;

/**
 * Creates a user prompt for flashcard generation from input text
 */
function createUserPrompt(inputText: string, estimatedCards: number): string {
  return `Please generate approximately ${estimatedCards} flashcards from the following text. Focus on the most important concepts, facts, and relationships.

Text to convert into flashcards:

<input_text>
${inputText}
</input_text>

*** Provide cards in language of input text ***

Remember to create clear, educational flashcards that will help someone learn and retain this information through spaced repetition.`;
}

/**
 * Builds the complete message array for flashcard generation
 */
export function buildFlashcardGenerationMessages(inputText: string): ChatMessage[] {
  return [
    {
      role: "system",
      content: FLASHCARD_GENERATION_SYSTEM_PROMPT,
    },
    {
      role: "user",
      content: createUserPrompt(inputText, calculateRecommendedCardCount(inputText)),
    },
  ];
}

/**
 * Calculates recommended number of flashcards based on input text length
 */
export function calculateRecommendedCardCount(inputText: string): number {
  const charCount = inputText.length;
  // Aim for 5-10 cards per 1000 characters
  const minCards = Math.ceil((charCount / 1000) * 5);
  const maxCards = Math.ceil((charCount / 1000) * 10);

  // Clamp between reasonable bounds
  return Math.max(3, Math.min(50, Math.floor((minCards + maxCards) / 2)));
}
