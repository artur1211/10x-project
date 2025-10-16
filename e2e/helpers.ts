import { type Page } from "@playwright/test";

/**
 * E2E Test Helper Functions
 */

/**
 * Wait for network to be idle
 */
export async function waitForNetworkIdle(page: Page) {
  await page.waitForLoadState("networkidle");
}

/**
 * Wait for element to be visible and return it
 */
export async function waitForElement(page: Page, selector: string) {
  await page.waitForSelector(selector, { state: "visible" });
  return page.locator(selector);
}

/**
 * Fill form and submit
 */
export async function fillAndSubmitForm(page: Page, formData: Record<string, string>, submitButtonText = "Submit") {
  for (const [label, value] of Object.entries(formData)) {
    await page.getByLabel(label).fill(value);
  }
  await page.getByRole("button", { name: new RegExp(submitButtonText, "i") }).click();
}

/**
 * Login helper for tests that require authentication
 */
export async function loginAsTestUser(page: Page, email = "test@example.com", password = "testpassword123") {
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: /log in/i }).click();
  await page.waitForURL("/");
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated(page: Page): Promise<boolean> {
  const url = page.url();
  return !url.includes("/login") && !url.includes("/register");
}

/**
 * Take screenshot with timestamp
 */
export async function takeScreenshot(page: Page, name: string) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  await page.screenshot({ path: `test-results/${name}-${timestamp}.png` });
}

/**
 * Wait for API response
 */
export async function waitForApiResponse(page: Page, urlPattern: string | RegExp, timeout = 5000) {
  return await page.waitForResponse(
    (response) => {
      const url = response.url();
      return typeof urlPattern === "string" ? url.includes(urlPattern) : urlPattern.test(url);
    },
    { timeout }
  );
}

/**
 * Mock API response
 */
export async function mockApiResponse(page: Page, url: string | RegExp, response: unknown, status = 200) {
  await page.route(url, (route) => {
    route.fulfill({
      status,
      contentType: "application/json",
      body: JSON.stringify(response),
    });
  });
}

/**
 * Get all text content from elements
 */
export async function getAllTextContent(page: Page, selector: string): Promise<string[]> {
  const elements = await page.locator(selector).all();
  return Promise.all(elements.map((el) => el.textContent().then((text) => text || "")));
}

/**
 * Wait for element to disappear
 */
export async function waitForElementToDisappear(page: Page, selector: string) {
  await page.waitForSelector(selector, { state: "hidden" });
}

/**
 * Check if element exists
 */
export async function elementExists(page: Page, selector: string): Promise<boolean> {
  return (await page.locator(selector).count()) > 0;
}

/**
 * Scroll element into view
 */
export async function scrollIntoView(page: Page, selector: string) {
  await page.locator(selector).scrollIntoViewIfNeeded();
}
