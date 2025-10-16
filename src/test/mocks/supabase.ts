import { vi } from "vitest";
import type { SupabaseClient } from "@/db/supabase.client";

// Mock Supabase client with proper typing
// We only mock the methods actually used in tests
// The cast is necessary because we're creating a test double, not a full implementation
export const createMockSupabaseClient = () => {
  return {
    auth: {
      signUp: vi.fn(),
      signInWithPassword: vi.fn(),
      signOut: vi.fn(),
      getSession: vi.fn(),
      getUser: vi.fn(),
      resetPasswordForEmail: vi.fn(),
      updateUser: vi.fn(),
      onAuthStateChange: vi.fn(),
    },
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
    })),
  } as unknown as SupabaseClient;
};

// Mock user data
export const mockUser = {
  id: "test-user-id",
  email: "test@example.com",
  created_at: new Date().toISOString(),
  app_metadata: {},
  user_metadata: {},
  aud: "authenticated",
  role: "authenticated",
};

// Mock session
export const mockSession = {
  access_token: "mock-access-token",
  refresh_token: "mock-refresh-token",
  expires_in: 3600,
  token_type: "bearer",
  user: mockUser,
};
