"use client";

import { memo, useState } from "react";

import { useRouter, useSearchParams } from "next/navigation";

import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { Loader2 } from "lucide-react";

import { GoogleIcon } from "@/components/icons/google-icon";
import { Button } from "@/components/ui/button";
import { useOnlineStatus } from "@/hooks/use-online-status";
import { useToast } from "@/hooks/use-toast";
import { auth } from "@/lib/api/firebase";
import { Logger } from "@/lib/utils/logger";
import { isValidRedirectUrl } from "@/lib/utils/url";
import { useAuth } from "@/providers";

interface GoogleAuthButtonProps {
  disabled?: boolean;
}

/**
 * A button component that handles Google Sign-In.
 *
 * @component
 * @description
 * This component is wrapped in `React.memo` to prevent unnecessary re-renders
 * when used inside forms (like LoginForm/SignupForm). Since forms re-render
 * on every keystroke (when using controlled inputs or watching state),
 * memoizing this button prevents it from re-rendering unless the `disabled`
 * prop changes.
 *
 * Performance impact: Reduces re-renders of this component from N (number of keystrokes)
 * to 1 (only when submission state changes).
 */
const GoogleAuthButton = memo(function GoogleAuthButton({ disabled }: GoogleAuthButtonProps) {
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
      if (redirectUrl && isValidRedirectUrl(redirectUrl)) {
        router.push(redirectUrl);
      } else {
        router.push("/profile");
      }
    } catch (error: unknown) {
      Logger.error("Google Sign-In Error:", error);
      let errorMessage = "An unknown error occurred. Please try again.";
      const firebaseError = error as { code?: string; message?: string };
      if (firebaseError.code === "auth/popup-closed-by-user") {
        errorMessage = "Sign-in cancelled.";
      } else if (firebaseError.code === "auth/popup-blocked") {
        errorMessage = "Sign-in popup blocked. Please allow popups for this site.";
      } else {
        errorMessage = firebaseError.message || errorMessage;
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
      disabled={isLoading || !isOnline || disabled}
    >
      {isLoading ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <GoogleIcon className="mr-2 h-5 w-5" />
      )}
      {isOnline ? "Continue with Google" : "Offline"}
    </Button>
  );
});

export default GoogleAuthButton;
