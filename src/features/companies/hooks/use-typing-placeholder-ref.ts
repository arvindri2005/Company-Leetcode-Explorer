import { type RefObject,useEffect, useRef } from "react";

/**
 * A performance-optimized hook that animates the input placeholder
 * by directly manipulating the DOM element, avoiding React re-renders.
 *
 * @param companies - Array of company names to cycle through
 * @param inputRef - Reference to the input element
 */
export function useTypingPlaceholderRef(
  companies: string[],
  inputRef: RefObject<HTMLInputElement | null>
) {
  // Use a ref for state to avoid re-triggering the effect
  const stateRef = useRef({
    placeholder: "",
    isTyping: true,
    currentCompanyIndex: 0,
    charIndex: 0,
  });

  useEffect(() => {
    let timeout: NodeJS.Timeout;

    const animate = () => {
      const state = stateRef.current;
      const currentCompany = companies[state.currentCompanyIndex];

      if (state.isTyping) {
        if (state.charIndex < currentCompany.length) {
          state.placeholder += currentCompany[state.charIndex];
          state.charIndex++;
          timeout = setTimeout(animate, 100);
        } else {
          state.isTyping = false;
          timeout = setTimeout(animate, 2000);
        }
      } else {
        if (state.charIndex > 0) {
          state.placeholder = state.placeholder.slice(0, -1);
          state.charIndex--;
          timeout = setTimeout(animate, 50);
        } else {
          state.isTyping = true;
          state.currentCompanyIndex =
            (state.currentCompanyIndex + 1) % companies.length;
          timeout = setTimeout(animate, 200);
        }
      }

      if (inputRef.current) {
        inputRef.current.placeholder = `Search for ${state.placeholder}|`;
      }
    };

    // Start the animation loop
    timeout = setTimeout(animate, 0);

    return () => clearTimeout(timeout);
  }, [companies, inputRef]);
}
