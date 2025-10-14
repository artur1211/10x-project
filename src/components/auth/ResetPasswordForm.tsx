import { useState, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import type { z } from "zod";
import { ResetPasswordSchema } from "@/lib/auth.schemas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AuthErrorDisplay } from "./AuthErrorDisplay";
import { PasswordStrengthIndicator } from "./PasswordStrengthIndicator";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

type ResetPasswordFormInput = z.infer<typeof ResetPasswordSchema>;

/**
 * Reset password form component for completing password reset
 * Note: The reset token is automatically handled by Supabase through the session
 */
export function ResetPasswordForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [passwordReset, setPasswordReset] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(3);

  const form = useForm<ResetPasswordFormInput>({
    resolver: zodResolver(ResetPasswordSchema),
    mode: "onBlur",
    defaultValues: {
      newPassword: "",
      confirmPassword: "",
    },
  });

  const newPassword = form.watch("newPassword");

  // Auto-redirect countdown after successful reset
  useEffect(() => {
    if (passwordReset && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (passwordReset && countdown === 0) {
      window.location.href = "/login";
    }
  }, [passwordReset, countdown]);

  const onSubmit = async (data: ResetPasswordFormInput) => {
    setGlobalError(null);
    setIsSubmitting(true);

    try {
      // Call reset password API endpoint
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          password: data.newPassword,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        // Map Supabase error to user-friendly message
        const errorMessage = mapAuthError(result.error);
        setGlobalError(errorMessage);
        return;
      }

      // Password reset successful
      setPasswordReset(true);
    } catch (error) {
      setGlobalError("Password reset service is temporarily unavailable. Please try again.");
      // eslint-disable-next-line no-console
      console.error("Password reset error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Map Supabase auth errors to user-friendly messages
  const mapAuthError = (error: string): string => {
    if (error.includes("expired") || error.includes("invalid")) {
      return "Your password reset link has expired or is invalid. Please request a new one.";
    }
    if (error.includes("Password should be at least")) {
      return "Password must be at least 6 characters long";
    }
    return "Password reset service is temporarily unavailable. Please try again.";
  };

  if (passwordReset) {
    return (
      <div className="space-y-4 rounded-lg border border-green-200 bg-green-50 p-6 dark:border-green-800 dark:bg-green-950">
        <h2 className="text-xl font-semibold text-green-800 dark:text-green-200">Password Reset Successful!</h2>
        <p className="text-sm text-green-700 dark:text-green-300">
          Your password has been successfully updated. You can now log in with your new password.
        </p>
        <p className="text-sm text-green-700 dark:text-green-300">
          Redirecting to login page in {countdown} seconds...
        </p>
        <a
          href="/login"
          className="inline-block text-sm font-medium text-green-700 underline hover:text-green-900 dark:text-green-300 dark:hover:text-green-100"
        >
          Go to login page now
        </a>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {globalError && <AuthErrorDisplay error={globalError} />}

        <div className="space-y-2">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Enter your new password below. Make sure it&apos;s strong and secure.
          </p>
        </div>

        {/* New Password Field */}
        <FormField
          control={form.control}
          name="newPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-base font-semibold">New Password</FormLabel>
              <FormControl>
                <Input type="password" placeholder="Create a strong password" disabled={isSubmitting} {...field} />
              </FormControl>
              <FormMessage />
              <PasswordStrengthIndicator password={newPassword} />
            </FormItem>
          )}
        />

        {/* Confirm New Password Field */}
        <FormField
          control={form.control}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-base font-semibold">Confirm New Password</FormLabel>
              <FormControl>
                <Input type="password" placeholder="Confirm your new password" disabled={isSubmitting} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Submit Button */}
        <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
          {isSubmitting ? "Resetting Password..." : "Reset Password"}
        </Button>

        {/* Link to Login */}
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Remember your password?{" "}
          <a
            href="/login"
            className="font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
          >
            Log in
          </a>
        </p>
      </form>
    </Form>
  );
}
