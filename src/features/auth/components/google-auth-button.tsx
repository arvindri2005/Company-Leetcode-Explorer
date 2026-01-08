"use client";

import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { auth } from "@/lib/api/firebase";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { GoogleIcon } from "@/components/icons/google-icon";
import { useOnlineStatus } from "@/hooks/use-online-status";
import { Logger } from "@/lib/utils/logger";

export default function GoogleAuthButton() {
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const { syncUserProfileIfNeeded } = useAuth();
  const isOnline = useOnlineStatus();

  const handleGoogleSignIn = async () => {
    if (!isOnline) {
      toast({
        title: "You are offline",
        description: "Please check your internet connection and try again.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Sync user profile to Firestore
      await syncUserProfileIfNeeded(user);

      toast({
        title: "Login Successful! 🎉",
        description: `Welcome back, ${user.displayName || "User"}!`,
      });

      const redirectUrl = searchParams.get("redirectUrl");
      if (redirectUrl) {
        router.push(redirectUrl);
      } else {
        router.push("/profile");
      }
    } catch (error: any) {
      Logger.error("Google Sign-In Error:", error);
      let errorMessage = "An unknown error occurred. Please try again.";
      if (error.code === "auth/popup-closed-by-user") {
        errorMessage = "Sign-in cancelled.";
      } else if (error.code === "auth/popup-blocked") {
        errorMessage = "Sign-in popup blocked. Please allow popups for this site.";
      } else {
        errorMessage = error.message || errorMessage;
      }

      toast({
        title: "Login Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant="outline"
      type="button"
      className="w-full"
      onClick={handleGoogleSignIn}
      disabled={isLoading || !isOnline}
    >
      {isLoading ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <GoogleIcon className="mr-2 h-5 w-5" />
      )}
      {isOnline ? "Continue with Google" : "Offline"}
    </Button>
  );
}






