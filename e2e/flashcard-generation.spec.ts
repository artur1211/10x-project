import { test, expect } from "./fixtures/pages";

test.describe("Flashcard Generation", () => {
  test.beforeEach(async ({ generatePage }) => {
    await generatePage.goto();
  });

  test("should display generation form", async ({ page }) => {
    await expect(page.getByRole("heading", { name: /generate/i })).toBeVisible();
  });

  test("should generate flashcards from text", async ({ generatePage }) => {
    const sampleText =
      "The Pythagorean theorem states that in a right triangle, the square of the hypotenuse equals the sum of squares of the other two sides.";

    await generatePage.generateFlashcards(sampleText);
    await generatePage.waitForFlashcards();

    const count = await generatePage.getFlashcardsCount();
    expect(count).toBeGreaterThan(0);
  });
});
