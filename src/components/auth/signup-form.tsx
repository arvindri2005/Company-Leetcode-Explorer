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
import { PasswordStrengthIndicator } from "./password-strength-indicator"; // [NEW]
import { motion } from "framer-motion"; // [NEW]
import { Check } from "lucide-react"; // [NEW]
import { useEffect } from "react"; // [NEW]

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
  const [passwordScore, setPasswordScore] = useState(0); // [NEW]

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

  // Animation variants
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  };

  async function onSubmit(data: SignupFormValues) {
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

  return (
    <Form {...form}>
      <motion.form
        variants={container}
        initial="hidden"
        animate="show"
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-6"
      >
        <motion.div variants={item}>
          <GoogleAuthButton />
        </motion.div>

        <motion.div variants={item} className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">
              Or continue with email
            </span>
          </div>
        </motion.div>

        <FormField
          control={form.control}
          name="displayName"
          render={({ field }) => (
            <motion.div variants={item}>
              <FormItem>
                <FormLabel>Display Name</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      placeholder="Your Name"
                      {...field}
                      autoFocus
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
            </motion.div>
          )}
        />
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <motion.div variants={item}>
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      type="email"
                      placeholder="you@example.com"
                      {...field}
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
            </motion.div>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <motion.div variants={item}>
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      {...field}
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
            </motion.div>
          )}
        />
        <motion.div variants={item}>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full h-11 text-base transition-all duration-200 hover:scale-[1.02] shadow-lg hover:shadow-primary/25"
          >
            {isSubmitting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <UserPlusIcon className="mr-2 h-4 w-4" />
            )}
            Sign Up
          </Button>
        </motion.div>

        <motion.p variants={item} className="text-center text-sm text-muted-foreground mt-6">
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
        </motion.p>
      </motion.form>
    </Form>
  );
}
