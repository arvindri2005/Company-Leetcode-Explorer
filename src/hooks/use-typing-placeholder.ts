import { useState, useEffect } from "react";

/**
 * @function useTypingPlaceholder
 * @description Creates an animated "typewriter" effect for input placeholders.
 * It cycles through a list of strings (e.g., company names), typing them out character by character,
 * waiting, and then deleting them to type the next one.
 *
 * @param {string[]} companies - The list of strings to cycle through.
 * @returns {string} The current animated placeholder text.
 */
export function useTypingPlaceholder(companies: string[]) {
  const [placeholder, setPlaceholder] = useState("");
  const [isTyping, setIsTyping] = useState(true);
  const [currentCompanyIndex, setCurrentCompanyIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);

  useEffect(() => {
    const currentCompany = companies[currentCompanyIndex];
    let timeout: NodeJS.Timeout;

    if (isTyping) {
      if (charIndex < currentCompany.length) {
        timeout = setTimeout(() => {
          setPlaceholder((prev) => prev + currentCompany[charIndex]);
          setCharIndex((prev) => prev + 1);
        }, 100);
      } else {
        timeout = setTimeout(() => {
          setIsTyping(false);
        }, 2000);
      }
    } else {
      if (charIndex > 0) {
        timeout = setTimeout(() => {
          setPlaceholder((prev) => prev.slice(0, -1));
          setCharIndex((prev) => prev - 1);
        }, 50);
      } else {
        setIsTyping(true);
        setCurrentCompanyIndex((prev) => (prev + 1) % companies.length);
      }
    }

    return () => clearTimeout(timeout);
  }, [charIndex, isTyping, currentCompanyIndex, companies]);

  return placeholder;
}
