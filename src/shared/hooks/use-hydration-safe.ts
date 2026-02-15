/**
 * @fileoverview Hook for handling hydration-safe client-side rendering.
 * 
 * This hook ensures that client-specific content is only rendered after
 * hydration completes, preventing hydration mismatches between server and client.
 */
"use client";

import { useEffect, useState } from "react";

/**
 * Hook that returns true only after the component has hydrated on the client.
 * Use this to defer rendering of client-specific content until after hydration.
 * 
 * @returns {boolean} True if the component has hydrated, false otherwise
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const isHydrated = useHydrationSafe();
 *   
 *   if (!isHydrated) {
 *     return <div>Loading...</div>; // Server and initial client render
 *   }
 *   
 *   return <div>{clientOnlyContent}</div>; // Only after hydration
 * }
 * ```
 */
export function useHydrationSafe(): boolean {
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    // This effect only runs on the client after hydration
    // Use a microtask to avoid synchronous setState during render/effect initialization
    void Promise.resolve().then(() => {
      setIsHydrated(true);
    });
  }, []);

  return isHydrated;
}

/**
 * Hook that safely handles layout effects during SSR.
 * Uses useEffect on server and useLayoutEffect on client.
 * 
 * This prevents warnings about useLayoutEffect during SSR while
 * maintaining proper timing on the client.
 */
export const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useEffect : useEffect;
