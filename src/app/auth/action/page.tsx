/**
 * @fileoverview Defines the universal auth action handler page.
 *
 * This page handles Auth actions such as:
 * - resetPassword
 * - verifyEmail
 *
 * It uses the `mode` query parameter to determine which component to render.
 */
"use client";

import { Suspense } from "react";

import { useSearchParams } from "next/navigation";

import { Loader2 } from "lucide-react";

import AuthLayout from "@/features/auth/components/auth-layout";
import ResetPasswordForm from "@/features/auth/components/reset-password-form";
import VerifyEmail from "@/features/auth/components/verify-email";

function AuthActionContent() {
  const searchParams = useSearchParams();
  const mode = searchParams.get("mode");

  // Determine title and description based on mode
  let title = "Authentication";
  let description = "Processing your request...";

  if (mode === "resetPassword") {
    title = "Reset Password";
    description = "Create a new password for your account.";
  } else if (mode === "verifyEmail") {
    title = "Verify Email";
    description = "Confirming your email address.";
  }

  return (
    <AuthLayout title={title} description={description}>
      {/* Supabase auth flows don't require the oobCode prop anymore, handling is internal/session-based */}
      {mode === "resetPassword" && <ResetPasswordForm />}
      {mode === "verifyEmail" && <VerifyEmail />}
      
      {!["resetPassword", "verifyEmail"].includes(mode || "") && (
        <div className="text-center text-muted-foreground">
          Invalid or unknown action mode.
        </div>
      )}
    </AuthLayout>
  );
}

export default function AuthActionPage() {
  return (
    <Suspense fallback={
        <AuthLayout title="Loading..." description="Please wait.">
            <div className="flex justify-center py-10">
                <Loader2 className="animate-spin h-8 w-8 text-primary"/>
            </div>
        </AuthLayout>
    }>
      <AuthActionContent />
    </Suspense>
  );
}
