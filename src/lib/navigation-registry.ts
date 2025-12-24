
export interface NavigationLink {
  href: string;
  label: string;
  priority?: number; // Lower priority = appears earlier (default sort)
  isVisible?: () => boolean;
}

class NavigationRegistry {
  private links: NavigationLink[] = [];
  private listeners: (() => void)[] = [];

  constructor() {
    // Default links
    this.register({ href: "/companies", label: "Explore Companies", priority: 10 });
    this.register({ href: "/problems", label: "Problems", priority: 20 });
  }

  register(link: NavigationLink) {
    if (!link || !link.href || !link.label) {
      console.warn("Attempted to register invalid navigation link:", link);
      return;
    }

    // Prevent duplicates based on href
    if (this.links.some(l => l.href === link.href)) {
       console.warn(`Navigation link with href "${link.href}" already exists. Skipping.`);
       return;
    }

    this.links.push(link);
    this.links.sort((a, b) => (a.priority ?? 0) - (b.priority ?? 0));
    this.notifyListeners();
  }

  getLinks(): NavigationLink[] {
    return this.links.filter(link => !link.isVisible || link.isVisible());
  }

  subscribe(listener: () => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener());
  }
}

export const navigationRegistry = new NavigationRegistry();
