
'use client';

import React, { useEffect, useState, type ReactNode } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';
import { Loader2, ShieldAlert } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { checkUserAdminStatus } from '@/app/actions/admin.actions';

export default function AdminLayout({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null); // null for loading, true/false for status

  useEffect(() => {
    async function verifyAdmin() {
      if (!authLoading) {
        if (!user) {
          toast({
            title: 'Access Denied',
            description: 'You must be logged in to access the admin area.',
            variant: 'destructive',
          });
          router.push('/login?redirectUrl=/admin');
          return;
        }

        // Check admin status from Firestore
        const adminStatus = await checkUserAdminStatus(user.uid);
        setIsAdmin(adminStatus);

        if (!adminStatus) {
          toast({
            title: 'Unauthorized Access',
            description: 'You do not have permission to access this area.',
            variant: 'destructive',
          });
          router.push('/');
        }
      }
    }
    verifyAdmin();
  }, [user, authLoading, router, toast]);

  if (authLoading || isAdmin === null) { // Show loading if auth is loading OR admin check is pending
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-lg text-muted-foreground">Verifying access...</p>
      </div>
    );
  }

  if (!user || !isAdmin) { // Fallback if redirect hasn't fired or for stricter rendering
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] text-center p-6">
        <ShieldAlert className="h-16 w-16 text-destructive mb-4" />
        <h1 className="text-2xl font-bold text-destructive mb-2">Access Denied</h1>
        <p className="text-muted-foreground mb-6">
          You are not authorized to view this page. If you believe this is an error, please contact support or ensure your UID is in the 'admins' collection in Firestore.
        </p>
        <Button asChild>
          <Link href="/">Go to Homepage</Link>
        </Button>
      </div>
    );
  }

  return <>{children}</>;
}
