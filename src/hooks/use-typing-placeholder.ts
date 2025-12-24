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
        // Defer state update to next tick to avoid "setState during render" warning from effect
        // Technically this effect is dependent on state, so it runs after render.
        // But if we immediately set state, React might flag cascading updates if not careful.
        // Actually, the warning usually happens if we set state synchronously in effect without condition?
        // But here we are in a branch.
        // The issue is likely that we are triggering a re-render cycle immediately.
        timeout = setTimeout(() => {
            setIsTyping(true);
            setCurrentCompanyIndex((prev) => (prev + 1) % companies.length);
        }, 0);
      }
    }

    return () => clearTimeout(timeout);
  }, [charIndex, isTyping, currentCompanyIndex, companies]);

  return placeholder;
}
