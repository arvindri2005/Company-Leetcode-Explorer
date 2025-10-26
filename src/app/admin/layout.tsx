/**
 * @fileoverview Defines the layout and access control for the admin section.
 *
 * This client-side component acts as a protective wrapper for all routes under `/admin`.
 * It checks if the current user is authenticated and has administrative privileges.
 * It displays a loading state during verification, a "denied" message for unauthorized
 * users, and the actual admin content (including a navigation bar) for authorized admins.
 */
"use client";

import React, { useEffect, useState, type ReactNode } from "react";
import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";
import { Loader2, ShieldAlert } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { checkUserAdminStatus } from "@/app/actions/admin.actions";
import { AdminNav } from "@/components/admin/admin-nav";

/**
 * Provides the layout and enforces authorization for the admin dashboard.
 *
 * This component performs the following steps:
 * 1. Checks for an authenticated user. If not found, redirects to the login page.
 * 2. If a user is found, it calls a server action (`checkUserAdminStatus`) to verify their admin rights.
 * 3. While checking, a loading spinner is displayed.
 * 4. If the user is not an admin, it displays an "Access Denied" message and redirects to the homepage.
 * 5. If the user is a verified admin, it renders the admin navigation menu and the specific admin page content (`children`).
 *
 * @param {{ children: React.ReactNode }} props - The props for the component.
 * @param {React.ReactNode} props.children - The specific admin page component to be rendered within the layout.
 * @returns {JSX.Element} The rendered admin layout, a loading indicator, or an access denied screen.
 */
export default function AdminLayout({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    async function verifyAdmin() {
      if (!authLoading) {
        if (!user) {
          toast({
            title: "Access Denied",
            description: "You must be logged in to access the admin area.",
            variant: "destructive",
          });
          router.push("/login?redirectUrl=/admin");
          return;
        }

        const adminStatus = await checkUserAdminStatus(user.uid);
        setIsAdmin(adminStatus);

        if (!adminStatus) {
          toast({
            title: "Unauthorized Access",
            description: "You do not have permission to access this area.",
            variant: "destructive",
          });
          router.push("/");
        }
      }
    }
    verifyAdmin();
  }, [user, authLoading, router, toast]);

  if (authLoading || isAdmin === null) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-lg text-muted-foreground">Verifying access...</p>
      </div>
    );
  }

  if (!user || !isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] text-center p-6">
        <ShieldAlert className="h-16 w-16 text-destructive mb-4" />
        <h1 className="text-2xl font-bold text-destructive mb-2">
          Access Denied
        </h1>
        <p className="text-muted-foreground mb-6">
          You are not authorized to view this page. If you believe this is an
          error, please contact support.
        </p>
        <Button asChild>
          <Link href="/">Go to Homepage</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <AdminNav />
      </div>
      {children}
    </div>
  );
}
