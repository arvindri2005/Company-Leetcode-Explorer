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
import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";
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
import { navigationRegistry, NavigationItem } from "@/lib/navigation-registry";

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

  const handleLogout = useCallback(async () => {
    try {
      if (auth) {
        await signOut(auth);
        toast({
          title: "Logged Out",
          description: "You have been successfully logged out.",
        });
        router.push("/");
      } else {
        toast({
          title: "Logout Failed",
          description: "Authentication not initialized.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Logout error:", error);
      toast({
        title: "Logout Failed",
        description: "Could not log you out. Please try again.",
        variant: "destructive",
      });
    }
  }, [toast, router]);

  // Render a navigation item
  const renderNavItem = useCallback((item: NavigationItem, isMobile: boolean) => {
    const isActive = item.href && pathname === item.href;
    const baseClasses = `text-gray-200 no-underline hover:text-teal-400 transition-colors duration-300 font-medium flex items-center py-2 border-none bg-transparent cursor-pointer text-base ${item.className || ''}`;
    const mobileClasses = `block py-4 border-b border-gray-200/10 font-bold ${isActive ? "text-teal-400" : ""}`;

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
    
    // If no href, maybe it's a button with onClick?
    // Not currently used by standard registry items, but good for extensibility.
    if (item.onClick) {
        return (
            <button
                key={item.key}
                onClick={() => {
                   item.onClick!(router);
                   if (isMobile) setIsMobileMenuOpen(false);
                }}
                className={className}
            >
                {item.label}
            </button>
        )
    }

    return null;
  }, [pathname, router]);

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
          return <span className="text-gray-200">Loading...</span>;
        }

        const items = navigationRegistry.getItems('auth', { user, isLoading: authLoading });

        return (
          <>
            {items.map(item => renderNavItem(item, isMobile))}
            
            {/* 
              Logout is handled separately because it requires specific local state/context 
              that is hard to inject into the static registry (router, toast).
              Ideally, we would register a "Logout" action that delegates to this component,
              but for now, hardcoding the logout button alongside dynamic auth links is acceptable.
              It appears only when user is logged in.
             */}
            {user && (
              <button
                onClick={() => {
                  handleLogout();
                  if (isMobile) setIsMobileMenuOpen(false);
                }}
                className={`text-gray-200 no-underline hover:text-teal-400 transition-colors duration-300 font-medium flex items-center py-2 border-none bg-transparent cursor-pointer text-base focus-visible:ring-2 focus-visible:ring-teal-400 focus:outline-none rounded-md ${
                  isMobile
                    ? "block py-4 border-b border-gray-200/10 font-bold"
                    : ""
                }`}
              >
                Logout
              </button>
            )}
          </>
        );
      },
    [authLoading, user, handleLogout, renderNavItem],
  );

  return (
    <>
      <nav className="sticky top-0 w-full bg-opacity-95 bg-gray-900 backdrop-blur-lg z-50 py-4 transition-all duration-300 ease-in-out border-b border-gray-200/10">
        <div className="container mx-auto flex justify-between items-center px-8">
          <Link
            href="/"
            className="text-2xl font-bold text-teal-400 no-underline flex items-center gap-2"
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
                className="md:hidden text-gray-200 hover:text-white hover:bg-white/10"
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
                <hr className="my-4 border-gray-200/10" />
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
