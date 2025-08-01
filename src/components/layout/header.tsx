
'use client';
import Link from 'next/link';
import Image from 'next/image';
import { Menu } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { auth } from '@/lib/firebase';
import { signOut } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import React, { useState, useCallback, useMemo } from 'react';

const Header = React.memo(() => {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = useCallback(async () => {
    try {
      if (auth) {
        await signOut(auth);
        toast({ title: 'Logged Out', description: 'You have been successfully logged out.' });
        router.push('/');
      } else {
        toast({ title: 'Logout Failed', description: 'Authentication not initialized.', variant: 'destructive' });
      }
    } catch (error) {
      console.error('Logout error:', error);
      toast({ title: 'Logout Failed', description: 'Could not log you out. Please try again.', variant: 'destructive' });
    }
  }, [toast, router]);

  const commonNavLinks = useMemo(() => (isMobile = false) => (
      <>
          <Link
              href="/companies"
              className={`text-gray-200 no-underline hover:text-teal-400 transition-colors duration-300 font-medium flex items-center py-2 border-none bg-transparent cursor-pointer text-base ${
                  isMobile ? "block py-4 border-b border-gray-200/10 font-bold text-teal-400" : ""
              }`}
              onClick={isMobile ? () => setIsMobileMenuOpen(false) : undefined}
          >
              Explore Companies
          </Link>
          <Link
              href="/job-applications"
              className={`text-gray-200 no-underline hover:text-teal-400 transition-colors duration-300 font-medium flex items-center py-2 border-none bg-transparent cursor-pointer text-base ${
                  isMobile ? "block py-4 border-b border-gray-200/10 font-bold" : ""
              }`}
              onClick={isMobile ? () => setIsMobileMenuOpen(false) : undefined}
          >
              Job Applications
          </Link>
          <Link
              href="/submit-problem"
              className={`text-gray-200 no-underline hover:text-teal-400 transition-colors duration-300 font-medium flex items-center py-2 border-none bg-transparent cursor-pointer text-base ${
                  isMobile ? "block py-4 border-b border-gray-200/10 font-bold" : ""
              }`}
              onClick={isMobile ? () => setIsMobileMenuOpen(false) : undefined}
          >
              Submit Problem
          </Link>
          <Link
              href="/add-company"
              className={`text-gray-200 no-underline hover:text-teal-400 transition-colors duration-300 font-medium flex items-center py-2 border-none bg-transparent cursor-pointer text-base ${
                  isMobile ? "block py-4 border-b border-gray-200/10 font-bold" : ""
              }`}
              onClick={isMobile ? () => setIsMobileMenuOpen(false) : undefined}
          >
              Add Company
          </Link>
      </>
  ), []);

  const authLinks = useMemo(() => (isMobile = false) => {
    if (authLoading) {
      return <span className="text-gray-200">Loading...</span>;
    }

    if (user) {
      return (
        <>
          <Link
            href="/profile"
            className={`text-gray-200 no-underline hover:text-teal-400 transition-colors duration-300 font-medium flex items-center py-2 border-none bg-transparent cursor-pointer text-base ${isMobile ? 'block py-4 border-b border-gray-200/10 font-bold' : ''}`}
            onClick={isMobile ? () => setIsMobileMenuOpen(false) : undefined}
          >
            Profile
          </Link>
          <button
            onClick={() => { handleLogout(); if(isMobile) setIsMobileMenuOpen(false); }}
            className={`text-gray-200 no-underline hover:text-teal-400 transition-colors duration-300 font-medium flex items-center py-2 border-none bg-transparent cursor-pointer text-base ${isMobile ? 'block py-4 border-b border-gray-200/10 font-bold' : ''}`}
          >
            Logout
          </button>
        </>
      );
    }

    return (
      <>
        <Link
          href="/login"
          className={`text-gray-200 no-underline hover:text-teal-400 transition-colors duration-300 font-medium flex items-center py-2 border-none bg-transparent cursor-pointer text-base ${isMobile ? 'block py-4 border-b border-gray-200/10 font-bold' : ''}`}
          onClick={isMobile ? () => setIsMobileMenuOpen(false) : undefined}
        >
          Login
        </Link>
        <Link
          href="/signup"
          className={`text-gray-200 no-underline hover:text-teal-400 transition-colors duration-300 font-medium flex items-center py-2 border-none bg-transparent cursor-pointer text-base ${isMobile ? 'block py-4 border-b border-gray-200/10 font-bold' : ''}`}
          onClick={isMobile ? () => setIsMobileMenuOpen(false) : undefined}
        >
          Sign Up
        </Link>
      </>
    );
  }, [authLoading, user, handleLogout]);

  return (
    <>
      <nav className="fixed top-0 w-full bg-opacity-95 bg-gray-900 backdrop-blur-lg z-50 py-4 transition-all duration-300 ease-in-out border-b border-gray-200/10">
        <div className="container mx-auto flex justify-between items-center px-8">
          <Link href="/" className="text-2xl font-bold text-teal-400 no-underline flex items-center gap-2">
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
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen} modal={false}>
            <SheetTrigger asChild>
              <button className="md:hidden bg-transparent border-none text-gray-200 cursor-pointer p-2">
                <Menu className="w-6 h-6" />
              </button>
            </SheetTrigger>
            <SheetContent side="right" className="w-80">
              <div className="flex flex-col mt-6">
                <div className="mobile-nav-section">
                  {commonNavLinks(true)}
                </div>
                <hr className="my-4 border-gray-200/10" />
                <div className="mobile-nav-section">
                  {authLinks(true)}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </nav>
    </>
  );
});

export default Header;
