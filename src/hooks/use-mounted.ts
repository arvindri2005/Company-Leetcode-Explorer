import { useState, useEffect } from "react";

/**
 * @function useMounted
 * @description A custom hook that tracks whether the component has mounted on the client.
 * This is useful for avoiding hydration mismatches when rendering content that differs
 * between the server and the client (e.g., using `window`, `localStorage`, or `Math.random()`).
 *
 * @returns {boolean} `true` if the component has mounted, `false` otherwise.
 *
 * @example
 * const isMounted = useMounted();
 * if (!isMounted) return null; // or return a skeleton
 */
export function useMounted() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return mounted;
}






