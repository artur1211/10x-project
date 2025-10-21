import { test, expect } from "@playwright/test";
import { FlashcardLibraryPage } from "./page-objects/FlashcardLibraryPage";
import { login, TEST_USER } from "./helpers/auth";
import { cleanupUserFlashcards } from "./helpers/database";

test.describe("Flashcard Library - Manual Management", () => {
  let libraryPage: FlashcardLibraryPage;

  test.beforeEach(async ({ page }) => {
    libraryPage = new FlashcardLibraryPage(page);

    // Clean up any existing flashcards before each test
    await cleanupUserFlashcards(TEST_USER.id);

    // Login before each test via UI
    await login(page);

    // Navigate to the flashcards library page
    await libraryPage.goto();
  });

  test.afterEach(async () => {
    // Clean up test data after each test
    await cleanupUserFlashcards(TEST_USER.id);
  });

  test("should complete full flashcard manual management workflow", async () => {
    // ===== ARRANGE =====
    // Verify we're on the library page
    await expect(libraryPage.pageTitle).toBeVisible();
    await expect(libraryPage.pageTitle).toContainText("Flashcards Library");

    // Verify capacity indicator is visible
    await expect(libraryPage.capacityIndicator).toBeVisible();

    // ===== ACT & ASSERT: Create Flashcard =====

    // Verify create button is visible and enabled
    await expect(libraryPage.createButton).toBeVisible();
    await expect(libraryPage.createButton).toBeEnabled();

    // Click create flashcard button
    await libraryPage.clickCreateFlashcard();

    // Verify create dialog appears
    await expect(libraryPage.createDialog).toBeVisible();
    await expect(libraryPage.dialogTitle).toContainText("Create New Flashcard");

    // Verify form inputs are visible
    await expect(libraryPage.frontTextInput).toBeVisible();
    await expect(libraryPage.backTextInput).toBeVisible();

    // Verify character counters are visible
    await expect(libraryPage.frontTextCounter).toBeVisible();
    await expect(libraryPage.backTextCounter).toBeVisible();

    // Verify save button is initially disabled (empty form)
    await expect(libraryPage.dialogSaveButton).toBeDisabled();

    // Fill in the flashcard form with valid data (unique identifier to avoid test collisions)
    const testId = Date.now();
    const originalFrontText = `What is the capital of France? [Test ${testId}]`;
    const originalBackText =
      "Paris is the capital and largest city of France, located in the north-central part of the country.";

    await libraryPage.fillFlashcardForm(originalFrontText, originalBackText);

    // Verify character counters update (with dynamic test ID, counts will vary)
    await expect(libraryPage.frontTextCounter).toContainText("/ 500");
    await expect(libraryPage.backTextCounter).toContainText("/ 1000");

    // Verify save button is now enabled
    await expect(libraryPage.dialogSaveButton).toBeEnabled();

    // Submit the form
    await libraryPage.submitFlashcardForm();

    // Wait for the dialog to close
    await expect(libraryPage.createDialog).not.toBeVisible();

    // Wait for success toast
    await libraryPage.waitForToast("Flashcard created successfully!");

    // Wait for list to update
    await libraryPage.waitForListUpdate();

    // Verify flashcard appears in the list (UI validation only)
    const flashcardExists = await libraryPage.flashcardExists(originalFrontText);
    expect(flashcardExists).toBe(true);

    // ===== ACT & ASSERT: Edit Flashcard =====

    // Verify the flashcard is visible with correct content
    const flashcardElement = libraryPage.getFlashcardByText(originalFrontText);
    await expect(flashcardElement).toBeVisible();
    await expect(flashcardElement).toContainText(originalFrontText);

    // Click edit button for the flashcard
    await libraryPage.clickEditFlashcard(originalFrontText);

    // Verify edit dialog appears
    await expect(libraryPage.editDialog).toBeVisible();
    await expect(libraryPage.dialogTitle).toContainText("Edit Flashcard");

    // Verify form is pre-populated with existing data
    await expect(libraryPage.frontTextInput).toHaveValue(originalFrontText);
    await expect(libraryPage.backTextInput).toHaveValue(originalBackText);

    // Verify save button is enabled (valid existing data)
    await expect(libraryPage.dialogSaveButton).toBeEnabled();

    // Update the flashcard content (keep same test ID for uniqueness)
    const updatedFrontText = `What is the capital and largest city of France? [Test ${testId}]`;
    const updatedBackText =
      "Paris is the capital and largest city of France, located in the north-central part of the country. It has a population of over 2 million people.";

    await libraryPage.fillFlashcardForm(updatedFrontText, updatedBackText);

    // Verify character counters update correctly (with dynamic test ID, counts will vary)
    await expect(libraryPage.frontTextCounter).toContainText("/ 500");
    await expect(libraryPage.backTextCounter).toContainText("/ 1000");

    // Submit the edit
    await libraryPage.submitFlashcardForm();

    // Wait for the dialog to close
    await expect(libraryPage.editDialog).not.toBeVisible();

    // Wait for success toast
    await libraryPage.waitForToast("Flashcard updated successfully!");

    // Wait for list to update
    await libraryPage.waitForListUpdate();

    // Verify old content is gone from UI
    const oldFlashcardExists = await libraryPage.flashcardExists(originalFrontText);
    expect(oldFlashcardExists).toBe(false);

    // Verify new content appears in UI
    const updatedFlashcardExists = await libraryPage.flashcardExists(updatedFrontText);
    expect(updatedFlashcardExists).toBe(true);

    // ===== ACT & ASSERT: Delete Flashcard =====

    // Click delete button for the flashcard
    await libraryPage.clickDeleteFlashcard(updatedFrontText);

    // Verify delete confirmation dialog appears
    await expect(libraryPage.deleteDialog).toBeVisible();
    await expect(libraryPage.dialogTitle).toContainText("Delete Flashcard");

    // Verify confirmation message mentions undo is not possible
    await expect(libraryPage.deleteDialog).toContainText("This action cannot be undone");

    // Verify confirm and cancel buttons are visible
    await expect(libraryPage.dialogConfirmButton).toBeVisible();
    await expect(libraryPage.dialogCancelButton).toBeVisible();

    // Confirm deletion
    await libraryPage.confirmDeletion();

    // Wait for the dialog to close
    await expect(libraryPage.deleteDialog).not.toBeVisible();

    // Wait for success toast
    await libraryPage.waitForToast("Flashcard deleted");

    // Wait for list to update
    await libraryPage.waitForListUpdate();

    // Verify flashcard is removed from the list (UI validation only)
    const deletedFlashcardExists = await libraryPage.flashcardExists(updatedFrontText);
    expect(deletedFlashcardExists).toBe(false);
  });

  test("should handle form validation correctly", async () => {
    // ===== ARRANGE =====
    await expect(libraryPage.createButton).toBeVisible();

    // ===== ACT & ASSERT: Test minimum character validation =====

    // Open create dialog
    await libraryPage.clickCreateFlashcard();
    await expect(libraryPage.createDialog).toBeVisible();

    // Try to enter text that's too short (less than 10 characters)
    await libraryPage.fillFlashcardForm("Short", "Too short");

    // Verify save button is disabled
    await expect(libraryPage.dialogSaveButton).toBeDisabled();

    // Verify error messages appear
    await expect(libraryPage.createDialog).toContainText(/at least 10 characters/i);

    // Fill with valid minimum length (10 characters)
    await libraryPage.fillFlashcardForm("Ten chars!", "Ten chars!");

    // Verify save button is now enabled
    await expect(libraryPage.dialogSaveButton).toBeEnabled();

    // Cancel the dialog
    await libraryPage.cancelFlashcardForm();
    await expect(libraryPage.createDialog).not.toBeVisible();
  });

  test("should handle canceling operations correctly", async () => {
    // ===== ARRANGE =====
    // Create a flashcard first with unique identifier
    const testId = Date.now();
    const originalFrontText = `Test flashcard for cancel operations [Test ${testId}]`;
    await libraryPage.clickCreateFlashcard();
    await libraryPage.fillFlashcardForm(originalFrontText, "This flashcard will be used to test cancel functionality");
    await libraryPage.submitFlashcardForm();
    await libraryPage.waitForListUpdate();

    // ===== ACT & ASSERT: Cancel edit operation =====

    // Open edit dialog
    await libraryPage.clickEditFlashcard(originalFrontText);
    await expect(libraryPage.editDialog).toBeVisible();

    // Modify the content
    const modifiedFrontText = `Modified content [Test ${testId}]`;
    await libraryPage.fillFlashcardForm(modifiedFrontText, "Modified back text that should not be saved");

    // Cancel the edit
    await libraryPage.cancelFlashcardForm();
    await expect(libraryPage.editDialog).not.toBeVisible();

    // Verify original content is still present in UI
    const originalExists = await libraryPage.flashcardExists(originalFrontText);
    expect(originalExists).toBe(true);

    // Verify modified content was not saved
    const modifiedExists = await libraryPage.flashcardExists(modifiedFrontText);
    expect(modifiedExists).toBe(false);

    // ===== ACT & ASSERT: Cancel delete operation =====

    // Open delete dialog
    await libraryPage.clickDeleteFlashcard(originalFrontText);
    await expect(libraryPage.deleteDialog).toBeVisible();

    // Cancel the delete
    await libraryPage.cancelDeletion();
    await expect(libraryPage.deleteDialog).not.toBeVisible();

    // Verify flashcard still exists in UI
    const flashcardStillExists = await libraryPage.flashcardExists(originalFrontText);
    expect(flashcardStillExists).toBe(true);
  });

  test("should handle capacity indicator correctly", async () => {
    // ===== ARRANGE & ACT =====
    // Create a flashcard with unique identifier
    const uniqueFrontText = `Capacity test flashcard ${Date.now()}`;
    await libraryPage.clickCreateFlashcard();
    await libraryPage.fillFlashcardForm(uniqueFrontText, "Testing capacity indicator updates");
    await libraryPage.submitFlashcardForm();

    // Wait for the dialog to close
    await expect(libraryPage.createDialog).not.toBeVisible();

    // Wait for success toast
    await libraryPage.waitForToast("Flashcard created successfully!");

    // Wait for list to update
    await libraryPage.waitForListUpdate();

    // ===== ASSERT =====
    // Verify the flashcard appears in UI
    const flashcardExists = await libraryPage.flashcardExists(uniqueFrontText);
    expect(flashcardExists).toBe(true);

    // Verify capacity indicator is visible and shows a count
    await expect(libraryPage.capacityIndicator).toBeVisible();
    await expect(libraryPage.capacityIndicator).toContainText("/ 500");

    // Create button should still be enabled (not at capacity)
    await expect(libraryPage.createButton).toBeEnabled();
  });
});
