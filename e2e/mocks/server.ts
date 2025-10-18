import { setupServer } from "msw/node";
import { handlers } from "./handlers";

/**
 * MSW Server for Node.js Environment
 *
 * This server intercepts server-side fetch calls during E2E tests.
 * It runs in the Node.js process that serves the Astro application.
 */
export const server = setupServer(...handlers);
