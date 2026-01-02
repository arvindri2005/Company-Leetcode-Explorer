/**
 * @fileoverview Defines the user registration (sign-up) form component.
 *
 * This client-side component provides a form for new users to create an account
 * with their display name, email, and password. It uses `react-hook-form` for
 * form management, `zod` for validation, and Firebase Authentication for the
 * user creation process. It handles loading states, error messages, and redirects
 * upon successful registration.
 */
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { Loader2, UserPlusIcon, Eye, EyeOff } from "lucide-react";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import GoogleAuthButton from "./google-auth-button";
import { useAuth } from "@/contexts/auth-context";
import { PasswordStrengthIndicator } from "./password-strength-indicator";
import { Check } from "lucide-react";
import { useEffect } from "react";
import { useOnlineStatus } from "@/hooks/use-online-status";

/**
 * Zod schema for validating the sign-up form fields.
 */
const signupFormSchema = z.object({
  displayName: z
    .string()
    .min(2, { message: "Display name must be at least 2 characters." })
    .max(50),
  email: z.string().email({ message: "Please enter a valid email address." }),
  password: z
    .string()
    .min(6, { message: "Password must be at least 6 characters." }),
});

type SignupFormValues = z.infer<typeof signupFormSchema>;

/**
 * Renders an interactive sign-up form.
 *
 * This component handles the entire user registration flow:
 * - Displays display name, email, and password input fields.
 * - Validates user input using the `signupFormSchema`.
 * - On submission, it creates a new user with Firebase Authentication.
 * - Updates the user's Firebase profile with their display name.
 * - Triggers a sync to create a corresponding user profile in Firestore.
 * - Shows a loading indicator during submission.
 * - Displays success or error notifications (toasts).
 * - Redirects the user to their profile upon successful sign-up.
 *
 * @returns {JSX.Element} The rendered sign-up form component.
 */
export default function SignupForm() {
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { syncUserProfileIfNeeded } = useAuth();
  const [passwordScore, setPasswordScore] = useState(0);
  const isOnline = useOnlineStatus();

  const form = useForm<SignupFormValues>({
    resolver: zodResolver(signupFormSchema),
    defaultValues: {
      displayName: "",
      password: "",
    },
  });

  // Calculate password strength
  const password = form.watch("password");
  useEffect(() => {
    let score = 0;
    if (!password) {
      setPasswordScore(0);
      return;
    }
    if (password.length > 6) score += 1;
    if (password.length > 10) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;
    setPasswordScore(score);
  }, [password]);

  async function onSubmit(data: SignupFormValues) {
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
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        data.email,
        data.password,
      );

      if (userCredential.user) {
        await updateProfile(userCredential.user, {
          displayName: data.displayName,
        });
        await syncUserProfileIfNeeded(userCredential.user);
      }

      toast({
        title: "Account Created! 🎉",
        description: "Welcome! You have been successfully signed up.",
      });

      const redirectUrl = searchParams.get("redirectUrl");
      if (redirectUrl) {
        router.push(redirectUrl);
      } else {
        router.push("/profile");
      }
    } catch (error) {
      console.error("Signup error:", error);
      let errorMessage = "An unknown error occurred. Please try again.";

      if (error instanceof Error && "code" in error) {
        const firebaseError = error as { code: string; message: string };
        switch (firebaseError.code) {
          case "auth/email-already-in-use":
            errorMessage = "This email address is already in use.";
            break;
          case "auth/invalid-email":
            errorMessage = "The email address is not valid.";
            break;
          case "auth/weak-password":
            errorMessage = "The password is too weak.";
            break;
          default:
            errorMessage = firebaseError.message || errorMessage;
        }
      }

      toast({
        title: "Signup Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  // NOTE: Removed opacity-0 to prevent visibility issues after animation.
  // Using animationFillMode: 'both' ensures initial state (opacity 0 from fade-in) applies during delay.

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500"
      >
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 delay-100" style={{ animationFillMode: 'both' }}>
          <GoogleAuthButton />
        </div>

        <div className="relative my-6 animate-in fade-in slide-in-from-bottom-2 duration-500 delay-150" style={{ animationFillMode: 'both' }}>
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">
              Or continue with email
            </span>
          </div>
        </div>

        <FormField
          control={form.control}
          name="displayName"
          render={({ field }) => (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 delay-200" style={{ animationFillMode: 'both' }}>
              <FormItem>
                <FormLabel>Display Name</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      placeholder="Your Name"
                      {...field}
                      autoComplete="name"
                      autoCapitalize="words"
                      className="h-11 transition-all duration-200 focus:ring-2 focus:ring-primary/50"
                    />
                     {field.value && !form.getFieldState("displayName").invalid && (
                      <div className="absolute right-3 top-3 text-green-500 animate-in fade-in zoom-in">
                        <Check className="h-4 w-4" />
                      </div>
                    )}
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            </div>
          )}
        />
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 delay-300" style={{ animationFillMode: 'both' }}>
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      type="email"
                      inputMode="email"
                      placeholder="you@example.com"
                      {...field}
                      autoComplete="email"
                      className="h-11 transition-all duration-200 focus:ring-2 focus:ring-primary/50"
                    />
                    {field.value && !form.getFieldState("email").invalid && (
                      <div className="absolute right-3 top-3 text-green-500 animate-in fade-in zoom-in">
                        <Check className="h-4 w-4" />
                      </div>
                    )}
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            </div>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 delay-400" style={{ animationFillMode: 'both' }}>
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      {...field}
                      autoComplete="new-password"
                      className="h-11 transition-all duration-200 focus:ring-2 focus:ring-primary/50 pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                      <span className="sr-only">
                        {showPassword ? "Hide password" : "Show password"}
                      </span>
                    </Button>
                  </div>
                </FormControl>
                <PasswordStrengthIndicator score={passwordScore} />
                <FormMessage />
              </FormItem>
            </div>
          )}
        />
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 delay-500" style={{ animationFillMode: 'both' }}>
          <Button
            type="submit"
            disabled={isSubmitting || !isOnline}
            className="w-full h-11 text-base transition-all duration-200 hover:scale-102 shadow-lg hover:shadow-primary/25"
          >
            {isSubmitting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : !isOnline ? (
              "You are offline"
            ) : (
              <>
                <UserPlusIcon className="mr-2 h-4 w-4" />
                Sign Up
              </>
            )}
          </Button>
        </div>

        <p className="text-center text-sm text-muted-foreground mt-6 animate-in fade-in slide-in-from-bottom-2 duration-500 delay-600" style={{ animationFillMode: 'both' }}>
          Already have an account?{" "}
          <Link
            href={`/login${
              searchParams.get("redirectUrl")
                ? `?redirectUrl=${encodeURIComponent(
                    searchParams.get("redirectUrl")!
                  )}`
                : ""
            }`}
            className="font-medium text-primary hover:underline transition-colors"
          >
            Log in
          </Link>
        </p>
      </form>
    </Form>
  );
}
