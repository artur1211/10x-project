import type { APIRoute } from "astro";

export const prerender = false;

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const { email } = await request.json();

    // Validate input
    if (!email) {
      return new Response(
        JSON.stringify({
          error: "Email is required",
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    const supabase = locals.supabase;

    // Request password reset email from Supabase
    // The redirectTo URL is where users will be sent when they click the reset link
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${new URL(request.url).origin}/reset-password`,
    });

    if (error) {
      // Don't expose whether the email exists or not for security reasons
      // Log the error server-side but return generic message to client
      // eslint-disable-next-line no-console
      console.error("Password reset error:", error);
    }

    // Always return success to prevent email enumeration attacks
    // Even if the email doesn't exist, we pretend the email was sent
    return new Response(
      JSON.stringify({
        message: "If an account exists with this email, you will receive a password reset link.",
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Forgot password error:", error);

    return new Response(
      JSON.stringify({
        error: "An unexpected error occurred. Please try again.",
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }
};
