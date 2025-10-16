import { test as base } from "@playwright/test";
import { LoginPage } from "../pages/LoginPage";
import { GeneratePage } from "../pages/GeneratePage";

/**
 * Extended test fixture with Page Object Models
 */
interface Fixtures {
  loginPage: LoginPage;
  generatePage: GeneratePage;
}

export const test = base.extend<Fixtures>({
  loginPage: async ({ page }, use) => {
    const loginPage = new LoginPage(page);
    await use(loginPage);
  },
  generatePage: async ({ page }, use) => {
    const generatePage = new GeneratePage(page);
    await use(generatePage);
  },
});

export { expect } from "@playwright/test";
