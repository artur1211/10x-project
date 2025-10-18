import { test, expect } from "@playwright/test";
import { FlashcardGeneratorPage } from "./page-objects/FlashcardGeneratorPage";
import { SAMPLE_TEXT } from "./fixtures/sample-text";
import { login, TEST_USER } from "./helpers/auth";
import { getUserFlashcardCount } from "./helpers/database";

test.describe("Flashcard Generation", () => {
  let flashcardPage: FlashcardGeneratorPage;

  test.beforeEach(async ({ page }) => {
    flashcardPage = new FlashcardGeneratorPage(page);

    // Login before each test via UI
    await login(page);

    // Navigate to the generate page
    await flashcardPage.goto();
  });

  test("should complete full flashcard generation workflow", async () => {
    // ===== ARRANGE =====
    // Verify we're on the generate page with the form visible
    await expect(flashcardPage.flashcardForm).toBeVisible();

    // Record initial database state (global setup cleans it, but tests may accumulate)
    const initialFlashcardCount = await getUserFlashcardCount(TEST_USER.id);

    // ===== ACT & ASSERT: Input Phase =====

    // Enter valid text (1500 characters)
    await flashcardPage.fillInputText(SAMPLE_TEXT);

    // Verify character counter shows valid state
    await expect(flashcardPage.characterCounter).toBeVisible();
    await expect(flashcardPage.characterCounter).toContainText(/\d+/); // Should contain numbers

    // Verify generate button is enabled
    await expect(flashcardPage.generateButton).toBeEnabled();

    // Click generate button
    await flashcardPage.clickGenerate();

    // ===== ACT & ASSERT: Generation Phase =====

    // Verify loading indicator appears
    await expect(flashcardPage.loadingIndicator).toBeVisible();
    await expect(flashcardPage.loadingMessage).toContainText("Generating flashcards...");

    // Wait for generation to complete
    await flashcardPage.waitForGeneration();

    // ===== ACT & ASSERT: Review Phase =====

    // Verify card review section is visible
    await expect(flashcardPage.cardReviewSection).toBeVisible();

    // Verify correct number of cards generated (5 from mock)
    const cardCount = await flashcardPage.getCardCount();
    expect(cardCount).toBe(5);

    // Verify bulk action bar shows correct initial stats
    let bulkSummary = await flashcardPage.getBulkSummary();
    expect(bulkSummary.total).toBe(5);
    expect(bulkSummary.pending).toBe(5);
    expect(bulkSummary.accepted).toBe(0);
    expect(bulkSummary.edited).toBe(0);
    expect(bulkSummary.rejected).toBe(0);

    // Verify all cards are visible
    for (let i = 0; i < 5; i++) {
      await expect(flashcardPage.getCard(i)).toBeVisible();
      await expect(flashcardPage.getCardBadge(i)).toContainText("Pending");
    }

    // ===== ACT & ASSERT: Card Actions =====

    // Accept card 0
    await flashcardPage.acceptCard(0);
    await expect(flashcardPage.getCardBadge(0)).toContainText("Accepted");

    // Verify bulk summary updated
    bulkSummary = await flashcardPage.getBulkSummary();
    expect(bulkSummary.accepted).toBe(1);
    expect(bulkSummary.pending).toBe(4);

    // Reject card 1
    await flashcardPage.rejectCard(1);
    await expect(flashcardPage.getCardBadge(1)).toContainText("Rejected");

    // Verify bulk summary updated
    bulkSummary = await flashcardPage.getBulkSummary();
    expect(bulkSummary.rejected).toBe(1);
    expect(bulkSummary.pending).toBe(3);

    // Edit card 2
    const newFrontText = "What is the primary function of photosynthesis?";
    const newBackText = "To convert light energy into chemical energy stored in glucose molecules.";

    await flashcardPage.editCard(2, newFrontText, newBackText);

    // Verify card badge shows edited state
    await expect(flashcardPage.getCardBadge(2)).toContainText("Edited");

    // Verify the card shows the edited content
    await expect(flashcardPage.getCardFront(2)).toContainText(newFrontText);
    await expect(flashcardPage.getCardBack(2)).toContainText(newBackText);

    // Verify bulk summary updated
    bulkSummary = await flashcardPage.getBulkSummary();
    expect(bulkSummary.edited).toBe(1);
    expect(bulkSummary.pending).toBe(2);

    // ===== ACT & ASSERT: Bulk Actions =====

    // Use "Accept All" for remaining pending cards (cards 3 and 4)
    await flashcardPage.clickAcceptAll();

    // Verify all pending cards are now accepted
    await expect(flashcardPage.getCardBadge(3)).toContainText("Accepted");
    await expect(flashcardPage.getCardBadge(4)).toContainText("Accepted");

    // Verify bulk summary shows no pending cards
    bulkSummary = await flashcardPage.getBulkSummary();
    expect(bulkSummary.total).toBe(5);
    expect(bulkSummary.accepted).toBe(3); // cards 0, 3, 4
    expect(bulkSummary.edited).toBe(1); // card 2
    expect(bulkSummary.rejected).toBe(1); // card 1
    expect(bulkSummary.pending).toBe(0);

    // Verify Save Decisions button is enabled
    await expect(flashcardPage.saveDecisionsButton).toBeEnabled();

    // ===== ACT & ASSERT: Submission Phase =====

    // Click Save Decisions
    await flashcardPage.clickSaveDecisions();

    // Verify loading indicator appears with correct message
    await expect(flashcardPage.loadingIndicator).toBeVisible();
    await expect(flashcardPage.loadingMessage).toContainText("Saving flashcards...");

    // Wait for submission to complete
    await flashcardPage.waitForGeneration();

    // ===== ACT & ASSERT: Success Phase =====

    // Verify success modal appears
    await expect(flashcardPage.successModal).toBeVisible();
    await expect(flashcardPage.successTitle).toContainText("Flashcards Created!");

    // Verify success summary matches expected values
    const successSummary = await flashcardPage.getSuccessSummary();
    expect(successSummary.accepted).toBe(3);
    expect(successSummary.edited).toBe(1);
    expect(successSummary.rejected).toBe(1);

    // ===== VERIFY DATABASE STATE =====

    // Verify database now contains the flashcards
    const finalFlashcardCount = await getUserFlashcardCount(TEST_USER.id);
    expect(finalFlashcardCount).toBe(initialFlashcardCount + 4); // 3 accepted + 1 edited (rejected cards are not saved)

    // Verify action buttons are visible
    await expect(flashcardPage.viewFlashcardsButton).toBeVisible();
    await expect(flashcardPage.generateMoreButton).toBeVisible();

    // Click "View My Flashcards"
    await flashcardPage.clickViewFlashcards();

    // Verify navigation to flashcards page
    await expect(flashcardPage.page).toHaveURL("/flashcards");
  });

  test("should show character counter validation", async () => {
    // ===== ARRANGE =====
    await expect(flashcardPage.flashcardForm).toBeVisible();

    // ===== ACT & ASSERT: Too Short =====

    // Enter text that's too short (less than 1000 characters)
    const shortText = "This is too short.";
    await flashcardPage.fillInputText(shortText);

    // Verify generate button is disabled
    await expect(flashcardPage.generateButton).toBeDisabled();

    // Verify character counter shows count
    await expect(flashcardPage.characterCounter).toBeVisible();

    // ===== ACT & ASSERT: Valid Length =====

    // Enter valid text
    await flashcardPage.fillInputText(SAMPLE_TEXT);

    // Verify generate button is enabled
    await expect(flashcardPage.generateButton).toBeEnabled();
  });

  test("should allow canceling card edit", async () => {
    // ===== ARRANGE =====

    // Fill and generate
    await flashcardPage.fillInputText(SAMPLE_TEXT);
    await flashcardPage.clickGenerate();
    await flashcardPage.waitForGeneration();

    // Get original card text
    const originalFront = await flashcardPage.getCardFront(0).textContent();
    const originalBack = await flashcardPage.getCardBack(0).textContent();

    // ===== ACT =====

    // Open edit modal
    await flashcardPage.openEditCard(0);
    await expect(flashcardPage.editCardModal).toBeVisible();

    // Change text
    await flashcardPage.editFrontTextarea.clear();
    await flashcardPage.editFrontTextarea.fill("Changed front text");

    // Cancel without saving
    await flashcardPage.editCancelButton.click();

    // ===== ASSERT =====

    // Verify modal is closed
    await expect(flashcardPage.editCardModal).not.toBeVisible();

    // Verify card text unchanged
    await expect(flashcardPage.getCardFront(0)).toContainText(originalFront || "");
    await expect(flashcardPage.getCardBack(0)).toContainText(originalBack || "");

    // Verify badge still shows pending
    await expect(flashcardPage.getCardBadge(0)).toContainText("Pending");
  });

  test("should handle reject all action", async () => {
    // ===== ARRANGE =====

    // Fill and generate
    await flashcardPage.fillInputText(SAMPLE_TEXT);
    await flashcardPage.clickGenerate();
    await flashcardPage.waitForGeneration();

    // ===== ACT =====

    // Click Reject All
    await flashcardPage.clickRejectAll();

    // ===== ASSERT =====

    // Verify all cards are rejected
    for (let i = 0; i < 5; i++) {
      await expect(flashcardPage.getCardBadge(i)).toContainText("Rejected");
    }

    // Verify bulk summary
    const bulkSummary = await flashcardPage.getBulkSummary();
    expect(bulkSummary.rejected).toBe(5);
    expect(bulkSummary.pending).toBe(0);

    // Verify Save Decisions button is enabled
    await expect(flashcardPage.saveDecisionsButton).toBeEnabled();
  });
});
