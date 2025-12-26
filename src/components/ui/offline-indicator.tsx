"use client";

import { useOnlineStatus } from "@/hooks/use-online-status";
import { WifiOff } from "lucide-react";
import { cn } from "@/lib/utils";

export function OfflineIndicator() {
  const isOnline = useOnlineStatus();

  if (isOnline) {
    return null;
  }

  return (
    <div
      className={cn(
        "fixed bottom-4 left-4 z-50 flex items-center gap-2 rounded-md bg-destructive px-4 py-2 text-sm font-medium text-destructive-foreground shadow-lg animate-in slide-in-from-bottom-5",
      )}
      role="status"
      aria-live="polite"
    >
      <WifiOff className="h-4 w-4" />
      <span>You are currently offline</span>
    </div>
  );
}
