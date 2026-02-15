import type { User } from "@supabase/supabase-js";

import { createSupabaseBrowserClient } from "@/shared/lib/api/supabase-browser";
import { Logger } from "@/shared/lib/utils/logger";

import type { AuthServiceResponse } from "../types";

/**
 * @class AuthService
 * @description Handles all authentication-related operations with Supabase
 */
export class AuthService {
  private supabase = createSupabaseBrowserClient();

  /**
   * @description Sign in with Google using Supabase OAuth redirect
   */
  async loginWithGoogle(): Promise<AuthServiceResponse> {
    try {
      const { error } = await this.supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        Logger.error("Google sign-in failed", error);
        return {
          success: false,
          error: "Failed to sign in with Google. Please try again.",
        };
      }

      // OAuth redirects the user — we won't reach this in normal flow
      return { success: true };
    } catch (error) {
      Logger.error("Google sign-in failed", error);
      return {
        success: false,
        error: "Failed to sign in with Google. Please try again.",
      };
    }
  }

  /**
   * @description Update user attributes (e.g., display name, email, password)
   */
  async updateUser(attributes: { data?: { display_name?: string; [key: string]: any } }): Promise<AuthServiceResponse> {
    try {
      const { error } = await this.supabase.auth.updateUser(attributes);

      if (error) {
        Logger.error("Update user failed", error);
        return {
          success: false,
          error: this.mapAuthError(error.message),
        };
      }

      return { success: true };
    } catch (error) {
      Logger.error("Update user failed", error);
      return {
        success: false,
        error: "Failed to update user profile.",
      };
    }
  }

  /**
   * @description Sign in with email and password using Supabase
   */
  async loginWithEmail(
    email: string,
    password: string,
  ): Promise<AuthServiceResponse<User>> {
    try {
      const { data, error } = await this.supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        Logger.error("Email sign-in failed", error);
        return {
          success: false,
          error: this.mapAuthError(error.message),
        };
      }

      return {
        success: true,
        data: data.user,
      };
    } catch (error) {
      Logger.error("Email sign-in failed", error);
      return {
        success: false,
        error: "Failed to sign in. Please try again.",
      };
    }
  }

  /**
   * @description Sign up with email and password using Supabase
   */
  async signUp(
    email: string,
    password: string,
    displayName?: string,
  ): Promise<AuthServiceResponse<User>> {
    try {
      const { data, error } = await this.supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            display_name: displayName,
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        Logger.error("Sign-up failed", error);
        return {
          success: false,
          error: this.mapAuthError(error.message),
        };
      }

      return {
        success: true,
        data: data.user ?? undefined,
      };
    } catch (error) {
      Logger.error("Sign-up failed", error);
      return {
        success: false,
        error: "Failed to create account. Please try again.",
      };
    }
  }

  /**
   * @description Sign out the current user
   */
  async logout(): Promise<AuthServiceResponse> {
    try {
      const { error } = await this.supabase.auth.signOut();

      if (error) {
        Logger.error("Sign out failed", error);
        return {
          success: false,
          error: "Failed to sign out. Please try again.",
        };
      }

      return { success: true };
    } catch (error) {
      Logger.error("Sign out failed", error);
      return {
        success: false,
        error: "Failed to sign out. Please try again.",
      };
    }
  }

  /**
   * @description Send a password reset email
   */
  async resetPassword(email: string): Promise<AuthServiceResponse> {
    try {
      const { error } = await this.supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback?type=recovery`,
      });

      if (error) {
        Logger.error("Password reset failed", error);
        return {
          success: false,
          error: this.mapAuthError(error.message),
        };
      }

      return { success: true };
    } catch (error) {
      Logger.error("Password reset failed", error);
      return {
        success: false,
        error: "Failed to send reset email. Please try again.",
      };
    }
  }

  /**
   * @description Update the user's password (used after password reset redirect)
   */
  async updatePassword(newPassword: string): Promise<AuthServiceResponse> {
    try {
      const { error } = await this.supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        Logger.error("Password update failed", error);
        return {
          success: false,
          error: this.mapAuthError(error.message),
        };
      }

      return { success: true };
    } catch (error) {
      Logger.error("Password update failed", error);
      return {
        success: false,
        error: "Failed to update password. Please try again.",
      };
    }
  }

  /**
   * @description Get the current authenticated user
   */
  async getCurrentUser(): Promise<User | null> {
    const { data } = await this.supabase.auth.getUser();
    return data.user;
  }

  /**
   * @description Map Supabase auth error messages to user-friendly messages
   * @private
   */
  private mapAuthError(message: string): string {
    const lowerMsg = message.toLowerCase();

    if (lowerMsg.includes("invalid login credentials")) {
      return "Invalid email or password. Please try again.";
    }
    if (lowerMsg.includes("email not confirmed")) {
      return "Please verify your email address before signing in.";
    }
    if (lowerMsg.includes("user already registered")) {
      return "An account with this email already exists.";
    }
    if (lowerMsg.includes("password") && lowerMsg.includes("weak")) {
      return "Password is too weak. Please use a stronger password.";
    }
    if (lowerMsg.includes("rate limit") || lowerMsg.includes("too many")) {
      return "Too many attempts. Please try again later.";
    }
    if (lowerMsg.includes("email")) {
      return "Invalid email address. Please check and try again.";
    }

    return "An error occurred. Please try again.";
  }
}

export const authService = new AuthService();
