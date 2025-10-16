import "@testing-library/jest-dom";
import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock environment variables
vi.stubGlobal("import.meta.env", {
  PUBLIC_SUPABASE_URL: "http://localhost:54321",
  PUBLIC_SUPABASE_ANON_KEY: "test-anon-key",
  OPENROUTER_API_KEY: "test-api-key",
  MODE: "test",
  DEV: false,
  PROD: false,
  SSR: true,
});

// Mock window.matchMedia
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});
