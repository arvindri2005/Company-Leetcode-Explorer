"use client";

import { memo, useState } from "react";

import { Loader2 } from "lucide-react";

import { GoogleIcon } from "@/shared/components/icons/google-icon";
import { Button } from "@/shared/components/ui/button";
import { useOnlineStatus } from "@/shared/hooks/use-online-status";
import { useToast } from "@/shared/hooks/use-toast";

import { authService } from "../services/auth.service";

interface GoogleAuthButtonProps {
  disabled?: boolean;
}

/**
 * A button component that handles Google Sign-In via Supabase OAuth.
 *
 * @component
 * @description
 * This component triggers a redirect to Google for authentication.
 * Success/Failure is handled by the callback route, not here.
 */
const GoogleAuthButton = memo(function GoogleAuthButton({ disabled }: GoogleAuthButtonProps) {
  const { toast } = useToast();
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
      // Triggers a redirect - no return value handling needed for success path used effectively
      const response = await authService.loginWithGoogle();

      if (!response.success && response.error) {
         toast({
          title: "Login Failed",
          description: response.error,
          variant: "destructive",
        });
        setIsLoading(false);
      }
      // If success, page will redirect, so we don't need to unset isLoading ideally,
      // but if user cancels or something weird happens (though usually redirect is immediate),
      // we might want to reset. For now, leave as loading to prevent double clicks.
    } catch {
      toast({
        title: "Login Failed",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
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
