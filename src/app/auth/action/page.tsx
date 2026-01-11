/**
 * @fileoverview Defines the universal auth action handler page.
 *
 * This page handles Firebase Authentication email actions such as:
 * - resetPassword
 * - verifyEmail
 * - recoverEmail
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
  const oobCode = searchParams.get("oobCode");

  // Determine title and description based on mode
  let title = "Authentication";
  let description = "Processing your request...";

  if (mode === "resetPassword") {
    title = "Reset Password";
    description = "Create a new password for your account.";
  } else if (mode === "verifyEmail") {
    title = "Verify Email";
    description = "Confirming your email address.";
  } else if (mode === "recoverEmail") {
      title = "Recover Email";
      description = "Restoring access to your email.";
  }

  return (
    <AuthLayout title={title} description={description}>
      {mode === "resetPassword" && <ResetPasswordForm oobCode={oobCode} />}
      {mode === "verifyEmail" && <VerifyEmail oobCode={oobCode} />}
      {/* Add other modes here as needed */}
      {!["resetPassword", "verifyEmail", "recoverEmail"].includes(mode || "") && (
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






