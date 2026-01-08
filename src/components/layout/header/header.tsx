/**
 * @fileoverview Defines the main header and navigation component for the application.
 *
 * This client-side component renders the site's primary navigation bar. It is
 * responsive, displaying a full horizontal menu on desktop and a collapsible
 * side sheet for mobile. It also dynamically shows authentication-related links
 * (Login/Sign Up or Profile/Logout) based on the user's auth state.
 */
"use client";
import Link from "next/link";
import Image from "next/image";
import { Menu } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { auth } from "@/lib/api/firebase";
import { useToast } from "@/hooks/use-toast";
import { useRouter, usePathname } from "next/navigation";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import React, { useState, useCallback, useMemo } from "react";
import { navigationRegistry, NavigationItem } from "@/lib/config/navigation";

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
    if (item.onClick) {
        return (
            <button
                key={item.key}
                onClick={async () => {
                   if (auth) {
                     await item.onClick!({ router, toast, auth });
                   } else {
                     console.error("Auth context missing for navigation action");
                   }
                   if (isMobile) setIsMobileMenuOpen(false);
                }}
                className={className}
            >
                {item.label}
            </button>
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
        if (authLoading) {
          return <span className="text-muted-foreground">Loading...</span>;
        }

        const items = navigationRegistry.getItems('auth', { user, isLoading: authLoading });

        return (
          <>
            {items.map(item => renderNavItem(item, isMobile))}
          </>
        );
      },
    [authLoading, user, renderNavItem],
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






