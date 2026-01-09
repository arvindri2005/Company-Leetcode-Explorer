"use client";

import { useSyncExternalStore } from "react";

function subscribe(callback: () => void) {
  window.addEventListener("online", callback);
  window.addEventListener("offline", callback);
  return () => {
    window.removeEventListener("online", callback);
    window.removeEventListener("offline", callback);
  };
}

function getSnapshot() {
  return navigator.onLine;
}

function getServerSnapshot() {
  return true;
}

/**
 * @function useOnlineStatus
 * @description A custom hook that tracks the browser's online/offline status.
 * It uses `useSyncExternalStore` to safely subscribe to window 'online' and 'offline' events
 * while remaining compatible with React 18's concurrent features and SSR (defaulting to true).
 *
 * @returns {boolean} `true` if the browser is online, `false` otherwise.
 */
export function useOnlineStatus() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
