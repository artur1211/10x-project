import { cleanupUserTestData } from "./helpers/database";

/**
 * Global setup function for Playwright
 * Runs once before all tests begin
 *
 * This ensures we start with a clean database state.
 * Note: MSW server is started via NODE_OPTIONS in playwright.config.ts
 */
async function globalSetup() {
  console.log("\n🚀 Running global setup...");

  const testUserId = process.env.E2E_USERNAME_ID;

  if (!testUserId) {
    console.warn("⚠️  E2E_USERNAME_ID not found in environment");
    throw new Error("E2E_USERNAME_ID must be set in .env.test file. See README.md for setup instructions.");
  }

  try {
    // Clean up any leftover data from previous test runs
    await cleanupUserTestData(testUserId);
    console.log("✅ Database cleanup completed - starting with clean state");
  } catch (error) {
    console.error("❌ Failed to cleanup test data:", error);
    throw error; // Fail setup if we can't clean the database
  }
}

export default globalSetup;
