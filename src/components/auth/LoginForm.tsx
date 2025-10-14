import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import type { z } from "zod";
import { LoginSchema } from "@/lib/auth.schemas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { AuthErrorDisplay } from "./AuthErrorDisplay";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

type LoginFormInput = z.infer<typeof LoginSchema>;

interface LoginFormProps {
  redirectTo?: string;
}

/**
 * Login form component with validation and "remember me" functionality
 */
export function LoginForm({ redirectTo }: LoginFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);

  const form = useForm<LoginFormInput>({
    resolver: zodResolver(LoginSchema),
    mode: "onBlur",
    defaultValues: {
      email: "",
      password: "",
      rememberMe: false,
    },
  });

  const onSubmit = async (data: LoginFormInput) => {
    setGlobalError(null);
    setIsSubmitting(true);

    try {
      // TODO: Implement Supabase login
      // const supabase = createClient();
      // const { error } = await supabase.auth.signInWithPassword({
      //   email: data.email,
      //   password: data.password,
      // });
      //
      // if (error) {
      //   setGlobalError(mapAuthError(error));
      //   return;
      // }

      // Placeholder success behavior
      // eslint-disable-next-line no-console
      console.log("Login data:", data);

      // Redirect after successful login
      const destination = redirectTo || "/generate";
      window.location.href = destination;
    } catch (error) {
      setGlobalError("Login service is temporarily unavailable. Please try again.");
      // eslint-disable-next-line no-console
      console.error("Login error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

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
                <Input type="password" placeholder="Enter your password" disabled={isSubmitting} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Remember Me Checkbox */}
        <FormField
          control={form.control}
          name="rememberMe"
          render={({ field }) => (
            <FormItem>
              <div className="flex items-start space-x-2">
                <FormControl>
                  <Checkbox checked={field.value} onCheckedChange={field.onChange} disabled={isSubmitting} />
                </FormControl>
                <FormLabel className="text-sm font-normal text-gray-700 dark:text-gray-300">
                  Remember me for 30 days
                </FormLabel>
              </div>
            </FormItem>
          )}
        />

        {/* Submit Button */}
        <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
          {isSubmitting ? "Logging in..." : "Log In"}
        </Button>

        {/* Links */}
        <div className="space-y-2 text-sm">
          <p className="text-gray-600 dark:text-gray-400">
            <a
              href="/forgot-password"
              className="font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
            >
              Forgot your password?
            </a>
          </p>
          <p className="text-gray-600 dark:text-gray-400">
            Don&apos;t have an account?{" "}
            <a
              href="/register"
              className="font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
            >
              Sign up
            </a>
          </p>
        </div>
      </form>
    </Form>
  );
}
