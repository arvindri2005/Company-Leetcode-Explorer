
'use client';

import type { User as FirebaseUser } from 'firebase/auth';
import type { AuthContextType } from '@/types';
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { syncUserProfile as syncUserProfileAction } from '@/app/actions'; // Server action

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [isUserProfileSynced, setIsUserProfileSynced] = useState(false);


  const syncUserProfileIfNeeded = async (firebaseUser: FirebaseUser) => {
    // Only sync if the user is newly authenticated and not yet synced in this session
    // This is a basic check; more robust logic might be needed depending on session handling
    if (firebaseUser && !isUserProfileSynced) {
      try {
        const result = await syncUserProfileAction({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
        });
        if (result.success) {
          // User profile synced successfully
          setIsUserProfileSynced(true);
        } else {
          console.error('Failed to sync user profile:', result.error);
        }
      } catch (error) {
        console.error('Error calling syncUserProfile action:', error);
      }
    }
  };


  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
      if (firebaseUser) {
        // Reset sync flag on new auth state if needed, or manage more carefully
        // For simplicity here, we'll attempt sync if user is present.
        // A more robust solution might check a flag in localStorage or Firestore 
        // to avoid re-syncing unnecessarily on every page load after login.
        // For now, this will call sync on first load if user is already logged in.
        await syncUserProfileIfNeeded(firebaseUser);
      } else {
        setIsUserProfileSynced(false); // Reset sync flag on logout
      }
    });

    return () => unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // isUserProfileSynced removed from deps to avoid loop if sync fails

  return (
    <AuthContext.Provider value={{ user, loading, isUserProfileSynced, syncUserProfileIfNeeded }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
