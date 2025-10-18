import { cleanupUserTestData } from "./helpers/database";

/**
 * Global teardown function for Playwright
 * Runs once after all tests have completed
 *
 * This ensures all test data is cleaned up from the database.
 * Note: MSW server will stop automatically when the dev server stops.
 */
async function globalTeardown() {
  console.log("\n🧹 Running global teardown...");

  const testUserId = process.env.E2E_USERNAME_ID;

  if (!testUserId) {
    console.warn("⚠️  E2E_USERNAME_ID not found in environment, skipping database cleanup");
  } else {
    try {
      await cleanupUserTestData(testUserId);
      console.log("✅ Database cleanup completed successfully");
    } catch (error) {
      console.error("❌ Failed to cleanup test data:", error);
      // Don't throw error - we don't want teardown failures to fail the build
      // The next test run will clean up old data anyway
    }
  }
}

export default globalTeardown;
