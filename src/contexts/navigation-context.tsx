"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { navigationRegistry, NavigationLink } from "@/lib/navigation-registry";

interface NavigationContextType {
  links: NavigationLink[];
  registerLink: (link: NavigationLink) => void;
}

const NavigationContext = createContext<NavigationContextType | undefined>(
  undefined
);

export const NavigationProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [links, setLinks] = useState<NavigationLink[]>(
    navigationRegistry.getLinks()
  );

  useEffect(() => {
    // Sync with registry on mount and updates
    setLinks(navigationRegistry.getLinks());

    const unsubscribe = navigationRegistry.subscribe(() => {
      setLinks(navigationRegistry.getLinks());
    });

    return () => unsubscribe();
  }, []);

  const registerLink = (link: NavigationLink) => {
    navigationRegistry.register(link);
  };

  return (
    <NavigationContext.Provider value={{ links, registerLink }}>
      {children}
    </NavigationContext.Provider>
  );
};

export const useNavigation = () => {
  const context = useContext(NavigationContext);
  if (context === undefined) {
    throw new Error("useNavigation must be used within a NavigationProvider");
  }
  return context;
};
