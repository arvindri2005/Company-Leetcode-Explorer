/**
 * @fileoverview Defines the navigation menu component for the admin dashboard.
 *
 * This client-side component renders the main navigation links for the admin
 * section of the application. It uses the `usePathname` hook to highlight the
 * currently active link.
 */
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

/**
 * An array of navigation link objects for the admin section.
 * Each object contains the href and the display label for a link.
 */
const adminNavLinks = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/bulk-add-companies", label: "Bulk Add Companies" },
  { href: "/admin/bulk-add-problems", label: "Bulk Add Problems" },
  { href: "/admin/contact-messages", label: "Contact Messages" },
];

/**
 * Renders the primary navigation bar for the admin dashboard.
 *
 * This component maps over the `adminNavLinks` array to create a list of
 * navigation links. It dynamically applies styling to indicate the current
 * active page based on the URL pathname.
 *
 * @returns {JSX.Element} The rendered navigation component.
 */
export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="flex items-center space-x-4 lg:space-x-6">
      {adminNavLinks.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className={cn(
            "text-sm font-medium transition-colors hover:text-primary",
            pathname === link.href ? "text-primary" : "text-muted-foreground",
          )}
        >
          {link.label}
        </Link>
      ))}
    </nav>
  );
}
