import { User } from "firebase/auth";

export type NavigationPosition = "main" | "auth" | "mobile-bottom";

export interface NavigationContext {
  user: User | null;
  isLoading: boolean;
}

export interface NavigationItem {
  key: string;
  label: string;
  href?: string;
  onClick?: (router: any) => void; // router instance might be needed for logout redirect
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

// Logout is special because it has an onClick.
// We'll handle the onClick logic in the registration,
// or maybe we need a way to inject dependencies like 'signOut' and 'toast'.
// For now, the Header component defines handleLogout.
// To fully decouple, we might need an 'action' registry, but for now
// let's allow passing a custom onClick or handling specific keys in the component.
// OR, we can just register it here, but the implementation of 'onClick'
// needs access to app-specific 'auth' and 'router'.
//
// A better pattern for 'Logout' might be to keep it hardcoded IF it's deeply integrated,
// OR allow the registry to hold the callback if we initialize it in a client component.
//
// Since 'navigationRegistry' is a static singleton, we can't easily put runtime hooks in it
// unless we register them at runtime.
//
// Let's stick to 'Profile' here. 'Logout' is often a permanent fixture of auth.
// However, I can register a placeholder for Logout and let the component hydration fill it? No that's complex.
//
// Let's keep Logout hardcoded in the 'Auth' section of Header for now,
// OR register it from a "useNavigation" hook that initializes the registry with context-aware items.
//
// Let's go with a static registry for LINKS, but for Actions it might be tricky.
// actually, I can register the Logout item, but the 'onClick' won't be serializable if this was server-side.
// But this is client-side.
//
// However, imports like 'firebase/auth' are fine in this file.
// The issue is 'useRouter' hook.
//
// Solution: The NavigationRegistry will just hold the definition.
// For Logout, we can use a special 'type': 'button' and 'action': 'logout'.
// But I want to be generic.
//
// Let's stick to: The registry holds the *structure*.
// For the specific case of Logout, it relies on `auth` which is global.
// `router` needs to be passed in.
