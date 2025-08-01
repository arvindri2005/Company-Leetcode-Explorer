
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const adminNavLinks = [
    { href: "/admin", label: "Dashboard" },
    { href: "/admin/bulk-add-companies", label: "Bulk Add Companies" },
    { href: "/admin/bulk-add-problems", label: "Bulk Add Problems" },
    { href: "/admin/contact-messages", label: "Contact Messages" },
];

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
                        pathname === link.href ? "text-primary" : "text-muted-foreground"
                    )}
                >
                    {link.label}
                </Link>
            ))}
        </nav>
    );
}
