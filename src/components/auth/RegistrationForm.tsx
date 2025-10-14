import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import type { z } from "zod";
import { RegistrationSchema } from "@/lib/auth.schemas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { AuthErrorDisplay } from "./AuthErrorDisplay";
import { PasswordStrengthIndicator } from "./PasswordStrengthIndicator";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

type RegistrationFormInput = z.infer<typeof RegistrationSchema>;

/**
 * Registration form component with validation and real-time feedback
 */
export function RegistrationForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);

  const form = useForm<RegistrationFormInput>({
    resolver: zodResolver(RegistrationSchema),
    mode: "onBlur",
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
      acceptTerms: false,
    },
  });

  const password = form.watch("password");

  const onSubmit = async (data: RegistrationFormInput) => {
    setGlobalError(null);
    setIsSubmitting(true);

    try {
      // Call Supabase Auth API to register
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: data.email,
          password: data.password,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        // Map Supabase error to user-friendly message
        const errorMessage = mapAuthError(result.error);
        setGlobalError(errorMessage);
        return;
      }

      // Registration successful - show verification message
      setIsRegistered(true);
    } catch (error) {
      setGlobalError("Registration service is temporarily unavailable. Please try again later.");
      // eslint-disable-next-line no-console
      console.error("Registration error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Map Supabase auth errors to user-friendly messages
  const mapAuthError = (error: string): string => {
    if (error.includes("User already registered")) {
      return "An account with this email already exists";
    }
    if (error.includes("Password should be at least")) {
      return "Password must be at least 6 characters long";
    }
    if (error.includes("Email rate limit exceeded")) {
      return "Too many registration attempts. Please try again later.";
    }
    if (error.includes("Invalid email")) {
      return "Please enter a valid email address";
    }
    return "An authentication error occurred. Please try again.";
  };

  if (isRegistered) {
    return (
      <div className="space-y-4 rounded-lg border border-green-200 bg-green-50 p-6 dark:border-green-800 dark:bg-green-950">
        <h2 className="text-xl font-semibold text-green-800 dark:text-green-200">Registration Successful!</h2>
        <p className="text-sm text-green-700 dark:text-green-300">
          Please check your email to verify your account. You&apos;ll need to verify your email address before you can
          log in.
        </p>
        <a
          href="/login"
          className="inline-block text-sm font-medium text-green-700 underline hover:text-green-900 dark:text-green-300 dark:hover:text-green-100"
        >
          Go to login page
        </a>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {globalError && <AuthErrorDisplay error={globalError} />}

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

        {/* Password Field */}
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-base font-semibold">Password</FormLabel>
              <FormControl>
                <Input type="password" placeholder="Create a strong password" disabled={isSubmitting} {...field} />
              </FormControl>
              <FormMessage />
              <PasswordStrengthIndicator password={password} />
            </FormItem>
          )}
        />

        {/* Confirm Password Field */}
        <FormField
          control={form.control}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-base font-semibold">Confirm Password</FormLabel>
              <FormControl>
                <Input type="password" placeholder="Confirm your password" disabled={isSubmitting} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Terms Acceptance */}
        <FormField
          control={form.control}
          name="acceptTerms"
          render={({ field }) => (
            <FormItem>
              <div className="flex items-start space-x-2">
                <FormControl>
                  <Checkbox checked={field.value} onCheckedChange={field.onChange} disabled={isSubmitting} />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel className="text-sm font-normal text-gray-700 dark:text-gray-300">
                    I accept the terms of service and privacy policy
                  </FormLabel>
                  <FormMessage />
                </div>
              </div>
            </FormItem>
          )}
        />

        {/* Submit Button */}
        <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
          {isSubmitting ? "Creating Account..." : "Create Account"}
        </Button>

        {/* Link to Login */}
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Already have an account?{" "}
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
