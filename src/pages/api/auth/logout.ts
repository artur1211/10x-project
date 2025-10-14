import type { APIRoute } from "astro";

export const prerender = false;

/**
 * POST /api/auth/logout
 *
 * Server-side logout endpoint that signs out the user and clears session cookies.
 * Uses Supabase auth.signOut() which automatically handles cookie cleanup.
 *
 * @param context - Astro API context containing locals with supabase client
 * @returns Redirect response to homepage
 */
export const POST: APIRoute = async ({ locals, redirect }) => {
  const { supabase } = locals;

  try {
    // Sign out from Supabase (automatically clears session cookies)
    const { error } = await supabase.auth.signOut();

    if (error) {
      // eslint-disable-next-line no-console
      console.error("Logout error:", error);
      // Even if sign out fails, redirect to home (best effort)
    }

    // Redirect to homepage after successful logout
    return redirect("/", 302);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Unexpected logout error:", error);
    // Best effort - always redirect even on error
    return redirect("/", 302);
  }
};
