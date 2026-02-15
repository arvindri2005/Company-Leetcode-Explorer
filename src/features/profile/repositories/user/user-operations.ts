/**
 * User Operations Module
 * Handles core user CRUD operations
 */

import { User as UserEntity } from "@/core/domain/entities/user.entity";
import { createSupabaseBrowserClient } from "@/shared/lib/api/supabase-browser";
import { Logger } from "@/shared/lib/utils/logger";

import type {
  CreateUserDTO,
  UpdateUserDTO,
} from "../../interfaces/user.repository.interface";
import { type SupabaseUserRow,UserMapper } from "../../mappers/user.mapper";

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
  private supabase = createSupabaseBrowserClient();

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
      const { data, error } = await this.supabase
        .from("users")
        .select("*")
        .eq("uid", id)
        .single();

      if (error || !data) {
        // PGRST116 code indicates 0 rows returned for single()
        if (error?.code !== "PGRST116") {
            Logger.error("Error fetching user by ID", error, { id });
        }
        return null;
      }
    
      return UserMapper.toDomain(data);
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
      const { data: { user: currentUser } } = await this.supabase.auth.getUser();
      if (!currentUser) {
        throw new Error("User is not authenticated");
      }

      if (data.displayName) {
        // Security: Validate display name to prevent stored XSS or injection
        if (/[<>]/.test(data.displayName)) {
          throw new Error("Display name contains invalid characters.");
        }
      }

      const uid = currentUser.id;
      
      const userEntity = UserEntity.create(
        {
          email: data.email,
          displayName: data.displayName,
          photoUrl: data.photoUrl,
          preferences: data.preferences ?? {},
        },
        uid
      );

      const row = UserMapper.toRow(userEntity);

      const { error } = await this.supabase
        .from("users")
        .insert(row);

      if (error) {
        throw new Error(error.message);
      }

      return userEntity;
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
      const updates: Partial<SupabaseUserRow> = {
        updated_at: new Date().toISOString(),
      };

      if (data.email !== undefined) {updates.email = data.email;}
      if (data.displayName !== undefined) {
         if (data.displayName && /[<>]/.test(data.displayName)) {
           throw new Error("Display name contains invalid characters.");
         }
         updates.display_name = data.displayName;
      }
      if (data.photoUrl !== undefined) {updates.photo_url = data.photoUrl;}
      if (data.preferences !== undefined) {updates.preferences = data.preferences;}

      const { error } = await this.supabase
        .from("users")
        .update(updates)
        .eq("uid", id);

      if (error) {
        throw new Error(error.message);
      }

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
      const { error } = await this.supabase
        .from("users")
        .delete()
        .eq("uid", id);

      if (error) {
        throw new Error(error.message);
      }
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
       const { count, error } = await this.supabase
        .from("users")
        .select("uid", { count: "exact", head: true })
        .eq("uid", id);
      
      if (error) {
           return false;
      }
      return (count ?? 0) > 0;
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

    try {
      const { error } = await this.supabase
        .from("users")
        .update({ display_name: trimmedName, updated_at: new Date().toISOString() })
        .eq("uid", userId);

      if (error) {
          throw new Error(error.message);
      }
      return { success: true };
    } catch (error) {
      Logger.error("Error updating user display name in Supabase", error);
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
      const { data: { user: currentUser } } = await this.supabase.auth.getUser();
      if (!currentUser) {
        return { success: false, error: "User is not authenticated." };
      }
      const uid = currentUser.id;

      const updates: Partial<SupabaseUserRow> = {
        uid,
        last_synced_at: new Date().toISOString(),
      };

      // Only update fields if they are provided/changed? 
      // Upsert will handle create or update.
      // We want to ensure specific fields are set.
      
      if (currentUser.email) {
        updates.email = currentUser.email;
      } else if (email) {
        updates.email = email;
      }

      if (displayName) {
        let safeName = displayName.trim();
        if (safeName.length > 50) {
          safeName = safeName.substring(0, 50);
        }
        if (/[<>]/.test(safeName)) {
          safeName = safeName.replace(/[<>]/g, "");
        }
        if (safeName.length > 0) {
          updates.display_name = safeName;
        }
      }
      
      // Upsert: Create if not exists, update if exists
      // We do NOT update created_at, but we update last_synced_at
      const { error } = await this.supabase
        .from("users")
        .upsert(updates, { onConflict: "uid" });

      if (error) {
          throw new Error(error.message);
      }

      return { success: true };
    } catch (error) {
      Logger.error("Error syncing user profile to Supabase", error);
      return {
        success: false,
        error: "An unexpected error occurred while syncing user profile.",
      };
    }
  }
}
