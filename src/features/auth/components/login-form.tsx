/**
 * @fileoverview Defines the user login form component.
 *
 * This client-side component provides a form for users to sign in with their
 * email and password. It uses `react-hook-form` for form management, `zod` for
 * validation, and Firebase Authentication for the sign-in process. It also
 * handles loading states, error messages, and redirection upon successful login.
 */
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  browserLocalPersistence,
  browserSessionPersistence,
  setPersistence,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { Check, Loader2, LogInIcon } from "lucide-react";
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
import { useOnlineStatus } from "@/hooks/use-online-status";
import { useToast } from "@/hooks/use-toast";
import { auth } from "@/lib/api/firebase";
import { cn } from "@/lib/utils";
import { Logger } from "@/lib/utils/logger";
import { isValidRedirectUrl } from "@/lib/utils/url";

import GoogleAuthButton from "./google-auth-button";

/**
 * Zod schema for validating the login form fields.
 */
export const loginFormSchema = z.object({
  email: z
    .string()
    .email({ message: "Please enter a valid email address." })
    .max(255, { message: "Email must be less than 255 characters." }),
  password: z
    .string()
    .min(6, { message: "Password must be at least 6 characters." })
    .max(128, { message: "Password must be less than 128 characters." }),
  rememberMe: z.boolean(),
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
    mode: "onBlur",
    defaultValues: {
      email: "",
      password: "",
      rememberMe: false,
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
      await setPersistence(
        auth,
        data.rememberMe ? browserLocalPersistence : browserSessionPersistence,
      );

      await signInWithEmailAndPassword(auth, data.email, data.password);
      toast({
        title: "Login Successful! 🎉",
        description: "Welcome back!",
      });
      const redirectUrl = searchParams.get("redirectUrl");
      if (redirectUrl && isValidRedirectUrl(redirectUrl)) {
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
            // Log the raw error internally but show a generic message to the user
            Logger.error("Unhandled auth error", firebaseError);
            errorMessage = "An error occurred during sign in. Please try again.";
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

  const redirectParams = searchParams.get("redirectUrl");
  const signupUrl = `/signup${
    redirectParams ? `?redirectUrl=${encodeURIComponent(redirectParams)}` : ""
  }`;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <GoogleAuthButton disabled={isSubmitting} />

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
                <div className="relative">
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="you@example.com"
                      {...field}
                      autoComplete="email"
                      inputMode="email"
                      className="h-11 pr-10 transition-all duration-200 focus:ring-2 focus:ring-primary/50"
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <div
                    className={cn(
                      "absolute right-3 top-3 text-green-500 transition-all duration-200 ease-in-out pointer-events-none",
                      field.value &&
                        loginFormSchema.shape.email.safeParse(field.value)
                          .success
                        ? "opacity-100 scale-100"
                        : "opacity-0 scale-75",
                    )}
                  >
                    <Check className="h-4 w-4" aria-hidden="true" />
                  </div>
                </div>
                <FormMessage role="alert" />
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
                    disabled={isSubmitting}
                  />
                </FormControl>
                <FormMessage role="alert" />
              </FormItem>
            )}
          />
        </div>

        <div className="flex items-center justify-between">
          <FormField
            control={form.control}
            name="rememberMe"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    disabled={isSubmitting}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>Remember me</FormLabel>
                </div>
              </FormItem>
            )}
          />
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
          className="w-full h-11 text-base transition-all duration-200 hover:scale-102 shadow-lg hover:shadow-primary/25"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Logging in...
            </>
          ) : (
            <>
              {!isOnline ? (
                "You are offline"
              ) : (
                <>
                  <LogInIcon className="mr-2 h-4 w-4" />
                  Login
                </>
              )}
            </>
          )}
        </Button>

        <p className="text-center text-sm text-muted-foreground mt-6">
          Don&apos;t have an account?{" "}
          <Link
            href={signupUrl}
            className="font-medium text-primary hover:underline transition-colors"
          >
            Sign up
          </Link>
        </p>
      </form>
    </Form>
  );
}
