import { defineMiddleware } from "astro:middleware";

import { createSupabaseServerInstance } from "../db/supabase.client.ts";

// Public paths that don't require authentication
// All other paths are protected by default
const PUBLIC_PATHS = [
  // Public pages
  "/",
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  // Auth API endpoints
  "/api/auth/login",
  "/api/auth/logout",
  "/api/auth/register",
  "/api/auth/reset-password",
];

/**
 * Authentication middleware
 * - Creates Supabase server instance with cookie handling
 * - Validates user session on every request
 * - Redirects unauthenticated users from protected routes to login
 * - Uses whitelist approach: only PUBLIC_PATHS are accessible without auth
 * - Attaches user and supabase instance to locals for use in pages/API routes
 */
export const onRequest = defineMiddleware(async ({ locals, cookies, url, request, redirect }, next) => {
  // Create Supabase server instance with cookie handling
  const supabase = createSupabaseServerInstance({
    cookies,
    headers: request.headers,
  });

  // Attach supabase instance to locals
  locals.supabase = supabase;

  // IMPORTANT: Always get user session first before any other operations
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    locals.user = {
      email: user.email ?? "",
      id: user.id,
    };
  } else {
    locals.user = null;
  }

  // Check if current path is in the public paths list
  const isPublicPath = PUBLIC_PATHS.some((path) => {
    // Exact match for specific paths
    if (url.pathname === path) {
      return true;
    }
    // For API paths, allow all sub-paths (e.g., /api/auth/*)
    if (path.startsWith("/api/") && url.pathname.startsWith(path)) {
      return true;
    }
    return false;
  });

  // Redirect to login if user is not authenticated and trying to access protected route
  // All routes are protected by default unless explicitly listed in PUBLIC_PATHS
  if (!isPublicPath && !user) {
    // Store intended destination for redirect after login
    const redirectUrl = encodeURIComponent(url.pathname + url.search);
    return redirect(`/login?redirect=${redirectUrl}`);
  }

  return next();
});
