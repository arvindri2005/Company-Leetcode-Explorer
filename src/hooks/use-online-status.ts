"use client";

import { useState, useEffect } from "react";

/**
 * Hook that returns the current online status of the user.
 * It returns true if the user is online, and false if offline.
 * It uses the `navigator.onLine` property and listens for `online` and `offline` events.
 *
 * @returns {boolean} The current online status.
 */
export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    // Check initial status on mount to avoid hydration mismatch
    // (navigator is not available on the server)
    if (typeof window !== "undefined") {
      setIsOnline(navigator.onLine);
    }

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return isOnline;
}
