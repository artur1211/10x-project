import { http, HttpResponse } from "msw";

// Define your API mocks here
export const handlers = [
  // Example: Mock authentication endpoints
  http.post("/api/auth/login", () => {
    return HttpResponse.json({
      success: true,
      message: "Login successful",
    });
  }),

  http.post("/api/auth/register", () => {
    return HttpResponse.json({
      success: true,
      message: "Registration successful",
    });
  }),

  // Example: Mock flashcard generation
  http.post("/api/flashcards/batch", () => {
    return HttpResponse.json({
      batchId: "test-batch-id",
      cards: [],
    });
  }),

  // Add more handlers as needed
];
