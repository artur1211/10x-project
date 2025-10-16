import { type Locator, type Page } from "@playwright/test";
import { BasePage } from "./BasePage";

/**
 * Page Object Model for Flashcard Generation Page
 */
export class GeneratePage extends BasePage {
  readonly textInput: Locator;
  readonly generateButton: Locator;
  readonly flashcardsList: Locator;
  readonly saveButton: Locator;

  constructor(page: Page) {
    super(page);
    this.textInput = page.getByLabel("Enter text to generate flashcards");
    this.generateButton = page.getByRole("button", { name: "Generate" });
    this.flashcardsList = page.getByTestId("flashcards-list");
    this.saveButton = page.getByRole("button", { name: "Save" });
  }

  async goto() {
    await super.goto("/generate");
  }

  async generateFlashcards(text: string) {
    await this.textInput.fill(text);
    await this.generateButton.click();
  }

  async waitForFlashcards() {
    await this.flashcardsList.waitFor({ state: "visible" });
  }

  async getFlashcardsCount() {
    return await this.flashcardsList.locator('[data-testid="flashcard-item"]').count();
  }
}
