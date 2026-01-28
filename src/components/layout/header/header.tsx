/**
 * @fileoverview Defines the main header and navigation component for the application.
 *
 * This client-side component renders the site's primary navigation bar. It is
 * responsive, displaying a full horizontal menu on desktop and a collapsible
 * side sheet for mobile. It also dynamically shows authentication-related links
 * (Login/Sign Up or Profile/Logout) based on the user's auth state.
 * 
 * Implements hydration-safe rendering to prevent server-client mismatches.
 */
"use client";
import React, { useCallback, useMemo,useState } from "react";

import Image from "next/image";
import Link from "next/link";
import { usePathname,useRouter } from "next/navigation";

import { Menu } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useHydrationSafe } from "@/hooks/use-hydration-safe";
import { useToast } from "@/hooks/use-toast";
import { auth } from "@/lib/api/firebase";
import { type NavigationItem,navigationRegistry } from "@/lib/config/navigation";
import { useAuth } from "@/providers";

/**
 * Renders the main application header and navigation bar.
 *
 * This component is memoized with `React.memo` for performance optimization. It
 * handles both desktop and mobile navigation layouts. The navigation links are
 * generated dynamically based on the user's authentication status, which is
 * consumed from the `useAuth` context. The mobile menu is implemented using a
 * `Sheet` component that slides in from the side.
 *
 * @returns {JSX.Element} The rendered header component.
 */
const Header = React.memo(function Header() {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const isHydrated = useHydrationSafe();

  // Render a navigation item
  const renderNavItem = useCallback((item: NavigationItem, isMobile: boolean) => {
    // Extensibility Point:
    // Support custom render functions (Slots) for full UI control
    if (item.render) {
        return (
            <React.Fragment key={item.key}>
                {item.render({ user, isLoading: authLoading, isMobile })}
            </React.Fragment>
        );
    }

    const isActive = item.href && pathname === item.href;
    const baseClasses = `text-muted-foreground no-underline hover:text-primary transition-colors duration-300 font-medium flex items-center py-2 border-none bg-transparent cursor-pointer text-base ${item.className || ''}`;
    const mobileClasses = `block py-4 border-b border-border font-bold ${isActive ? "text-primary" : ""}`;

    const className = isMobile ? `${baseClasses} ${mobileClasses}` : baseClasses;

    if (item.href) {
      return (
        <Link
          key={item.key}
          href={item.href}
          className={className}
          onClick={isMobile ? () => setIsMobileMenuOpen(false) : undefined}
          aria-current={isActive ? "page" : undefined}
        >
          {item.label}
        </Link>
      );
    }
    
    // Extensibility Point: 
    // Handle action-based items (like Logout) via the registry's onClick handler,
    // passing the necessary context (router, toast, auth).
    // Render as anchor-like element for consistency with Link components
    if (item.onClick) {
        return (
            <a
                key={item.key}
                role="button"
                tabIndex={0}
                onClick={async (e) => {
                   e.preventDefault();
                   if (auth) {
                     await item.onClick!({ router, toast, auth });
                   } else {
                     console.error("Auth context missing for navigation action");
                   }
                   if (isMobile) {setIsMobileMenuOpen(false);}
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    e.currentTarget.click();
                  }
                }}
                className={className}
            >
                {item.label}
            </a>
        )
    }

    return null;
  }, [pathname, router, toast, user, authLoading]);

  const commonNavLinks = useMemo(
    () =>
      function CommonNavLinks(isMobile = false) {
        const items = navigationRegistry.getItems('main', { user, isLoading: authLoading });
        return (
        <>
            {items.map(item => renderNavItem(item, isMobile))}
        </>
      )},
    [user, authLoading, renderNavItem],
  );

  const authLinks = useMemo(
    () =>
      function AuthLinks(isMobile = false) {
        // Defer auth-specific rendering until after hydration to prevent mismatches
        // This ensures server and initial client render show the same content
        if (!isHydrated || authLoading) {
          // Render consistent loading state that matches between server and client
          return (
            <span 
              className="text-muted-foreground opacity-50 pointer-events-none"
              suppressHydrationWarning
            >
              Loading...
            </span>
          );
        }

        const items = navigationRegistry.getItems('auth', { user, isLoading: authLoading });

        return (
          <>
            {items.map(item => renderNavItem(item, isMobile))}
          </>
        );
      },
    [isHydrated, authLoading, user, renderNavItem],
  );

  return (
    <>
      <nav className="sticky top-0 w-full bg-background/95 backdrop-blur-lg z-50 py-4 transition-all duration-300 ease-in-out border-b border-border">
        <div className="container mx-auto flex justify-between items-center px-8">
          <Link
            href="/"
            className="text-2xl font-bold text-primary no-underline flex items-center gap-2"
          >
            <Image
              src="/icon.png"
              alt="App Icon"
              width={32}
              height={32}
              className="mr-2"
              priority
            />
            Byte To Offer
          </Link>
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {commonNavLinks()}
            {authLinks()}
          </div>
          {/* Mobile Menu Button */}
          <Sheet
            open={isMobileMenuOpen}
            onOpenChange={setIsMobileMenuOpen}
          >
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden text-muted-foreground hover:text-foreground hover:bg-muted"
                aria-label="Open menu"
              >
                <Menu className="w-6 h-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-80">
              <SheetHeader>
                <SheetTitle className="sr-only">Mobile Navigation</SheetTitle>
                <SheetDescription className="sr-only">
                  Navigation menu for accessing app features and authentication.
                </SheetDescription>
              </SheetHeader>
              <div className="flex flex-col mt-6">
                <div className="mobile-nav-section">{commonNavLinks(true)}</div>
                <hr className="my-4 border-border" />
                <div className="mobile-nav-section">{authLinks(true)}</div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </nav>
    </>
  );
});

export default Header;






