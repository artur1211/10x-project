import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/db/database.types";

/**
 * Creates an authenticated Supabase client for E2E test database operations
 * Uses the test user's credentials instead of service role key
 */
async function createAuthenticatedTestClient() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseAnonKey = process.env.SUPABASE_KEY;
  const testEmail = process.env.E2E_USERNAME;
  const testPassword = process.env.E2E_PASSWORD;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Missing Supabase configuration. Ensure SUPABASE_URL and SUPABASE_KEY are set in .env.test");
  }

  if (!testEmail || !testPassword) {
    throw new Error("Missing test user credentials. Ensure E2E_USERNAME and E2E_PASSWORD are set in .env.test");
  }

  const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  // Sign in as the test user
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: testEmail,
    password: testPassword,
  });

  if (signInError) {
    throw new Error(`Failed to authenticate test user: ${signInError.message}`);
  }

  return supabase;
}

/**
 * Deletes all flashcards created during a test for a specific user
 */
export async function cleanupUserFlashcards(userId: string): Promise<void> {
  const supabase = await createAuthenticatedTestClient();

  const { error } = await supabase.from("flashcards").delete().eq("user_id", userId);

  if (error) {
    console.error("Failed to cleanup flashcards:", error);
    throw new Error(`Failed to cleanup flashcards: ${error.message}`);
  }
}

/**
 * Deletes all AI generation batches created during a test for a specific user
 */
export async function cleanupUserBatches(userId: string): Promise<void> {
  const supabase = await createAuthenticatedTestClient();

  const { error } = await supabase.from("ai_generation_batches").delete().eq("user_id", userId);

  if (error) {
    console.error("Failed to cleanup batches:", error);
    throw new Error(`Failed to cleanup batches: ${error.message}`);
  }
}

/**
 * Cleans up all test data for a specific user
 * Deletes flashcards first (due to foreign key constraints), then batches
 */
export async function cleanupUserTestData(userId: string): Promise<void> {
  // Delete flashcards first (they reference batches via foreign key)
  await cleanupUserFlashcards(userId);

  // Then delete batches
  await cleanupUserBatches(userId);
}

/**
 * Gets the count of flashcards for a user
 */
export async function getUserFlashcardCount(userId: string): Promise<number> {
  const supabase = await createAuthenticatedTestClient();

  const { count, error } = await supabase
    .from("flashcards")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId);

  if (error) {
    throw new Error(`Failed to count flashcards: ${error.message}`);
  }

  return count ?? 0;
}

/**
 * Gets the count of AI generation batches for a user
 */
export async function getUserBatchCount(userId: string): Promise<number> {
  const supabase = await createAuthenticatedTestClient();

  const { count, error } = await supabase
    .from("ai_generation_batches")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId);

  if (error) {
    throw new Error(`Failed to count batches: ${error.message}`);
  }

  return count ?? 0;
}

/**
 * Fetches all flashcards for a user
 */
export async function getUserFlashcards(userId: string) {
  const supabase = await createAuthenticatedTestClient();

  const { data, error } = await supabase.from("flashcards").select("*").eq("user_id", userId).order("created_at");

  if (error) {
    throw new Error(`Failed to fetch flashcards: ${error.message}`);
  }

  return data ?? [];
}

/**
 * Fetches all AI generation batches for a user
 */
export async function getUserBatches(userId: string) {
  const supabase = await createAuthenticatedTestClient();

  const { data, error } = await supabase
    .from("ai_generation_batches")
    .select("*")
    .eq("user_id", userId)
    .order("generated_at");

  if (error) {
    throw new Error(`Failed to fetch batches: ${error.message}`);
  }

  return data ?? [];
}
