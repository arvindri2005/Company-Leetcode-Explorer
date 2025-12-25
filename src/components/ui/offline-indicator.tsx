"use client";

import { useOnlineStatus } from "@/hooks/use-online-status";
import { WifiOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

/**
 * A component that displays a visual indicator when the user is offline.
 * It appears as a fixed toast at the bottom right of the screen.
 */
export function OfflineIndicator() {
  const isOnline = useOnlineStatus();
  const [shouldRender, setShouldRender] = useState(false);

  // Use useEffect to handle mounting to avoid hydration mismatch
  // strictly speaking not needed if useOnlineStatus handles it, but good for safety
  useEffect(() => {
    setShouldRender(true);
  }, []);

  if (!shouldRender) return null;
  if (isOnline) return null;

  return (
    <div className={cn(
      "fixed bottom-4 right-4 z-[9999] flex items-center gap-2 rounded-md",
      "bg-destructive px-4 py-2 text-destructive-foreground shadow-lg",
      "animate-in slide-in-from-bottom-5 duration-300"
    )}>
      <WifiOff className="h-4 w-4" />
      <span className="text-sm font-medium">You are offline</span>
    </div>
  );
}
