"use client";

import { useEffect, useState } from "react";
import { applyActionCode } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import Link from "next/link";

interface VerifyEmailProps {
  oobCode: string | null;
}

export default function VerifyEmail({ oobCode }: VerifyEmailProps) {
  const [status, setStatus] = useState<"verifying" | "success" | "error">("verifying");
  const [message, setMessage] = useState("Verifying your email address...");

  useEffect(() => {
    if (!oobCode) {
      // Defer state update to avoid set-state-in-effect warning if run immediately
      setTimeout(() => {
        setStatus("error");
        setMessage("Invalid verification link. The code is missing.");
      }, 0);
      return;
    }

    applyActionCode(auth, oobCode)
      .then(() => {
        setStatus("success");
      })
      .catch((error) => {
        console.error("Email verification error:", error);
        setStatus("error");
        if (error.code === "auth/invalid-action-code") {
            setMessage("This verification link is invalid or has expired.");
        } else {
            setMessage("Failed to verify email. Please try again.");
        }
      });
  }, [oobCode]);

  if (status === "verifying") {
    return (
      <div className="flex flex-col items-center justify-center space-y-4 py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground">{message}</p>
      </div>
    );
  }

  if (status === "success") {
    return (
      <div className="text-center space-y-6">
        <div className="mx-auto w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center">
            <CheckCircle2 className="w-8 h-8 text-green-600" />
        </div>
        <div className="space-y-2">
            <h3 className="text-xl font-semibold text-green-600">Email Verified!</h3>
            <p className="text-muted-foreground">
                Your email has been successfully verified. You can now access all features.
            </p>
        </div>
        <Button asChild className="w-full bg-green-600 hover:bg-green-700">
            <Link href="/login">
                Continue to Login
            </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="text-center space-y-6">
        <div className="mx-auto w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center">
            <XCircle className="w-8 h-8 text-destructive" />
        </div>
        <div className="space-y-2">
            <h3 className="text-xl font-semibold text-destructive">Verification Failed</h3>
            <p className="text-muted-foreground">{message}</p>
        </div>
         <Button asChild variant="outline" className="w-full">
            <Link href="/login">
                Back to Login
            </Link>
        </Button>
    </div>
  );
}
