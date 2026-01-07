/**
 * @fileoverview Defines the user login form component.
 *
 * This client-side component provides a form for users to sign in with their
 * email and password. It uses `react-hook-form` for form management, `zod` for
 * validation, and Firebase Authentication for the sign-in process. It also
 * handles loading states, error messages, and redirection upon successful login.
 */
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { LogInIcon } from "lucide-react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import GoogleAuthButton from "./google-auth-button";
import { useOnlineStatus } from "@/hooks/use-online-status";
import { Logger } from "@/lib/logger";

/**
 * Zod schema for validating the login form fields.
 */
const loginFormSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address." }),
  password: z
    .string()
    .min(6, { message: "Password must be at least 6 characters." }),
});

type LoginFormValues = z.infer<typeof loginFormSchema>;

/**
 * Renders an interactive login form.
 *
 * This component handles the entire user login flow:
 * - Displays email and password input fields.
 * - Validates user input using the `loginFormSchema`.
 * - On submission, it attempts to sign the user in via Firebase Authentication.
 * - Shows a loading indicator during the submission process.
 * - Displays success or error notifications (toasts) based on the outcome.
 * - Redirects the user to their profile or a specified `redirectUrl` on successful login.
 *
 * @returns {JSX.Element} The rendered login form component.
 */
export default function LoginForm() {
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isOnline = useOnlineStatus();

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(data: LoginFormValues) {
    if (!isOnline) {
      toast({
        title: "You are offline",
        description: "Please check your internet connection and try again.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await signInWithEmailAndPassword(auth, data.email, data.password);
      toast({
        title: "Login Successful! 🎉",
        description: "Welcome back!",
      });
      const redirectUrl = searchParams.get("redirectUrl");
      if (redirectUrl) {
        router.push(redirectUrl);
      } else {
        router.push("/profile");
      }
    } catch (error) {
      Logger.error("Login error:", error);
      let errorMessage = "An unknown error occurred. Please try again.";

      if (error instanceof Error && "code" in error) {
        const firebaseError = error as { code: string; message: string };
        switch (firebaseError.code) {
          case "auth/user-not-found":
          case "auth/wrong-password":
          case "auth/invalid-credential":
            errorMessage = "Invalid email or password. Please try again.";
            break;
          case "auth/invalid-email":
            errorMessage = "The email address is not valid.";
            break;
          case "auth/too-many-requests":
            errorMessage = "Too many login attempts. Please try again later.";
            break;
          default:
            errorMessage = firebaseError.message || errorMessage;
        }
      }

      toast({
        title: "Login Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <GoogleAuthButton />

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">
              Or continue with email
            </span>
          </div>
        </div>

        <div className="space-y-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                    <Input
                      type="email"
                      placeholder="you@example.com"
                      {...field}
                      autoComplete="email"
                      inputMode="email"
                      className="h-11 transition-all duration-200 focus:ring-2 focus:ring-primary/50"
                    />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <PasswordInput
                    placeholder="••••••••"
                    {...field}
                    autoComplete="current-password"
                    className="h-11 transition-all duration-200 focus:ring-2 focus:ring-primary/50"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Checkbox id="remember" />
            <label
              htmlFor="remember"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Remember me
            </label>
          </div>
          <Link
            href="/forgot-password"
            className="text-sm font-medium text-primary hover:underline"
          >
            Forgot password?
          </Link>
        </div>

        <Button
          type="submit"
          disabled={isSubmitting || !isOnline}
          isLoading={isSubmitting}
          className="w-full h-11 text-base transition-all duration-200 hover:scale-102 shadow-lg hover:shadow-primary/25"
        >
          {isSubmitting ? null : !isOnline ? (
            "You are offline"
          ) : (
            <>
              <LogInIcon className="mr-2 h-4 w-4" />
              Login
            </>
          )}
        </Button>



        <p className="text-center text-sm text-muted-foreground mt-6">
          Don&apos;t have an account?{" "}
          <Link
            href={`/signup${
              searchParams.get("redirectUrl")
                ? `?redirectUrl=${encodeURIComponent(
                    searchParams.get("redirectUrl")!
                  )}`
                : ""
            }`}
            className="font-medium text-primary hover:underline transition-colors"
          >
            Sign up
          </Link>
        </p>
      </form>
    </Form>
  );
}
