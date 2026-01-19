import { 
  GoogleAuthProvider,
  signInWithPopup, 
  signOut, 
  type User as FirebaseUser 
} from "firebase/auth";

import { userService } from "@/features/profile/services/user.service";
import { auth } from "@/lib/api/firebase";
import { Logger } from "@/lib/utils/logger";

import type { AuthServiceResponse } from "../types";

/**
 * @class AuthService
 * @description Handles all authentication-related operations with Firebase
 */
export class AuthService {
  private googleProvider: GoogleAuthProvider | null = null;

  /**
   * @description Get or initialize the Google Auth Provider
   * @private
   */
  private getGoogleProvider(): GoogleAuthProvider {
    if (!this.googleProvider) {
      this.googleProvider = new GoogleAuthProvider();
    }
    return this.googleProvider;
  }

  /**
   * @description Sign in with Google using Firebase popup
   */
  async loginWithGoogle(): Promise<AuthServiceResponse<FirebaseUser>> {
    try {
      const result = await signInWithPopup(auth, this.getGoogleProvider());
      const user = result.user;

      // Sync user profile after successful login
      await this.syncUserProfile(user);

      return {
        success: true,
        data: user,
      };
    } catch (error) {
      Logger.error("Google sign-in failed", error);
      return {
        success: false,
        error: "Failed to sign in with Google. Please try again.",
      };
    }
  }

  /**
   * @description Sign out the current user
   */
  async logout(): Promise<AuthServiceResponse> {
    try {
      await signOut(auth);
      
      // Clear auth cookie
      if (typeof window !== "undefined") {
        document.cookie = "auth_status=; path=/; max-age=0; SameSite=Strict; Secure";
      }

      return {
        success: true,
      };
    } catch (error) {
      Logger.error("Sign out failed", error);
      return {
        success: false,
        error: "Failed to sign out. Please try again.",
      };
    }
  }

  /**
   * @description Sync user profile with backend
   */
  async syncUserProfile(firebaseUser: FirebaseUser | null): Promise<AuthServiceResponse> {
    if (!firebaseUser) {
      return {
        success: false,
        error: "No user to sync",
      };
    }

    try {
      const result = await userService.syncUserProfile(
        firebaseUser.email,
        firebaseUser.displayName
      );

      if (!result.isSuccess) {
        Logger.error("Failed to sync user profile", result.error, {
          userId: firebaseUser.uid,
        });
        return {
          success: false,
          error: "Failed to sync user profile. Please try again.",
        };
      }

      return {
        success: true,
      };
    } catch (error) {
      Logger.error("Error calling syncUserProfile", error, {
        userId: firebaseUser.uid,
      });
      return {
        success: false,
        error: "Failed to sync user profile. Please try again.",
      };
    }
  }

  /**
   * @description Get the current authenticated user
   */
  getCurrentUser(): FirebaseUser | null {
    return auth.currentUser;
  }
}

export const authService = new AuthService();






