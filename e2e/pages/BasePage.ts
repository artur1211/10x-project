import { type Page } from "@playwright/test";

/**
 * Base Page Object Model class with common methods
 */
export class BasePage {
  constructor(protected page: Page) {}

  async goto(path: string) {
    await this.page.goto(path);
  }

  async waitForNavigation() {
    await this.page.waitForLoadState("networkidle");
  }

  async getTitle() {
    return await this.page.title();
  }

  async takeScreenshot(name: string) {
    await this.page.screenshot({ path: `test-results/${name}.png` });
  }
}
