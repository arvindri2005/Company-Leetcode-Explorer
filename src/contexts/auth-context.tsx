"use client";

import type { User as FirebaseUser } from "firebase/auth";
import type { AuthContextType } from "@/types";
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { userService } from "@/services/user.service";
import { Logger } from "@/lib/logger";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * @function AuthProvider
 * @description Provides authentication context to its children components.
 * It manages the current user's state, loading status, and profile synchronization with the backend.
 * @param {{ children: ReactNode }} props - The props for the component.
 * @returns {JSX.Element} The provider component.
 */
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  // Initialize loading based on cookie: if cookie exists, assume loading (waiting for firebase), else not loading (definitely logged out)
  const [loading, setLoading] = useState(() => {
    if (typeof window !== "undefined") {
      return document.cookie.includes("auth_status=authenticated");
    }
    return true; // Default to loading on server/SSR
  });
  const [isUserProfileSynced, setIsUserProfileSynced] = useState(false);

  const syncUserProfileIfNeeded = async (firebaseUser: FirebaseUser) => {
    // Only sync if the user is newly authenticated and not yet synced in this session
    // This is a basic check; more robust logic might be needed depending on session handling
    if (firebaseUser && !isUserProfileSynced) {
      try {
        const result = await userService.syncUserProfile(
          firebaseUser.email,
          firebaseUser.displayName,
        );
        if (result.success) {
          // User profile synced successfully
          setIsUserProfileSynced(true);
        } else {
          Logger.error("Failed to sync user profile", result.error, {
            userId: firebaseUser.uid,
          });
        }
      } catch (error) {
        Logger.error("Error calling syncUserProfile action", error, {
          userId: firebaseUser.uid,
        });
      }
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
      
      if (firebaseUser) {
        // Set cookie to indicate user is authenticated
        document.cookie = "auth_status=authenticated; path=/; max-age=2592000; SameSite=Strict"; // 30 days
        
        // Reset sync flag on new auth state if needed, or manage more carefully
        // For simplicity here, we'll attempt sync if user is present.
        // A more robust solution might check a flag in localStorage or Firestore
        // to avoid re-syncing unnecessarily on every page load after login.
        // For now, this will call sync on first load if user is already logged in.
        await syncUserProfileIfNeeded(firebaseUser);
      } else {
         // Remove cookie on logout
        document.cookie = "auth_status=; path=/; max-age=0; SameSite=Strict";
        setIsUserProfileSynced(false); // Reset sync flag on logout
      }
    });

    return () => unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // isUserProfileSynced removed from deps to avoid loop if sync fails

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isUserProfileSynced,
        syncUserProfileIfNeeded,
        setUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

/**
 * @function useAuth
 * @description A custom hook to access the authentication context.
 * It provides an easy way to get the current user, loading state, and other auth-related values.
 * @throws {Error} If used outside of an `AuthProvider`.
 * @returns {AuthContextType} The authentication context.
 */
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
