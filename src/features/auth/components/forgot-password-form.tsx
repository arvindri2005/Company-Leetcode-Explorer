"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";

import Link from "next/link";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Check, Loader2, MailIcon } from "lucide-react";
import { z } from "zod";

import { Button } from "@/shared/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/shared/components/ui/form";
import { Input } from "@/shared/components/ui/input";
import { useToast } from "@/shared/hooks/use-toast";
import { cn } from "@/shared/lib/utils";
import { Logger } from "@/shared/lib/utils/logger";

import { authService } from "../services/auth.service";

export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .email({ message: "Please enter a valid email address." })
    .max(255, { message: "Email must be less than 255 characters." }),
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
      // Supabase handles password reset emails
      const result = await authService.resetPassword(data.email);
      
      if (result.success) {
        setIsEmailSent(true);
        toast({
          title: "Email Sent! 📧",
          description: "Check your inbox for the password reset link.",
        });
      } else {
         toast({
          title: "Request Failed",
          description: result.error || "Could not send reset link.",
          variant: "destructive",
        });
      }

    } catch (error) {
      Logger.error("Forgot Password error:", error);
      toast({
        title: "Request Failed",
        description: "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isEmailSent) {
    return (
      <div className="text-center space-y-6" role="status" aria-live="polite">
        <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
            <MailIcon className="w-8 h-8 text-primary" />
        </div>
        <div className="space-y-2">
            <h3 className="text-xl font-semibold">Check your email</h3>
            <p className="text-muted-foreground">
                We have sent a password reset link to <span className="font-medium text-foreground">{form.getValues("email")}</span>. Please check your inbox and spam folder.
            </p>
        </div>
        <div className="space-y-2 w-full">
          <Button asChild variant="outline" className="w-full">
            <Link href="/login">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Login
            </Link>
          </Button>
          <Button
            variant="ghost"
            className="w-full text-muted-foreground hover:text-primary"
            onClick={() => setIsEmailSent(false)}
          >
            Try another email
          </Button>
        </div>
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
              <div className="relative">
                <FormControl>
                  <Input
                    type="email"
                    inputMode="email"
                    placeholder="you@example.com"
                    {...field}
                    autoComplete="email"
                    className="h-11 pr-10 transition-all duration-200 focus:ring-2 focus:ring-primary/50"
                    disabled={isSubmitting}
                  />
                </FormControl>
                <div
                  className={cn(
                    "absolute right-3 top-3 text-green-500 transition-all duration-200 ease-in-out pointer-events-none",
                    field.value &&
                      forgotPasswordSchema.shape.email.safeParse(field.value)
                        .success
                      ? "opacity-100 scale-100"
                      : "opacity-0 scale-75",
                  )}
                >
                  <Check className="h-4 w-4" aria-hidden="true" />
                </div>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full h-11 text-base transition-all duration-200 hover:scale-102 shadow-lg hover:shadow-primary/25"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Sending Link...
            </>
          ) : (
            <>
              <MailIcon className="mr-2 h-4 w-4" />
              Send Reset Link
            </>
          )}
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
