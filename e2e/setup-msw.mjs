/**
 * MSW Setup for E2E Tests
 * 
 * This file starts the MSW server to intercept OpenRouter API calls.
 * It must be imported/executed in the same Node.js process as the Astro dev server.
 */

/* eslint-disable no-console, no-undef */

import { setupServer } from "msw/node";
import { http, HttpResponse, delay } from "msw";

// Define handlers inline to avoid module resolution issues
const handlers = [
  http.post("https://openrouter.ai/api/v1/chat/completions", async () => {
    // Simulate realistic API delay
    await delay(800);

    // Return mock flashcard generation response
    return HttpResponse.json({
      id: "gen-" + Date.now(),
      model: "openai/gpt-4o-mini",
      created: Math.floor(Date.now() / 1000),
      object: "chat.completion",
      choices: [
        {
          index: 0,
          message: {
            role: "assistant",
            content: JSON.stringify({
              flashcards: [
                {
                  question: "What is photosynthesis?",
                  answer:
                    "The process by which green plants use sunlight to synthesize foods with the help of chlorophyll pigments, converting water, CO2, and minerals into oxygen and energy-rich organic compounds.",
                },
                {
                  question: "What are the two main stages of photosynthesis?",
                  answer: "The light-dependent reactions and the light-independent reactions (Calvin cycle).",
                },
                {
                  question: "Where do light-dependent reactions take place?",
                  answer:
                    "In the thylakoid membranes of chloroplasts where chlorophyll captures light energy and converts it into ATP and NADPH.",
                },
                {
                  question: "What happens during the Calvin cycle?",
                  answer:
                    "Carbon dioxide is fixed into organic molecules through enzyme-mediated reactions in the stroma of the chloroplast.",
                },
                {
                  question: "What environmental factors affect the rate of photosynthesis?",
                  answer: "Light intensity, carbon dioxide concentration, temperature, and water availability.",
                },
              ],
            }),
          },
          finish_reason: "stop",
        },
      ],
      usage: {
        prompt_tokens: 150,
        completion_tokens: 200,
        total_tokens: 350,
      },
    });
  }),
];

// Create and start the MSW server
const server = setupServer(...handlers);

console.log("🔧 Starting MSW server for E2E tests...");
server.listen({
  onUnhandledRequest: "bypass",
});
console.log("✅ MSW server started - OpenRouter API calls will be mocked");

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("🛑 Stopping MSW server...");
  server.close();
});

process.on("SIGINT", () => {
  console.log("🛑 Stopping MSW server...");
  server.close();
});
