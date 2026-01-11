import { useEffect,useState } from "react";

export function useTypingPlaceholder(companies: string[]) {
  const [placeholder, setPlaceholder] = useState("");
  const [isTyping, setIsTyping] = useState(true);
  const [currentCompanyIndex, setCurrentCompanyIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);

  useEffect(() => {
    const currentCompany = companies[currentCompanyIndex];
    let timeout: NodeJS.Timeout;

    if (isTyping) {
      timeout = charIndex < currentCompany.length 
        ? setTimeout(() => {
            setPlaceholder((prev) => prev + currentCompany[charIndex]);
            setCharIndex((prev) => prev + 1);
          }, 100) 
        : setTimeout(() => {
            setIsTyping(false);
          }, 2000);
    } else if (charIndex > 0) {
      timeout = setTimeout(() => {
        setPlaceholder((prev) => prev.slice(0, -1));
        setCharIndex((prev) => prev - 1);
      }, 50);
    } else {
      // Schedule state updates for next tick to avoid setState in effect
      timeout = setTimeout(() => {
        setIsTyping(true);
        setCurrentCompanyIndex((prev) => (prev + 1) % companies.length);
      }, 0);
    }

    return () => clearTimeout(timeout);
  }, [charIndex, isTyping, currentCompanyIndex, companies]);

  return placeholder;
}






