/**
 * User Operations Module
 * Handles core user CRUD operations
 */

import {
  deleteDoc,
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";

import { User as UserEntity } from "@/domain/entities/user.entity";
import { auth, db } from "@/lib/api/firebase";
import { Logger } from "@/lib/utils/logger";

import type {
  CreateUserDTO,
  UpdateUserDTO,
} from "../../interfaces/user.repository.interface";
import { type UserDocument, UserMapper } from "../../mappers/user.mapper";

/**
 * Interface for user operations
 */
export interface UserOperations {
  /**
   * Find a user by their unique identifier
   */
  findById(id: string): Promise<UserEntity | null>;

  /**
   * Save a new user
   */
  save(data: CreateUserDTO): Promise<UserEntity>;

  /**
   * Update an existing user
   */
  update(id: string, data: UpdateUserDTO): Promise<UserEntity>;

  /**
   * Delete a user by their unique identifier
   */
  delete(id: string): Promise<void>;

  /**
   * Check if a user exists by their unique identifier
   */
  exists(id: string): Promise<boolean>;

  /**
   * Update user's display name
   */
  updateUserDisplayName(
    userId: string,
    newDisplayName: string
  ): Promise<{ success: boolean; error?: string }>;

  /**
   * Sync user profile from authentication provider
   */
  syncUserProfile(
    email: string | null,
    displayName: string | null
  ): Promise<{ success: boolean; error?: string }>;
}

/**
 * Implementation of user operations
 */
export class UserOperationsImpl implements UserOperations {
  /**
   * Find a user by their unique identifier
   * @param id - The user's unique identifier (uid)
   * @returns The User entity if found, null otherwise
   */
  async findById(id: string): Promise<UserEntity | null> {
    if (!id) {
      return null;
    }
    try {
      const userDocRef = doc(db, "users", id);
      const docSnap = await getDoc(userDocRef);

      if (!docSnap.exists()) {
        return null;
      }

      const data = docSnap.data();

      // Security: Check authorization
      const currentUser = auth.currentUser;
      const isOwner = currentUser && currentUser.uid === id;

      // Create "Public Profile" view for non-owners
      // If the requester is not the owner, we strip sensitive fields
      const email = isOwner ? (data.email ?? null) : null;
      const preferences = isOwner ? data.preferences : {};

      const userDoc: UserDocument = {
        uid: docSnap.id,
        email: email,
        displayName: data.displayName ?? null,
        photoUrl: data.photoUrl,
        preferences: preferences,
        lastSyncedAt: data.lastSyncedAt?.toDate?.() ?? data.lastSyncedAt,
        createdAt: data.createdAt?.toDate?.() ?? data.createdAt,
      };

      return UserMapper.toDomain(userDoc);
    } catch (error) {
      Logger.error("Error fetching user by ID", error, { id });
      return null;
    }
  }

  /**
   * Save a new user
   * @param data - The data to create the user with
   * @returns The created User entity
   */
  async save(data: CreateUserDTO): Promise<UserEntity> {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error("User is not authenticated");
      }

      if (data.displayName) {
        // Security: Validate display name to prevent stored XSS or injection
        if (/[<>]/.test(data.displayName)) {
          throw new Error("Display name contains invalid characters.");
        }
      }

      const uid = currentUser.uid;
      const userDocRef = doc(db, "users", uid);

      const userData = {
        uid,
        email: data.email,
        displayName: data.displayName,
        photoUrl: data.photoUrl,
        preferences: data.preferences ?? {},
        createdAt: serverTimestamp(),
        lastSyncedAt: serverTimestamp(),
      };

      await setDoc(userDocRef, userData);

      return UserEntity.create(
        {
          email: data.email,
          displayName: data.displayName,
          photoUrl: data.photoUrl,
          preferences: data.preferences ?? {},
          lastSyncedAt: new Date(),
        },
        uid
      );
    } catch (error) {
      Logger.error("Error saving user", error);
      throw error;
    }
  }

  /**
   * Update an existing user
   * @param id - The user's unique identifier
   * @param data - The data to update
   * @returns The updated User entity
   */
  async update(id: string, data: UpdateUserDTO): Promise<UserEntity> {
    try {
      const userDocRef = doc(db, "users", id);

      const updates: Record<string, unknown> = {};
      if (data.email !== undefined) {
        updates.email = data.email;
      }
      if (data.displayName !== undefined) {
        if (data.displayName && /[<>]/.test(data.displayName)) {
          throw new Error("Display name contains invalid characters.");
        }
        updates.displayName = data.displayName;
      }
      if (data.photoUrl !== undefined) {
        updates.photoUrl = data.photoUrl;
      }
      if (data.preferences !== undefined) {
        updates.preferences = data.preferences;
      }
      updates.lastSyncedAt = serverTimestamp();

      await updateDoc(userDocRef, updates);

      const updatedUser = await this.findById(id);
      if (!updatedUser) {
        throw new Error("User not found after update");
      }

      return updatedUser;
    } catch (error) {
      Logger.error("Error updating user", error, { id });
      throw error;
    }
  }

  /**
   * Delete a user by their unique identifier
   * @param id - The user's unique identifier
   */
  async delete(id: string): Promise<void> {
    try {
      const userDocRef = doc(db, "users", id);
      await deleteDoc(userDocRef);
    } catch (error) {
      Logger.error("Error deleting user", error, { id });
      throw error;
    }
  }

  /**
   * Check if a user exists by their unique identifier
   * @param id - The user's unique identifier
   * @returns True if the user exists, false otherwise
   */
  async exists(id: string): Promise<boolean> {
    if (!id) {
      return false;
    }
    try {
      const userDocRef = doc(db, "users", id);
      const docSnap = await getDoc(userDocRef);
      return docSnap.exists();
    } catch (error) {
      Logger.error("Error checking user existence", error, { id });
      return false;
    }
  }

  /**
   * Update user's display name
   * @param userId - The user's unique identifier
   * @param newDisplayName - The new display name
   * @returns Result indicating success or error
   */
  async updateUserDisplayName(
    userId: string,
    newDisplayName: string
  ): Promise<{ success: boolean; error?: string }> {
    if (!userId) {
      return { success: false, error: "User ID is required." };
    }

    const trimmedName = newDisplayName ? newDisplayName.trim() : "";

    if (trimmedName.length < 2) {
      return {
        success: false,
        error: "Display name must be at least 2 characters.",
      };
    }
    if (trimmedName.length > 50) {
      return {
        success: false,
        error: "Display name must be less than 50 characters.",
      };
    }

    // Security: Validate display name to prevent stored XSS or injection
    if (/[<>]/.test(trimmedName)) {
      Logger.warn("Blocked attempt to set display name with invalid characters", {
        userId,
        displayName: trimmedName,
      });
      return {
        success: false,
        error: "Display name contains invalid characters.",
      };
    }

    const userDocRef = doc(db, "users", userId);
    try {
      await updateDoc(userDocRef, { displayName: trimmedName });
      return { success: true };
    } catch (error) {
      // Security: Return generic error message to prevent leaking internal details
      Logger.error("Error updating user display name in Firestore", error);
      return {
        success: false,
        error: "An unexpected error occurred while updating display name.",
      };
    }
  }

  /**
   * Sync user profile from authentication provider
   * @param email - The user's email
   * @param displayName - The user's display name
   * @returns Result indicating success or error
   */
  async syncUserProfile(
    email: string | null,
    displayName: string | null
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Security: Always derive UID from the authenticated session
      const currentUser = auth.currentUser;
      if (!currentUser) {
        return { success: false, error: "User is not authenticated." };
      }
      const uid = currentUser.uid;

      const userDocRef = doc(db, "users", uid);

      const updates: Record<string, unknown> = {
        uid,
        lastSyncedAt: serverTimestamp(),
      };

      // Security: Prioritize authenticated email if available
      if (currentUser.email) {
        updates.email = currentUser.email;
      } else if (email) {
        // Fallback to provided email only if auth email is unavailable (e.g. phone auth)
        updates.email = email;
      }

      if (displayName) {
        // Security: Sanitize display name
        let safeName = displayName.trim();
        // Truncate if too long (max 50 chars to match updateUserDisplayName limit)
        if (safeName.length > 50) {
          safeName = safeName.substring(0, 50);
        }

        // Security: Remove invalid characters
        if (/[<>]/.test(safeName)) {
          safeName = safeName.replace(/[<>]/g, "");
        }

        if (safeName.length > 0) {
          updates.displayName = safeName;
        }
      }

      // We use setDoc with merge: true which creates if not exists, or updates if exists.
      await setDoc(userDocRef, updates, { merge: true });

      return { success: true };
    } catch (error) {
      // Security: Return generic error message to prevent leaking internal details
      Logger.error("Error syncing user profile to Firestore", error);
      return {
        success: false,
        error: "An unexpected error occurred while syncing user profile.",
      };
    }
  }
}
