import type { APIRoute } from "astro";

export const prerender = false;

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const { password } = await request.json();

    // Validate input
    if (!password) {
      return new Response(
        JSON.stringify({
          error: "Password is required",
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

    // Update the user's password
    // Supabase automatically validates the reset token from the session
    const { data, error } = await supabase.auth.updateUser({
      password: password,
    });

    if (error) {
      // Check for specific error types
      if (error.message.includes("expired") || error.message.includes("invalid")) {
        return new Response(
          JSON.stringify({
            error: "Your password reset link has expired or is invalid. Please request a new one.",
          }),
          {
            status: 400,
            headers: {
              "Content-Type": "application/json",
            },
          }
        );
      }

      return new Response(
        JSON.stringify({
          error: error.message,
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Return success
    return new Response(
      JSON.stringify({
        user: data.user,
        message: "Password updated successfully",
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
    console.error("Reset password error:", error);

    return new Response(
      JSON.stringify({
        error: "An unexpected error occurred during password reset",
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
