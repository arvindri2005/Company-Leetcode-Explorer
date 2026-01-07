import React from "react";
import { useSyncExternalStore } from "react";

/**
 * @function useMediaQuery
 * @description A custom hook that tracks the state of a CSS media query.
 * @param {string} query - The media query string to watch (e.g., '(min-width: 768px)').
 * @returns {boolean} `true` if the media query matches, otherwise `false`.
 */
export function useMediaQuery(query: string) {
  const subscribe = React.useCallback(
    (callback: () => void) => {
      const matchMedia = window.matchMedia(query);
      matchMedia.addEventListener("change", callback);
      return () => {
        matchMedia.removeEventListener("change", callback);
      };
    },
    [query]
  );

  const getSnapshot = () => {
    return window.matchMedia(query).matches;
  };

  const getServerSnapshot = () => {
    return false;
  };

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
