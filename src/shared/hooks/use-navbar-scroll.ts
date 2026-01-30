import { useEffect,useState } from "react";

/**
 * @function useNavbarScroll
 * @description A custom hook that changes the navbar background color based on the window's scroll position.
 * It makes the background slightly more opaque after the user scrolls down.
 * @returns {string} The calculated background color string for the navbar.
 */
export const useNavbarScroll = () => {
  const [navbarBg, setNavbarBg] = useState("rgba(15, 15, 35, 0.95)");

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 100) {
        setNavbarBg("rgba(15, 15, 35, 0.98)");
      } else {
        setNavbarBg("rgba(15, 15, 35, 0.95)");
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return navbarBg;
};






