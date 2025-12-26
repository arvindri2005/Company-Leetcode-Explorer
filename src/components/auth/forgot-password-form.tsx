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
import { Loader2, MailIcon, ArrowLeft } from "lucide-react";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "@/lib/firebase";
import Link from "next/link";

const forgotPasswordSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address." }),
});

type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordForm() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEmailSent, setIsEmailSent] = useState(false);

  const form = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  async function onSubmit(data: ForgotPasswordValues) {
    setIsSubmitting(true);
    try {
      await sendPasswordResetEmail(auth, data.email);
      setIsEmailSent(true);
      toast({
        title: "Email Sent! 📧",
        description: "Check your inbox and spam folder for the password reset link.",
      });
    } catch (error) {
      console.error("Forgot Password error:", error);
      let errorMessage = "An unknown error occurred. Please try again.";

      if (error instanceof Error && "code" in error) {
        const firebaseError = error as { code: string; message: string };
        switch (firebaseError.code) {
          case "auth/user-not-found":
            // For security reasons, it's often better not to explicitly say the user doesn't exist,
            // but for this app's UX we might want to be helpful or just vague.
            // Let's stick to a generic success message or a specific error if we want to be helpful.
            // Actually, Firebase often doesn't throw user-not-found if email enumeration protection is on.
            // But if it does:
            errorMessage = "If that email exists, we sent a link."; 
            break;
          case "auth/invalid-email":
            errorMessage = "The email address is not valid.";
            break;
           case "auth/too-many-requests":
            errorMessage = "Too many attempts. Please try again later.";
            break;
          default:
            errorMessage = firebaseError.message || errorMessage;
        }
      }

      toast({
        title: "Request Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isEmailSent) {
    return (
      <div className="text-center space-y-6">
        <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
            <MailIcon className="w-8 h-8 text-primary" />
        </div>
        <div className="space-y-2">
            <h3 className="text-xl font-semibold">Check your email</h3>
            <p className="text-muted-foreground">
                We have sent a password reset link to <span className="font-medium text-foreground">{form.getValues("email")}</span>. Please check your inbox and spam folder.
            </p>
        </div>
        <Button asChild variant="outline" className="w-full">
            <Link href="/login">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Login
            </Link>
        </Button>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
                  className="h-11 transition-all duration-200 focus:ring-2 focus:ring-primary/50"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full h-11 text-base transition-all duration-200 hover:scale-[1.02] shadow-lg hover:shadow-primary/25"
        >
          {isSubmitting ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <MailIcon className="mr-2 h-4 w-4" />
          )}
          Send Reset Link
        </Button>

        <div className="text-center">
            <Link
                href="/login"
                className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors flex items-center justify-center"
            >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Login
            </Link>
        </div>
      </form>
    </Form>
  );
}
