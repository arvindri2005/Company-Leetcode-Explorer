import React from "react";

/**
 * @function useMediaQuery
 * @description A custom hook that tracks the state of a CSS media query.
 * @param {string} query - The media query string to watch (e.g., '(min-width: 768px)').
 * @returns {boolean} `true` if the media query matches, otherwise `false`.
 */
export function useMediaQuery(query: string) {
  const [value, setValue] = React.useState(false);

  React.useEffect(() => {
    function onChange(event: MediaQueryListEvent) {
      setValue(event.matches);
    }

    const result = matchMedia(query);
    result.addEventListener("change", onChange);
    setValue(result.matches);

    return () => result.removeEventListener("change", onChange);
  }, [query]);

  return value;
}






