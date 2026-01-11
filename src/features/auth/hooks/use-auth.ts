import { useContext } from "react";

import { AuthContext } from "@/features/auth/context/auth-context";

import type { AuthContextType } from "../types";

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






