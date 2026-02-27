/**
 * User Operations Module
 *
 * Provides core CRUD operations for user entities backed by Supabase.
 * All methods follow a consistent pattern:
 *   1. Validate inputs (guard clauses)
 *   2. Execute Supabase query
 *   3. Map results via UserMapper
 *   4. Log debug info on entry/success and errors on failure
 *
 * @module user-operations
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
 * Interface for user operations.
 * Defines the contract for all user-related data access methods.
 */
export interface UserOperations {
  /** Find a user by their unique identifier (Supabase auth uid) */
  findById(id: string): Promise<UserEntity | null>;

  /** Persist a new user record */
  save(data: CreateUserDTO): Promise<UserEntity>;

  /** Partially update an existing user record */
  update(id: string, data: UpdateUserDTO): Promise<UserEntity>;

  /** Permanently delete a user record */
  delete(id: string): Promise<void>;

  /** Check whether a user record exists without fetching full data */
  exists(id: string): Promise<boolean>;

  /** Update only the display name of a user (with validation) */
  updateUserDisplayName(
    userId: string,
    newDisplayName: string
  ): Promise<{ success: boolean; error?: string }>;

  /** Upsert user profile data from the authentication provider */
  syncUserProfile(
    email: string | null,
    displayName: string | null
  ): Promise<{ success: boolean; error?: string }>;
}

/**
 * Supabase-backed implementation of {@link UserOperations}.
 *
 * Each public method includes debug-level logging at key decision points
 * to aid in tracing request flow without polluting production logs.
 */
export class UserOperationsImpl implements UserOperations {
  private supabase = createSupabaseBrowserClient();

  /**
   * Find a user by their unique identifier.
   *
   * Uses `.single()` which returns PGRST116 when 0 rows match — this is
   * expected for first-time visitors and is silently handled.
   *
   * @param id - The user's uid (from Supabase Auth)
   * @returns The User entity if found, null otherwise
   */
  async findById(id: string): Promise<UserEntity | null> {
    if (!id) {
      Logger.debug("[UserOps.findById] Skipped — empty id provided");
      return null;
    }

    Logger.debug("[UserOps.findById] Looking up user", { id });

    try {
      const { data, error } = await this.supabase
        .from("users")
        .select("*")
        .eq("uid", id)
        .single();

      if (error || !data) {
        // PGRST116 = "0 rows returned for .single()" — not a real error,
        // just means the user hasn't been created yet.
        if (error?.code !== "PGRST116") {
            Logger.error("[UserOps.findById] Supabase query failed", error, { id });
        } else {
            Logger.info("[UserOps.findById] No user row found (first visit?)", { id });
        }
        return null;
      }

      Logger.info("[UserOps.findById] User found, mapping to domain entity", { 
        id, 
        email: data.email, 
        hasDisplayName: !!data.display_name,
        hasPreferences: !!data.preferences
      });
      return UserMapper.toDomain(data);
    } catch (error) {
      Logger.error("[UserOps.findById] Unexpected error", error, { id });
      return null;
    }
  }

  /**
   * Save a new user to the database.
   *
   * Requires an authenticated session — the uid is taken from the current
   * Supabase auth user, NOT from the DTO, to prevent impersonation.
   *
   * @param data - The data to create the user with
   * @returns The created User entity
   * @throws If authentication fails or Supabase insert fails
   */
  async save(data: CreateUserDTO): Promise<UserEntity> {
    Logger.debug("[UserOps.save] Attempting to create new user", {
      email: data.email,
      hasDisplayName: !!data.displayName,
    });

    try {
      // Retrieve the currently authenticated user to get the uid
      const { data: { user: currentUser } } = await this.supabase.auth.getUser();
      if (!currentUser) {
        Logger.warn("[UserOps.save] No authenticated user found — aborting create");
        throw new Error("User is not authenticated");
      }

      // Security: Reject display names containing angle brackets to prevent
      // stored XSS when the name is rendered in the UI
      if (data.displayName) {
        if (/[<>]/.test(data.displayName)) {
          Logger.warn("[UserOps.save] Display name rejected — contains HTML characters", {
            displayName: data.displayName,
          });
          throw new Error("Display name contains invalid characters.");
        }
      }

      const uid = currentUser.id;
      Logger.debug("[UserOps.save] Auth user resolved", { uid });

      // Create the domain entity (applies business rules, sets defaults)
      const userEntity = UserEntity.create(
        {
          email: data.email,
          displayName: data.displayName,
          photoUrl: data.photoUrl,
          preferences: data.preferences ?? {},
        },
        uid
      );

      // Map domain entity → Supabase row format
      const row = UserMapper.toRow(userEntity);

      const { error } = await this.supabase
        .from("users")
        .insert(row);

      if (error) {
        Logger.error("[UserOps.save] Supabase insert failed", error, { uid });
        throw new Error(error.message);
      }

      Logger.info("[UserOps.save] User created successfully", { uid });
      return userEntity;
    } catch (error) {
      Logger.error("[UserOps.save] Failed to save user", error);
      throw error;
    }
  }

  /**
   * Update an existing user record.
   *
   * Only fields present in the DTO are updated; undefined fields are skipped.
   * After the update, the full user is re-fetched to return the latest state.
   *
   * @param id - The user's uid
   * @param data - Partial update data
   * @returns The updated User entity
   * @throws If the update fails or the user is not found post-update
   */
  async update(id: string, data: UpdateUserDTO): Promise<UserEntity> {
    Logger.debug("[UserOps.update] Updating user", {
      id,
      fields: Object.keys(data).filter((k) => data[k as keyof UpdateUserDTO] !== undefined),
    });

    try {
      // Build a partial row with only the fields that were explicitly provided
      const updates: Partial<SupabaseUserRow> = {
        updated_at: new Date().toISOString(),
      };

      if (data.email !== undefined) {updates.email = data.email;}
      if (data.displayName !== undefined) {
         // Security: Validate display name before persisting
         if (data.displayName && /[<>]/.test(data.displayName)) {
           Logger.warn("[UserOps.update] Display name rejected — contains HTML characters", { id });
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
        Logger.error("[UserOps.update] Supabase update failed", error, { id });
        throw new Error(error.message);
      }

      // Re-fetch the full user to return the merged/updated record
      const updatedUser = await this.findById(id);
      if (!updatedUser) {
        Logger.error("[UserOps.update] User not found after successful update", undefined, { id });
        throw new Error("User not found after update");
      }

      Logger.debug("[UserOps.update] User updated successfully", { id });
      return updatedUser;
    } catch (error) {
      Logger.error("[UserOps.update] Failed to update user", error, { id });
      throw error;
    }
  }

  /**
   * Delete a user by their uid.
   *
   * This performs a hard delete — the row is permanently removed.
   * RLS policies should ensure only the owner can delete their own record.
   *
   * @param id - The user's uid
   * @throws If the delete operation fails
   */
  async delete(id: string): Promise<void> {
    Logger.debug("[UserOps.delete] Deleting user", { id });

    try {
      const { error } = await this.supabase
        .from("users")
        .delete()
        .eq("uid", id);

      if (error) {
        Logger.error("[UserOps.delete] Supabase delete failed", error, { id });
        throw new Error(error.message);
      }

      Logger.info("[UserOps.delete] User deleted successfully", { id });
    } catch (error) {
      Logger.error("[UserOps.delete] Failed to delete user", error, { id });
      throw error;
    }
  }

  /**
   * Check if a user exists by uid.
   *
   * Uses a `head: true` count query for efficiency — no row data is
   * transferred, only the count.
   *
   * @param id - The user's uid
   * @returns True if the user exists, false otherwise
   */
  async exists(id: string): Promise<boolean> {
    if (!id) {
      Logger.debug("[UserOps.exists] Skipped — empty id provided");
      return false;
    }

    Logger.debug("[UserOps.exists] Checking user existence", { id });

    try {
       const { count, error } = await this.supabase
        .from("users")
        .select("uid", { count: "exact", head: true })
        .eq("uid", id);
      
      if (error) {
          Logger.warn("[UserOps.exists] Supabase count query failed", { id }, error);
          return false;
      }

      const userExists = (count ?? 0) > 0;
      Logger.debug("[UserOps.exists] Result", { id, exists: userExists });
      return userExists;
    } catch (error) {
      Logger.error("[UserOps.exists] Unexpected error", error, { id });
      return false;
    }
  }

  /**
   * Update a user's display name with full validation.
   *
   * Validation rules:
   *   - Must be between 2 and 50 characters (trimmed)
   *   - Must not contain `<` or `>` characters (XSS prevention)
   *
   * @param userId - The user's uid
   * @param newDisplayName - The new display name
   * @returns Result indicating success or a validation/server error
   */
  async updateUserDisplayName(
    userId: string,
    newDisplayName: string
  ): Promise<{ success: boolean; error?: string }> {
    if (!userId) {
      Logger.debug("[UserOps.updateDisplayName] Skipped — empty userId");
      return { success: false, error: "User ID is required." };
    }

    const trimmedName = newDisplayName ? newDisplayName.trim() : "";
    Logger.debug("[UserOps.updateDisplayName] Validating new display name", {
      userId,
      nameLength: trimmedName.length,
    });

    // --- Validation checks ---
    if (trimmedName.length < 2) {
      Logger.debug("[UserOps.updateDisplayName] Name too short", { userId, nameLength: trimmedName.length });
      return {
        success: false,
        error: "Display name must be at least 2 characters.",
      };
    }
    if (trimmedName.length > 50) {
      Logger.debug("[UserOps.updateDisplayName] Name too long", { userId, nameLength: trimmedName.length });
      return {
        success: false,
        error: "Display name must be less than 50 characters.",
      };
    }

    // Security: Block angle brackets to prevent stored XSS
    if (/[<>]/.test(trimmedName)) {
      Logger.warn("[UserOps.updateDisplayName] Blocked XSS attempt in display name", {
        userId,
        displayName: trimmedName,
      });
      return {
        success: false,
        error: "Display name contains invalid characters.",
      };
    }

    try {
      Logger.debug("[UserOps.updateDisplayName] Persisting new display name", { userId });

      const { error } = await this.supabase
        .from("users")
        .update({ display_name: trimmedName, updated_at: new Date().toISOString() })
        .eq("uid", userId);

      if (error) {
          Logger.error("[UserOps.updateDisplayName] Supabase update failed", error, { userId });
          throw new Error(error.message);
      }

      Logger.info("[UserOps.updateDisplayName] Display name updated successfully", { userId });
      return { success: true };
    } catch (error) {
      Logger.error("[UserOps.updateDisplayName] Unexpected error", error, { userId });
      return {
        success: false,
        error: "An unexpected error occurred while updating display name.",
      };
    }
  }

  /**
   * Sync user profile data from the authentication provider.
   *
   * Uses an upsert (INSERT ... ON CONFLICT UPDATE) on the `uid` column so
   * that first-time users get a row created and returning users get their
   * profile refreshed.
   *
   * The email is sourced from Supabase Auth first, falling back to the
   * provided email parameter. Display names are sanitized (trimmed, capped
   * at 50 chars, angle brackets stripped).
   *
   * @param email - The user's email (fallback if not available from auth)
   * @param displayName - The user's display name from the auth provider
   * @returns Result indicating success or error
   */
  async syncUserProfile(
    email: string | null,
    displayName: string | null
  ): Promise<{ success: boolean; error?: string }> {
    Logger.debug("[UserOps.syncProfile] Starting profile sync", {
      hasEmail: !!email,
      hasDisplayName: !!displayName,
    });

    try {
      // Retrieve the current auth user to get the uid
      const { data: { user: currentUser } } = await this.supabase.auth.getUser();
      if (!currentUser) {
        Logger.warn("[UserOps.syncProfile] No authenticated user — cannot sync profile");
        return { success: false, error: "User is not authenticated." };
      }
      const uid = currentUser.id;
      Logger.debug("[UserOps.syncProfile] Auth user resolved", { uid });

      // Build the upsert payload
      const updates: Partial<SupabaseUserRow> = {
        uid,
        last_synced_at: new Date().toISOString(),
      };

      // Prefer the email from Supabase Auth (most authoritative source)
      if (currentUser.email) {
        updates.email = currentUser.email;
      } else if (email) {
        updates.email = email;
      }

      // Sanitize the display name to prevent XSS and enforce length limits
      if (displayName) {
        let safeName = displayName.trim();
        if (safeName.length > 50) {
          Logger.debug("[UserOps.syncProfile] Display name truncated to 50 chars", { uid });
          safeName = safeName.substring(0, 50);
        }
        if (/[<>]/.test(safeName)) {
          Logger.debug("[UserOps.syncProfile] Stripped angle brackets from display name", { uid });
          safeName = safeName.replace(/[<>]/g, "");
        }
        if (safeName.length > 0) {
          updates.display_name = safeName;
        }
      }

      Logger.debug("[UserOps.syncProfile] Upserting user row", {
        uid,
        fieldsSet: Object.keys(updates),
      });

      // Upsert: create the row if it doesn't exist, update if it does.
      // `onConflict: "uid"` targets the unique constraint on the uid column.
      const { error } = await this.supabase
        .from("users")
        .upsert(updates, { onConflict: "uid" });

      if (error) {
          Logger.error("[UserOps.syncProfile] Supabase upsert failed", error, { uid });
          throw new Error(error.message);
      }

      Logger.info("[UserOps.syncProfile] Profile synced successfully", { uid });
      return { success: true };
    } catch (error) {
      Logger.error("[UserOps.syncProfile] Unexpected error during profile sync", error);
      return {
        success: false,
        error: "An unexpected error occurred while syncing user profile.",
      };
    }
  }
}
