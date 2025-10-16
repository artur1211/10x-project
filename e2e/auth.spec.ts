import { test, expect } from "./fixtures/pages";

test.describe("Login Page", () => {
  test.beforeEach(async ({ loginPage }) => {
    await loginPage.goto();
  });

  test("should display login form", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "Log in" })).toBeVisible();
  });

  test("should show error for invalid credentials", async ({ loginPage }) => {
    await loginPage.login("invalid@example.com", "wrongpassword");

    // Wait for error message
    const errorMessage = await loginPage.getErrorMessage();
    expect(errorMessage).toBeTruthy();
  });

  test("should navigate to home page after successful login", async ({ loginPage, page }) => {
    // This is a placeholder - adjust with real test credentials or use fixtures
    await loginPage.login("test@example.com", "testpassword");

    // Wait for navigation
    await page.waitForURL("/");
    await expect(page).toHaveURL("/");
  });
});
