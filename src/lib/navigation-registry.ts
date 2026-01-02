import { User } from "firebase/auth";
import { Auth } from "firebase/auth";
import type { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import type { ToastFunction } from "@/hooks/use-toast";
import React from "react";

export type NavigationPosition = "main" | "auth" | "mobile-bottom";

export interface NavigationContext {
  user: User | null;
  isLoading: boolean;
}

export interface NavigationActionContext {
  router: AppRouterInstance;
  toast: ToastFunction;
  auth: Auth;
}

export interface NavigationRenderContext extends NavigationContext {
  isMobile: boolean;
}

export interface NavigationItem {
  key: string;
  label: string;
  href?: string;
  onClick?: (context: NavigationActionContext) => void | Promise<void>; 
  render?: (context: NavigationRenderContext) => React.ReactNode;
  position: NavigationPosition;
  order?: number;
  isVisible?: (context: NavigationContext) => boolean;
  className?: string; // Allow custom styling extensions
}

class NavigationRegistry {
  private items: NavigationItem[] = [];

  register(item: NavigationItem) {
    // Prevent duplicates by key
    const existingIndex = this.items.findIndex((i) => i.key === item.key);
    if (existingIndex >= 0) {
        this.items[existingIndex] = item;
    } else {
        this.items.push(item);
    }
  }

  unregister(key: string) {
    this.items = this.items.filter((i) => i.key !== key);
  }

  getItems(position: NavigationPosition, context: NavigationContext): NavigationItem[] {
    return this.items
      .filter((item) => item.position === position)
      .filter((item) => (item.isVisible ? item.isVisible(context) : true))
      .sort((a, b) => (a.order || 0) - (b.order || 0));
  }
}

export const navigationRegistry = new NavigationRegistry();

// Initialize default navigation items
// This mimics "core" logic registering its own items
navigationRegistry.register({
  key: "companies",
  label: "Explore Companies",
  href: "/companies",
  position: "main",
  order: 10,
});

navigationRegistry.register({
  key: "problems",
  label: "Problems",
  href: "/problems",
  position: "main",
  order: 20,
});

// Auth items are dynamic, so we'll register them with isVisible checks
navigationRegistry.register({
  key: "login",
  label: "Login",
  href: "/login",
  position: "auth",
  order: 10,
  isVisible: ({ user, isLoading }) => !isLoading && !user,
});

navigationRegistry.register({
  key: "signup",
  label: "Sign Up",
  href: "/signup",
  position: "auth",
  order: 20,
  isVisible: ({ user, isLoading }) => !isLoading && !user,
});

navigationRegistry.register({
  key: "profile",
  label: "Profile",
  href: "/profile",
  position: "auth",
  order: 10,
  isVisible: ({ user, isLoading }) => !isLoading && !!user,
});

// We can now safely register Logout here, as the handler will receive dependencies at runtime
navigationRegistry.register({
  key: "logout",
  label: "Logout",
  position: "auth",
  order: 100,
  isVisible: ({ user, isLoading }) => !isLoading && !!user,
  onClick: async ({ auth, router, toast }) => {
    // Dynamic import to avoid circular dependencies if any, though firebase/auth is safe
    const { signOut } = await import("firebase/auth"); 
    try {
      if (auth) {
        await signOut(auth);
        toast.success("Logged Out", "You have been successfully logged out.");
        router.push("/");
      } else {
        toast.error("Logout Failed", "Authentication not initialized.");
      }
    } catch (error) {
      console.error("Logout error:", error);
      toast.error("Logout Failed", "Could not log you out. Please try again.");
    }
  },
});
