"use client";

import { useEffect, useState } from "react";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

import { CheckCircle2, XCircle } from "lucide-react";

import { Button } from "@/shared/components/ui/button";

export default function VerifyEmail() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");

  useEffect(() => {
    // The callback route (/auth/callback) redirects here with status=success if verification worked
    const mode = searchParams.get("mode");
    const statusParam = searchParams.get("status");

    if (mode === "verifyEmail" && statusParam === "success") {
      setStatus("success");
    } else {
      // If we landed here without success param, it might be an error or manual navigation
      setStatus("error");
    }
  }, [searchParams]);

  if (status === "loading") {
    // This state is transient as the callback redirects relatively quickly
    return <div>Verifying...</div>;
  }

  if (status === "success") {
    return (
      <div className="text-center space-y-6">
        <div className="mx-auto w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h3 className="text-xl font-semibold">Email Verified!</h3>
          <p className="text-muted-foreground">
            Thank you for verifying your email address. Your account is now fully active.
          </p>
        </div>
        <Button asChild className="w-full">
          <Link href="/profile">Go to Profile</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="text-center space-y-6">
      <div className="mx-auto w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center">
        <XCircle className="w-8 h-8" />
      </div>
      <div className="space-y-2">
        <h3 className="text-xl font-semibold">Verification Failed</h3>
        <p className="text-muted-foreground">
          The verification link may be invalid or expired.
        </p>
      </div>
      <div className="space-y-2 w-full">
         <Button asChild variant="default" className="w-full">
          <Link href="/login">Back to Login</Link>
        </Button>
      </div>
    </div>
  );
}
