
'use client';
import './header.css';

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
import React, { useState, useEffect } from 'react';
import { ThemeSwitcher } from '@/components/theme-switcher';
import { checkUserAdminStatus } from '@/app/actions/admin.actions';

const Header = () => {
  const { user, loading: authLoading } = useAuth();
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
      if (auth) {
        await signOut(auth);
        toast({ title: 'Logged Out', description: 'You have been successfully logged out.' });
        setIsUserAdmin(false);
        router.push('/');
      } else {
        toast({ title: 'Logout Failed', description: 'Authentication not initialized.', variant: 'destructive' });
      }
    } catch (error) {
      console.error('Logout error:', error);
      toast({ title: 'Logout Failed', description: 'Could not log you out. Please try again.', variant: 'destructive' });
    }
  };

  const commonNavLinks = (isMobile = false) => (
    <>
      <Link
        href="/companies"
        className={`nav-link ${isMobile ? 'mobile-nav-link font-bold py-3' : ''}`}
        onClick={isMobile ? () => setIsMobileMenuOpen(false) : undefined}
      >
        Explore Companies
      </Link>
      <Link
        href="/submit"
        className={`nav-link ${isMobile ? 'mobile-nav-link font-bold py-3' : ''}`}
        onClick={isMobile ? () => setIsMobileMenuOpen(false) : undefined}
      >
        Submit Problem
      </Link>
      <Link
        href="/add-company"
        className={`nav-link ${isMobile ? 'mobile-nav-link font-bold py-3' : ''}`}
        onClick={isMobile ? () => setIsMobileMenuOpen(false) : undefined}
      >
        Add Company
      </Link>
      {!isAdminStatusLoading && isUserAdmin && (
        <Link
          href="/admin"
          className={`nav-link ${isMobile ? 'mobile-nav-link font-bold py-3' : ''}`}
          onClick={isMobile ? () => setIsMobileMenuOpen(false) : undefined}
        >
          Admin Panel
        </Link>
      )}
    </>
  );

  const authLinks = (isMobile = false) => {
    if (authLoading) {
      return <span className="nav-link">Loading...</span>;
    }

    if (user) {
      return (
        <>
          <Link
            href="/profile"
            className={`nav-link ${isMobile ? 'mobile-nav-link font-bold py-3' : ''}`}
            onClick={isMobile ? () => setIsMobileMenuOpen(false) : undefined}
          >
            Profile
          </Link>
          <button
            onClick={() => { handleLogout(); if(isMobile) setIsMobileMenuOpen(false); }}
            className={`nav-link logout-btn ${isMobile ? 'mobile-nav-link font-bold py-3' : ''}`}
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
          className={`nav-link ${isMobile ? 'mobile-nav-link font-bold py-3' : ''}`}
          onClick={isMobile ? () => setIsMobileMenuOpen(false) : undefined}
        >
          Login
        </Link>
        <Link
          href="/signup"
          className={`nav-link ${isMobile ? 'mobile-nav-link font-bold py-3' : ''}`}
          onClick={isMobile ? () => setIsMobileMenuOpen(false) : undefined}
        >
          Sign Up
        </Link>
      </>
    );
  };

  return (
    <>
      <nav className="navbar">
        <div className="nav-container">
          <Link href="/" className="logo">
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
          <div className="nav-links">
            {commonNavLinks()}
            {authLinks()}
          </div>
          {/* Mobile Menu Button */}
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild>
              <button className="mobile-menu-btn">
                <Menu className="w-6 h-6" />
              </button>
            </SheetTrigger>
            <SheetContent side="right" className="w-80">
              <SheetHeader>
                <SheetTitle>Navigation</SheetTitle>
              </SheetHeader>
              <div className="flex flex-col mt-6">
                <div className="mobile-nav-section">
                  {commonNavLinks(true)}
                </div>
                <hr className="mobile-nav-divider" />
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
};

export default Header;
