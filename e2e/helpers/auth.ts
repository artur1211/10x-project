import type { Page } from "@playwright/test";
import { expect } from "@playwright/test";

/**
 * Test user credentials for E2E tests
 * Make sure these credentials exist in your test database
 * Uses E2E_USERNAME, E2E_PASSWORD, and E2E_USERNAME_ID from .env.test
 */
export const TEST_USER = {
  id: process.env.E2E_USERNAME_ID || "test-user-id",
  email: process.env.E2E_USERNAME || "test@example.com",
  password: process.env.E2E_PASSWORD || "Test123!@#",
};

/**
 * Login helper for E2E tests
 * Logs in via the UI and waits for successful navigation
 */
export async function login(page: Page, email: string = TEST_USER.email, password: string = TEST_USER.password) {
  // Navigate to login page
  await page.goto("/login");

  // Wait for the form to be visible and fully loaded
  await page.waitForSelector("form", { state: "visible" });

  // Wait for the page to be fully loaded and interactive
  await page.waitForLoadState("networkidle");

  // Fill in login form using more specific selectors
  const emailInput = page.getByPlaceholder(/your.email@example.com/i);
  const passwordInput = page.getByPlaceholder(/enter your password/i);

  // Clear and fill email with better reliability
  await emailInput.click();
  await emailInput.clear();
  await emailInput.fill(email);

  // Verify the email was actually filled
  await expect(emailInput).toHaveValue(email);

  // Clear and fill password
  await passwordInput.click();
  await passwordInput.clear();
  await passwordInput.fill(password);

  // Verify the password was actually filled
  await expect(passwordInput).toHaveValue(password);

  // Submit form - look for the specific button text
  const loginButton = page.getByRole("button", { name: /log in/i });

  // Wait for any client-side validation to complete
  await page.waitForTimeout(100);

  // Click and wait for navigation
  await Promise.all([page.waitForURL(/\/(generate|flashcards)/, { timeout: 15000 }), loginButton.click()]);
}

/**
 * Login via API (faster for tests that don't need to test login flow)
 * Sets authentication cookies directly
 */
export async function loginViaAPI(page: Page, email: string = TEST_USER.email, password: string = TEST_USER.password) {
  const response = await page.request.post("/api/auth/login", {
    data: {
      email,
      password,
    },
  });

  if (!response.ok()) {
    throw new Error(`Login failed: ${response.status()} ${await response.text()}`);
  }

  // Cookies should be automatically set by the API response
  return response;
}

/**
 * Logout helper for E2E tests
 */
export async function logout(page: Page) {
  await page.request.post("/api/auth/logout");
  await page.goto("/login");
}
