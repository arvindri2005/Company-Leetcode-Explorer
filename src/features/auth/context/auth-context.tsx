"use client";

import React, {
  createContext,
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import type { User as FirebaseUser } from "firebase/auth";
import { onAuthStateChanged } from "firebase/auth";

import { auth } from "@/lib/api/firebase";
import { Logger } from "@/lib/utils/logger";

import { authService } from "../services/auth.service";
import type { AuthContextType } from "../types";

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * @function AuthProvider
 * @description Provides authentication context to its children components.
 * It manages the current user's state, loading status, and profile synchronization with the backend.
 * @param {{ children: ReactNode }} props - The props for the component.
 * @returns {JSX.Element} The provider component.
 */
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  // Always initialize loading to true for consistent SSR/client initial render
  // This ensures server and client render the same initial state
  const [loading, setLoading] = useState(true);
  
  const syncUserProfileIfNeeded = useCallback(
    async (firebaseUser: FirebaseUser, force = false) => {
      if (!firebaseUser) {
        return;
      }

      const result = await authService.syncUserProfile(firebaseUser, force);

      if (!result.success) {
        Logger.error("Failed to sync user profile", result.error, {
          userId: firebaseUser.uid,
        });
      }
    },
    [],
  );

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);

      if (firebaseUser) {
        // Set cookie to indicate user is authenticated
        document.cookie =
          "auth_status=authenticated; path=/; max-age=2592000; SameSite=Strict; Secure"; // 30 days

        // Reset sync flag on new auth state if needed, or manage more carefully
        // For simplicity here, we'll attempt sync if user is present.
        // A more robust solution might check a flag in localStorage or Firestore
        // to avoid re-syncing unnecessarily on every page load after login.
        // For now, this will call sync on first load if user is already logged in.
        await syncUserProfileIfNeeded(firebaseUser);
      } else {
        // Remove cookie on logout
        document.cookie =
          "auth_status=; path=/; max-age=0; SameSite=Strict; Secure";
      }
    });

    return () => unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // isUserProfileSynced removed from deps to avoid loop if sync fails

  // Memoize the context value to prevent unnecessary re-renders in consumers
  const value = useMemo(
    () => ({
      user,
      loading,
      syncUserProfileIfNeeded,
      setUser,
    }),
    [user, loading, syncUserProfileIfNeeded],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};






