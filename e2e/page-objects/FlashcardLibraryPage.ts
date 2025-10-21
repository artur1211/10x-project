import type { Page, Locator } from "@playwright/test";

/**
 * Page Object Model for the Flashcard Library page
 * Provides methods and selectors for interacting with the library view
 */
export class FlashcardLibraryPage {
  readonly page: Page;

  // Page elements
  readonly pageTitle: Locator;
  readonly capacityIndicator: Locator;
  readonly searchInput: Locator;
  readonly sortDropdown: Locator;
  readonly viewToggleGrid: Locator;
  readonly viewToggleList: Locator;
  readonly createButton: Locator;
  readonly deleteSelectedButton: Locator;
  readonly flashcardList: Locator;
  readonly emptyState: Locator;
  readonly pagination: Locator;

  // Dialog elements
  readonly createDialog: Locator;
  readonly editDialog: Locator;
  readonly deleteDialog: Locator;
  readonly dialogTitle: Locator;
  readonly frontTextInput: Locator;
  readonly backTextInput: Locator;
  readonly frontTextCounter: Locator;
  readonly backTextCounter: Locator;
  readonly dialogSaveButton: Locator;
  readonly dialogCancelButton: Locator;
  readonly dialogConfirmButton: Locator;

  constructor(page: Page) {
    this.page = page;

    // Main page elements
    this.pageTitle = page.getByRole("heading", { name: /flashcards library/i });
    this.capacityIndicator = page.locator('[data-testid="capacity-indicator"]');
    this.searchInput = page.getByPlaceholder(/search flashcards/i);
    this.sortDropdown = page.getByRole("button", { name: /sort:/i });
    this.viewToggleGrid = page.locator('button[title*="grid" i]').first();
    this.viewToggleList = page.locator('button[title*="list" i]').first();
    this.createButton = page.getByRole("button", { name: /create flashcard/i });
    this.deleteSelectedButton = page.getByRole("button", { name: /delete selected/i });
    this.flashcardList = page.locator('[data-testid="flashcard-list"]');
    this.emptyState = page.getByText(/no flashcards found/i);
    this.pagination = page.locator('[data-testid="pagination"]');

    // Dialog elements
    this.createDialog = page.getByRole("dialog");
    this.editDialog = page.getByRole("dialog");
    this.deleteDialog = page.getByRole("dialog");
    this.dialogTitle = page.getByRole("dialog").getByRole("heading");
    this.frontTextInput = page.getByLabel(/front text/i);
    this.backTextInput = page.getByLabel(/back text/i);
    this.frontTextCounter = page.getByRole("dialog").locator("text=/\\d+ \\/ 500/");
    this.backTextCounter = page.getByRole("dialog").locator("text=/\\d+ \\/ 1000/");
    this.dialogSaveButton = page.getByRole("dialog").getByRole("button", { name: /create|save/i });
    this.dialogCancelButton = page.getByRole("dialog").getByRole("button", { name: /cancel/i });
    this.dialogConfirmButton = page.getByRole("dialog").getByRole("button", { name: /delete/i });
  }

  /**
   * Navigate to the flashcard library page
   */
  async goto() {
    await this.page.goto("/flashcards");
    await this.page.waitForLoadState("networkidle");
  }

  /**
   * Get a flashcard item by its front text content
   */
  getFlashcardByText(frontText: string): Locator {
    return this.page.locator('[data-testid="flashcard-item"]').filter({ hasText: frontText });
  }

  /**
   * Get the edit button for a specific flashcard
   */
  getFlashcardEditButton(frontText: string): Locator {
    return this.getFlashcardByText(frontText).getByRole("button", { name: /edit/i });
  }

  /**
   * Get the delete button for a specific flashcard
   */
  getFlashcardDeleteButton(frontText: string): Locator {
    return this.getFlashcardByText(frontText).getByRole("button", { name: /delete/i });
  }

  /**
   * Get the checkbox for a specific flashcard
   */
  getFlashcardCheckbox(frontText: string): Locator {
    return this.getFlashcardByText(frontText).getByRole("checkbox");
  }

  /**
   * Click the create flashcard button
   */
  async clickCreateFlashcard() {
    await this.createButton.click();
  }

  /**
   * Fill the flashcard form (for create or edit)
   */
  async fillFlashcardForm(frontText: string, backText: string) {
    await this.frontTextInput.clear();
    await this.frontTextInput.fill(frontText);
    await this.backTextInput.clear();
    await this.backTextInput.fill(backText);
  }

  /**
   * Submit the flashcard form
   */
  async submitFlashcardForm() {
    await this.dialogSaveButton.click();
  }

  /**
   * Cancel the flashcard form
   */
  async cancelFlashcardForm() {
    await this.dialogCancelButton.click();
  }

  /**
   * Click edit button for a specific flashcard
   */
  async clickEditFlashcard(frontText: string) {
    await this.getFlashcardEditButton(frontText).click();
  }

  /**
   * Click delete button for a specific flashcard
   */
  async clickDeleteFlashcard(frontText: string) {
    await this.getFlashcardDeleteButton(frontText).click();
  }

  /**
   * Confirm deletion in the confirmation dialog
   */
  async confirmDeletion() {
    await this.dialogConfirmButton.click();
  }

  /**
   * Cancel deletion in the confirmation dialog
   */
  async cancelDeletion() {
    await this.dialogCancelButton.click();
  }

  /**
   * Search for flashcards
   */
  async searchFlashcards(query: string) {
    await this.searchInput.fill(query);
    // Wait for debounce (300ms) plus a bit extra
    await this.page.waitForTimeout(500);
  }

  /**
   * Select a flashcard by checking its checkbox
   */
  async selectFlashcard(frontText: string) {
    await this.getFlashcardCheckbox(frontText).check();
  }

  /**
   * Deselect a flashcard by unchecking its checkbox
   */
  async deselectFlashcard(frontText: string) {
    await this.getFlashcardCheckbox(frontText).uncheck();
  }

  /**
   * Wait for a toast notification to appear
   */
  async waitForToast(message: string) {
    await this.page.getByText(message).waitFor({ state: "visible", timeout: 5000 });
  }

  /**
   * Wait for the flashcard list to update (after create/edit/delete)
   */
  async waitForListUpdate() {
    // Wait for network to be idle after mutation
    await this.page.waitForLoadState("networkidle");
  }

  /**
   * Get count of visible flashcards
   */
  async getFlashcardCount(): Promise<number> {
    const items = await this.page.locator('[data-testid="flashcard-item"]').count();
    return items;
  }

  /**
   * Check if a flashcard exists in the list
   */
  async flashcardExists(frontText: string): Promise<boolean> {
    const count = await this.getFlashcardByText(frontText).count();
    return count > 0;
  }
}
