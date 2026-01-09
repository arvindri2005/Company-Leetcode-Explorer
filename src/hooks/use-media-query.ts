import React from "react";

/**
 * @function useMediaQuery
 * @description A custom hook that tracks the state of a CSS media query.
 * Implements `useSyncExternalStore` for correct server-side rendering support
 * (avoiding hydration mismatches) and concurrent mode compatibility.
 *
 * @param {string} query - The media query string to watch (e.g., '(min-width: 768px)').
 * @returns {boolean} `true` if the media query matches, otherwise `false`.
 */
export function useMediaQuery(query: string) {
  const getServerSnapshot = () => {
    return false;
  };

  const [subscribe, getSnapshot] = React.useMemo(() => {
    if (typeof window === 'undefined') {
       return [() => () => {}, () => false];
    }

    const matchMedia = window.matchMedia(query);

    const subscribe = (callback: () => void) => {
        matchMedia.addEventListener("change", callback);
        return () => matchMedia.removeEventListener("change", callback);
    };

    const getSnapshot = () => matchMedia.matches;

    return [subscribe, getSnapshot];
  }, [query]);

  return React.useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
