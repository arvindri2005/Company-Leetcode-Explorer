import { useState, useEffect } from "react";

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
