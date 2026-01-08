import { 
  signInWithPopup, 
  signOut, 
  GoogleAuthProvider,
  User as FirebaseUser 
} from "firebase/auth";
import { auth } from "@/lib/api/firebase";
import { userService } from "@/services/user.service";
import { Logger } from "@/lib/utils/logger";
import type { AuthServiceResponse } from "../types";

/**
 * @class AuthService
 * @description Handles all authentication-related operations with Firebase
 */
export class AuthService {
  private googleProvider: GoogleAuthProvider;

  constructor() {
    this.googleProvider = new GoogleAuthProvider();
  }

  /**
   * @description Sign in with Google using Firebase popup
   */
  async loginWithGoogle(): Promise<AuthServiceResponse<FirebaseUser>> {
    try {
      const result = await signInWithPopup(auth, this.googleProvider);
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
        error: error instanceof Error ? error.message : "Failed to sign in with Google",
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
        document.cookie = "auth_status=; path=/; max-age=0; SameSite=Strict";
      }

      return {
        success: true,
      };
    } catch (error) {
      Logger.error("Sign out failed", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to sign out",
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

      if (!result.success) {
        Logger.error("Failed to sync user profile", result.error, {
          userId: firebaseUser.uid,
        });
      }

      return result;
    } catch (error) {
      Logger.error("Error calling syncUserProfile", error, {
        userId: firebaseUser.uid,
      });
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to sync user profile",
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






