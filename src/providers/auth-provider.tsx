/**
 * @fileoverview Provides authentication context wrapper for the application.
 *
 * This component wraps the application with the authentication provider from the
 * auth feature. It re-exports the provider for convenience and backwards compatibility.
 */
"use client";

export { AuthProvider, AuthContext } from "@/features/auth/context/auth-context";
export { useAuth } from "@/features/auth/hooks/use-auth";
