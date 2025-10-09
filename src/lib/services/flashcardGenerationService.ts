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
