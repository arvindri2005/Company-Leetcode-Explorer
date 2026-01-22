"use client";

import { memo, useState } from "react";

import { useRouter, useSearchParams } from "next/navigation";

import { Loader2 } from "lucide-react";

import { GoogleIcon } from "@/components/icons/google-icon";
import { Button } from "@/components/ui/button";
import { useOnlineStatus } from "@/hooks/use-online-status";
import { useToast } from "@/hooks/use-toast";
import { isValidRedirectUrl } from "@/lib/utils/url";

import { authService } from "../services/auth.service";

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
      // Use the centralized authService which handles:
      // 1. Lazy loading of GoogleAuthProvider (Performance)
      // 2. Profile synchronization with Firestore (including caching/deduplication)
      // 3. Error logging
      const response = await authService.loginWithGoogle();

      if (response.success && response.data) {
        toast({
          title: "Login Successful! 🎉",
          description: `Welcome back, ${response.data.displayName || "User"}!`,
        });

        const redirectUrl = searchParams.get("redirectUrl");
        if (redirectUrl && isValidRedirectUrl(redirectUrl)) {
          router.push(redirectUrl);
        } else {
          router.push("/profile");
        }
      } else {
        // Handle failure
        toast({
          title: "Login Failed",
          description: response.error || "An unknown error occurred. Please try again.",
          variant: "destructive",
        });
      }
    } catch {
      // This catch block might not be reached if authService handles everything,
      // but kept for safety against unexpected errors in the component logic itself.
      toast({
        title: "Login Failed",
        description: "An unexpected error occurred. Please try again.",
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
