
'use client'; 

import Link from 'next/link';
import Image from 'next/image';
import { PlusSquare, Building, LogIn, UserPlus, User, LogOut, Menu, Search, ShieldCheck } from 'lucide-react'; 
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/auth-context';
import { auth } from '@/lib/firebase';
import { signOut } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'; 
import React, { useState, useEffect } from 'react'; // Added React and useEffect
import { ThemeSwitcher } from '@/components/theme-switcher'; 
import { checkUserAdminStatus } from '@/app/actions/admin.actions'; // Import the admin check action

const Header = () => {
  const { user, loading: authLoading } = useAuth(); // Renamed loading to authLoading for clarity
  const { toast } = useToast();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserAdmin, setIsUserAdmin] = useState(false);
  const [isAdminStatusLoading, setIsAdminStatusLoading] = useState(true);

  useEffect(() => {
    const fetchAdminStatus = async () => {
      if (user && !authLoading) {
        setIsAdminStatusLoading(true);
        const adminStatus = await checkUserAdminStatus(user.uid);
        setIsUserAdmin(adminStatus);
        setIsAdminStatusLoading(false);
      } else if (!user && !authLoading) {
        setIsUserAdmin(false);
        setIsAdminStatusLoading(false);
      }
    };
    fetchAdminStatus();
  }, [user, authLoading]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast({ title: 'Logged Out', description: 'You have been successfully logged out.' });
      setIsUserAdmin(false); // Reset admin status on logout
      router.push('/'); 
    } catch (error) {
      console.error('Logout error:', error);
      toast({ title: 'Logout Failed', description: 'Could not log you out. Please try again.', variant: 'destructive' });
    }
  };

  const commonNavLinks = (isMobile = false) => (
    <>
      <Button asChild variant="ghost" size={isMobile ? "default" : "sm"} className={isMobile ? "w-full justify-start text-base py-3" : ""} onClick={isMobile ? () => setIsMobileMenuOpen(false) : undefined}>
        <Link href="/companies">
          <Search className={isMobile ? "mr-2 h-5 w-5" : "mr-1 h-4 w-4"} />
          Explore Companies
        </Link>
      </Button>
      <Button asChild variant="ghost" size={isMobile ? "default" : "sm"} className={isMobile ? "w-full justify-start text-base py-3" : ""} onClick={isMobile ? () => setIsMobileMenuOpen(false) : undefined}>
        <Link href="/submit-problem">
          <PlusSquare className={isMobile ? "mr-2 h-5 w-5" : "mr-1 h-4 w-4"} />
          Submit Problem
        </Link>
      </Button>
      <Button asChild variant="ghost" size={isMobile ? "default" : "sm"} className={isMobile ? "w-full justify-start text-base py-3" : ""} onClick={isMobile ? () => setIsMobileMenuOpen(false) : undefined}>
        <Link href="/add-company">
          <Building className={isMobile ? "mr-2 h-5 w-5" : "mr-1 h-4 w-4"} />
          Add Company
        </Link>
      </Button>
      {!isAdminStatusLoading && isUserAdmin && ( // Only show if user is admin and status is loaded
         <Button asChild variant="ghost" size={isMobile ? "default" : "sm"} className={isMobile ? "w-full justify-start text-base py-3 font-semibold text-primary" : "font-semibold text-primary"} onClick={isMobile ? () => setIsMobileMenuOpen(false) : undefined}>
          <Link href="/admin">
            <ShieldCheck className={isMobile ? "mr-2 h-5 w-5" : "mr-1 h-4 w-4"} />
            Admin Panel
          </Link>
        </Button>
      )}
    </>
  );

  const authLinks = (isMobile = false) => {
    if (authLoading) {
      return <Button variant="ghost" size={isMobile ? "default" : "sm"} disabled className={`opacity-50 ${isMobile ? "w-full justify-start text-base py-3" : ""}`}>Loading...</Button>;
    }
    if (user) {
      return (
        <>
          <Button asChild variant="ghost" size={isMobile ? "default" : "sm"} className={isMobile ? "w-full justify-start text-base py-3" : ""} onClick={isMobile ? () => setIsMobileMenuOpen(false) : undefined}>
            <Link href="/profile">
              <User className={isMobile ? "mr-2 h-5 w-5" : "mr-1 h-4 w-4"} />
              Profile
            </Link>
          </Button>
          <Button variant="ghost" size={isMobile ? "default" : "sm"} className={isMobile ? "w-full justify-start text-base py-3" : ""} onClick={() => { handleLogout(); if(isMobile) setIsMobileMenuOpen(false); }}>
            <LogOut className={isMobile ? "mr-2 h-5 w-5" : "mr-1 h-4 w-4"} />
            Logout
          </Button>
        </>
      );
    }
    return (
      <>
        <Button asChild variant="ghost" size={isMobile ? "default" : "sm"} className={isMobile ? "w-full justify-start text-base py-3" : ""} onClick={isMobile ? () => setIsMobileMenuOpen(false) : undefined}>
          <Link href="/login">
            <LogIn className={isMobile ? "mr-2 h-5 w-5" : "mr-1 h-4 w-4"} />
            Login
          </Link>
        </Button>
        <Button asChild variant="ghost" size={isMobile ? "default" : "sm"} className={isMobile ? "w-full justify-start text-base py-3" : ""} onClick={isMobile ? () => setIsMobileMenuOpen(false) : undefined}>
          <Link href="/signup">
            <UserPlus className={isMobile ? "mr-2 h-5 w-5" : "mr-1 h-4 w-4"} />
            Sign Up
          </Link>
        </Button>
      </>
    );
  };

  return (
    <header className="bg-card border-b border-border shadow-sm sticky top-0 z-40">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 text-xl font-semibold text-primary hover:text-primary/80 transition-colors mr-auto lg:mr-4 min-w-0">
          <Image 
            src="/favicon.ico" 
            alt="Logo" 
            width={28}
            height={28}
            className="flex-shrink-0 rounded"
            priority
          />
          <span className="truncate hidden sm:inline">Company Interview Problem Explorer</span>
          <span className="truncate sm:hidden">Interview Problem Explorer</span>
        </Link>
        
        <nav className="hidden lg:flex items-center gap-1 p-1">
          {commonNavLinks()}
          {authLinks()}
          <ThemeSwitcher />
        </nav>

        <div className="lg:hidden flex items-center gap-2">
          <ThemeSwitcher />
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Open menu">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[280px] p-0 flex flex-col">
              <SheetHeader className="p-4 border-b">
                <SheetTitle asChild>
                  <Link 
                    href="/" 
                    className="flex items-center gap-2 text-lg font-semibold text-primary" 
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                     <Image 
                        src="/favicon.ico" 
                        alt="Logo" 
                        width={28} 
                        height={28} 
                        className="flex-shrink-0 rounded"
                      />
                    <span>Interview Problem Explorer</span>
                  </Link>
                </SheetTitle>
              </SheetHeader>
              <nav className="flex-grow p-4 space-y-2 overflow-y-auto">
                {commonNavLinks(true)}
                <hr className="my-3 border-border/50" />
                {authLinks(true)}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
};

export default Header;
