import { expect } from "vitest";

/**
 * Custom matchers and assertions for common test scenarios
 */

/**
 * Check if a value is a valid UUID
 */
export function expectValidUuid(value: string) {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  expect(value).toMatch(uuidRegex);
}

/**
 * Check if a value is a valid ISO date string
 */
export function expectValidIsoDate(value: string) {
  const date = new Date(value);
  expect(date.toISOString()).toBe(value);
  expect(date.getTime()).not.toBeNaN();
}

/**
 * Check if an error has expected properties
 */
export function expectError(error: unknown, expectedMessage?: string) {
  expect(error).toBeInstanceOf(Error);
  if (expectedMessage) {
    expect((error as Error).message).toContain(expectedMessage);
  }
}

/**
 * Wait for a condition with timeout
 */
export async function waitFor(
  condition: () => boolean | Promise<boolean>,
  timeout = 5000,
  interval = 50
): Promise<void> {
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    if (await condition()) {
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, interval));
  }

  throw new Error(`Condition not met within ${timeout}ms`);
}
