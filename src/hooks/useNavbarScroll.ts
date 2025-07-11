import { useState, useEffect } from "react";

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
