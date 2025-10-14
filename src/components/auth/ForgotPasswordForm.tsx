import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import type { z } from "zod";
import { ForgotPasswordSchema } from "@/lib/auth.schemas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AuthErrorDisplay } from "./AuthErrorDisplay";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

type ForgotPasswordFormInput = z.infer<typeof ForgotPasswordSchema>;

/**
 * Forgot password form component for initiating password reset
 */
export function ForgotPasswordForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);

  const form = useForm<ForgotPasswordFormInput>({
    resolver: zodResolver(ForgotPasswordSchema),
    mode: "onBlur",
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = async (data: ForgotPasswordFormInput) => {
    setGlobalError(null);
    setIsSubmitting(true);

    try {
      // TODO: Implement Supabase password reset
      // const supabase = createClient();
      // const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
      //   redirectTo: `${import.meta.env.PUBLIC_APP_URL}/reset-password`,
      // });
      //
      // if (error) {
      //   setGlobalError("Password reset service is temporarily unavailable. Please try again.");
      //   return;
      // }

      // Placeholder success behavior
      // eslint-disable-next-line no-console
      console.log("Password reset requested for:", data.email);
      setEmailSent(true);
    } catch (error) {
      setGlobalError("Password reset service is temporarily unavailable. Please try again.");
      // eslint-disable-next-line no-console
      console.error("Password reset error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (emailSent) {
    return (
      <div className="space-y-4 rounded-lg border border-blue-200 bg-blue-50 p-6 dark:border-blue-800 dark:bg-blue-950">
        <h2 className="text-xl font-semibold text-blue-800 dark:text-blue-200">Check Your Email</h2>
        <p className="text-sm text-blue-700 dark:text-blue-300">
          If an account exists with this email, you will receive a password reset link shortly. Please check your inbox
          and spam folder.
        </p>
        <p className="text-sm text-blue-700 dark:text-blue-300">The reset link will expire in 24 hours.</p>
        <a
          href="/login"
          className="inline-block text-sm font-medium text-blue-700 underline hover:text-blue-900 dark:text-blue-300 dark:hover:text-blue-100"
        >
          Back to login
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
            Enter your email address and we&apos;ll send you a link to reset your password.
          </p>
        </div>

        {/* Email Field */}
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-base font-semibold">Email</FormLabel>
              <FormControl>
                <Input type="email" placeholder="your.email@example.com" disabled={isSubmitting} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Submit Button */}
        <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
          {isSubmitting ? "Sending..." : "Send Reset Link"}
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
