"use client";

import React, {
  createContext,
  type ReactNode,
  useEffect,
  useMemo,
  useState,
} from "react";

import type { User } from "@supabase/supabase-js";

import { userService } from "@/features/profile/services/user.service";
import { createSupabaseBrowserClient } from "@/shared/lib/api/supabase-browser";
import { Logger } from "@/shared/lib/utils/logger";

import type { AuthContextType } from "../types";

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * @function AuthProvider
 * @description Provides authentication context to its children components using Supabase.
 * It manages the current user's state, loading status, and sessions.
 * @param {{ children: ReactNode }} props - The props for the component.
 * @returns {JSX.Element} The provider component.
 */
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);

  // Sync user profile function (kept for compatibility, though largely handled by DB/callback now)
  const syncUserProfileIfNeeded = async (
    supabaseUser: User,
    force = false,
  ) => {
    if (!supabaseUser) { return; }

    // Logic to upsert user profile if needed
    // In Supabase, we might use a trigger on auth.users -> public.users
    // Or we can manually upsert here
    if (!force) {
        // Simple check or skip if we rely on Triggers
    }

    try {
        // Map Supabase attributes to our internal syncing logic if necessary
        // For now, we mainly ensure the user exists in our public table
        await userService.syncUserProfile(supabaseUser.email || null, supabaseUser.user_metadata.display_name || null);
    } catch (error) {
        Logger.error("Failed to sync user profile", error);
    }
  };

  useEffect(() => {
    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
      if (session?.user) {
          syncUserProfileIfNeeded(session.user);
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false); // Ensure loading is false on any auth change

      if (session?.user) {
        // Optional: Sync user profile to public table on login
         await syncUserProfileIfNeeded(session.user);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
     
  }, [supabase]);

  const value = useMemo(
    () => ({
      user,
      loading,
      syncUserProfileIfNeeded,
      setUser,
    }),
    [user, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
