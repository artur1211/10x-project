import { Page, Locator } from "@playwright/test";

/**
 * Page Object Model for Flashcard Generator
 * Encapsulates all selectors and actions for the flashcard generation workflow
 */
export class FlashcardGeneratorPage {
  readonly page: Page;

  // Form elements
  readonly flashcardForm: Locator;
  readonly inputTextarea: Locator;
  readonly characterCounter: Locator;
  readonly generateButton: Locator;

  // Loading indicator
  readonly loadingIndicator: Locator;
  readonly loadingMessage: Locator;

  // Review section
  readonly cardReviewSection: Locator;
  readonly bulkActionBar: Locator;
  readonly cardReviewGrid: Locator;

  // Bulk action bar elements
  readonly summaryTotal: Locator;
  readonly summaryAccepted: Locator;
  readonly summaryEdited: Locator;
  readonly summaryRejected: Locator;
  readonly summaryPending: Locator;
  readonly acceptAllButton: Locator;
  readonly rejectAllButton: Locator;
  readonly saveDecisionsButton: Locator;

  // Edit modal
  readonly editCardModal: Locator;
  readonly editFrontTextarea: Locator;
  readonly editBackTextarea: Locator;
  readonly editSaveButton: Locator;
  readonly editCancelButton: Locator;

  // Success modal
  readonly successModal: Locator;
  readonly successTitle: Locator;
  readonly cardsAcceptedCount: Locator;
  readonly cardsEditedCount: Locator;
  readonly cardsRejectedCount: Locator;
  readonly viewFlashcardsButton: Locator;
  readonly generateMoreButton: Locator;

  // Error display
  readonly errorDisplay: Locator;
  readonly errorRetryButton: Locator;
  readonly errorDismissButton: Locator;

  constructor(page: Page) {
    this.page = page;

    // Form elements
    this.flashcardForm = page.getByTestId("flashcard-form");
    this.inputTextarea = page.getByTestId("input-textarea");
    this.characterCounter = page.getByTestId("character-counter");
    this.generateButton = page.getByTestId("generate-button");

    // Loading indicator
    this.loadingIndicator = page.getByTestId("loading-indicator");
    this.loadingMessage = page.getByTestId("loading-message");

    // Review section
    this.cardReviewSection = page.getByTestId("card-review-section");
    this.bulkActionBar = page.getByTestId("bulk-action-bar");
    this.cardReviewGrid = page.getByTestId("card-review-grid");

    // Bulk action bar elements - use .first() to select the visible instance (desktop bar)
    // Note: There are two BulkActionBar instances (desktop + mobile sticky), so we target the first one
    this.summaryTotal = page.getByTestId("summary-total").first();
    this.summaryAccepted = page.getByTestId("summary-accepted").first();
    this.summaryEdited = page.getByTestId("summary-edited").first();
    this.summaryRejected = page.getByTestId("summary-rejected").first();
    this.summaryPending = page.getByTestId("summary-pending").first();
    this.acceptAllButton = page.getByTestId("accept-all-button").first();
    this.rejectAllButton = page.getByTestId("reject-all-button").first();
    this.saveDecisionsButton = page.getByTestId("save-decisions-button").first();

    // Edit modal
    this.editCardModal = page.getByTestId("edit-card-modal");
    this.editFrontTextarea = page.getByTestId("edit-front-textarea");
    this.editBackTextarea = page.getByTestId("edit-back-textarea");
    this.editSaveButton = page.getByTestId("edit-save-button");
    this.editCancelButton = page.getByTestId("edit-cancel-button");

    // Success modal
    this.successModal = page.getByTestId("success-modal");
    this.successTitle = page.getByTestId("success-title");
    this.cardsAcceptedCount = page.getByTestId("cards-accepted-count");
    this.cardsEditedCount = page.getByTestId("cards-edited-count");
    this.cardsRejectedCount = page.getByTestId("cards-rejected-count");
    this.viewFlashcardsButton = page.getByTestId("view-flashcards-button");
    this.generateMoreButton = page.getByTestId("generate-more-button");

    // Error display
    this.errorDisplay = page.getByTestId("error-display");
    this.errorRetryButton = page.getByTestId("error-retry-button");
    this.errorDismissButton = page.getByTestId("error-dismiss-button");
  }

  /**
   * Navigate to the flashcard generation page
   */
  async goto() {
    await this.page.goto("/generate");
  }

  /**
   * Fill the input textarea with text
   * Uses pressSequentially for better React compatibility
   */
  async fillInputText(text: string) {
    await this.inputTextarea.click();
    await this.inputTextarea.clear();
    // pressSequentially types character by character, triggering all React events properly
    await this.inputTextarea.pressSequentially(text, { delay: 0 });
  }

  /**
   * Click the generate button
   */
  async clickGenerate() {
    await this.generateButton.click();
  }

  /**
   * Wait for the generation to complete (loading indicator disappears)
   */
  async waitForGeneration() {
    await this.loadingIndicator.waitFor({ state: "hidden" });
  }

  /**
   * Get the number of generated cards
   */
  async getCardCount(): Promise<number> {
    const cards = await this.page.getByTestId(/^generated-card-\d+$/).all();
    return cards.length;
  }

  /**
   * Get a specific card locator
   */
  getCard(index: number): Locator {
    return this.page.getByTestId(`generated-card-${index}`);
  }

  /**
   * Get card badge locator
   */
  getCardBadge(index: number): Locator {
    return this.page.getByTestId(`card-badge-${index}`);
  }

  /**
   * Get card front text locator
   */
  getCardFront(index: number): Locator {
    return this.page.getByTestId(`card-front-${index}`);
  }

  /**
   * Get card back text locator
   */
  getCardBack(index: number): Locator {
    return this.page.getByTestId(`card-back-${index}`);
  }

  /**
   * Accept a specific card
   */
  async acceptCard(index: number) {
    await this.page.getByTestId(`accept-button-${index}`).click();
  }

  /**
   * Reject a specific card
   */
  async rejectCard(index: number) {
    await this.page.getByTestId(`reject-button-${index}`).click();
  }

  /**
   * Open edit modal for a specific card
   */
  async openEditCard(index: number) {
    await this.page.getByTestId(`edit-button-${index}`).click();
  }

  /**
   * Edit a card (opens modal, fills fields, and saves)
   */
  async editCard(index: number, frontText: string, backText: string) {
    await this.openEditCard(index);
    await this.editCardModal.waitFor({ state: "visible" });
    
    // Clear and fill front text
    await this.editFrontTextarea.clear();
    await this.editFrontTextarea.fill(frontText);
    
    // Clear and fill back text
    await this.editBackTextarea.clear();
    await this.editBackTextarea.fill(backText);
    
    // Save changes
    await this.editSaveButton.click();
    
    // Wait for modal to close
    await this.editCardModal.waitFor({ state: "hidden" });
  }

  /**
   * Click Accept All button
   */
  async clickAcceptAll() {
    await this.acceptAllButton.click();
  }

  /**
   * Click Reject All button
   */
  async clickRejectAll() {
    await this.rejectAllButton.click();
  }

  /**
   * Click Save Decisions button
   */
  async clickSaveDecisions() {
    await this.saveDecisionsButton.click();
  }

  /**
   * Get success summary statistics
   */
  async getSuccessSummary(): Promise<{
    accepted: number;
    edited: number;
    rejected: number;
  }> {
    await this.successModal.waitFor({ state: "visible" });
    
    const acceptedText = await this.cardsAcceptedCount.textContent();
    const editedText = await this.cardsEditedCount.textContent();
    const rejectedText = await this.cardsRejectedCount.textContent();

    return {
      accepted: parseInt(acceptedText || "0", 10),
      edited: parseInt(editedText || "0", 10),
      rejected: parseInt(rejectedText || "0", 10),
    };
  }

  /**
   * Click View My Flashcards button
   */
  async clickViewFlashcards() {
    await this.viewFlashcardsButton.click();
  }

  /**
   * Click Generate More button
   */
  async clickGenerateMore() {
    await this.generateMoreButton.click();
  }

  /**
   * Get bulk summary statistics
   */
  async getBulkSummary(): Promise<{
    total: number;
    accepted: number;
    edited: number;
    rejected: number;
    pending: number;
  }> {
    const totalText = await this.summaryTotal.textContent();
    const acceptedText = await this.summaryAccepted.textContent();
    const editedText = await this.summaryEdited.textContent();
    const rejectedText = await this.summaryRejected.textContent();
    const pendingText = await this.summaryPending.textContent();

    return {
      total: parseInt(totalText || "0", 10),
      accepted: parseInt(acceptedText || "0", 10),
      edited: parseInt(editedText || "0", 10),
      rejected: parseInt(rejectedText || "0", 10),
      pending: parseInt(pendingText || "0", 10),
    };
  }
}

