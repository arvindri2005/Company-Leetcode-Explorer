/**
 * User Mapper Module
 *
 * Provides static methods to convert between the three user representations:
 *   - **SupabaseUserRow** — snake_case DB row (what Supabase returns/accepts)
 *   - **User (domain entity)** — core business object with camelCase fields
 *   - **UserDTO** — serialisable transfer object for API responses / client
 *
 * All mapping is deterministic and side-effect-free.
 *
 * @module user-mapper
 */

import { User, type UserPreferences } from "@/core/domain/entities/user.entity";
import { type UserDTO } from "@/features/profile/types/user-dto";
import { Logger } from "@/shared/lib/utils/logger";

/**
 * Represents a raw row from the Supabase `users` table.
 * Field names use snake_case to match the DB column naming convention.
 */
export interface SupabaseUserRow {
  uid: string;
  email: string | null;
  display_name: string | null;
  photo_url: string | null;
  preferences: UserPreferences | null;
  created_at: string;
  updated_at: string;
  /** ISO timestamp of the last auth-provider profile sync */
  last_synced_at?: string;
}

/** @deprecated Alias for backward compatibility — prefer SupabaseUserRow */
export type UserDocument = SupabaseUserRow;

/**
 * Static mapper class for converting between User representations.
 *
 * Direction summary:
 *   Supabase row  →  toDomain()  →  User entity
 *   User entity   →  toDTO()     →  UserDTO
 *   User entity   →  toRow()     →  Supabase row
 *   Supabase row  →  rowToDTO()  →  UserDTO  (shortcut, skips entity)
 */
export class UserMapper {
  /**
   * Convert a Supabase row to a domain User entity.
   *
   * Handles null coalescing for optional fields (email, display_name,
   * photo_url, preferences) so the domain entity always has safe defaults.
   *
   * @param row - The raw Supabase user row
   * @returns A hydrated User domain entity
   */
  static toDomain(row: SupabaseUserRow): User {
    Logger.debug("[UserMapper.toDomain] Mapping Supabase row → User entity", { uid: row.uid });

    return new User(
      {
        email: row.email ?? "",
        displayName: row.display_name ?? "",
        photoUrl: row.photo_url ?? undefined,
        preferences: row.preferences ?? {},
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at),
      },
      row.uid
    );
  }

  /**
   * Convert a domain User entity to a serialisable DTO.
   *
   * Dates are converted to ISO strings for JSON transport.
   *
   * @param user - The domain User entity
   * @returns A plain UserDTO object
   */
  static toDTO(user: User): UserDTO {
    Logger.debug("[UserMapper.toDTO] Mapping User entity → UserDTO", { uid: user.id });

    return {
      uid: user.id,
      email: user.email ?? "",
      displayName: user.displayName ?? "",
      photoUrl: user.photoUrl,
      preferences: user.preferences,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    };
  }

  /**
   * Convert a domain User entity to a Supabase row for insertion/update.
   *
   * Ensures all fields conform to the DB schema's expected types
   * (null instead of undefined for nullable columns).
   *
   * @param user - The domain User entity
   * @returns A SupabaseUserRow ready for insert/upsert
   */
  static toRow(user: User): SupabaseUserRow {
    Logger.debug("[UserMapper.toRow] Mapping User entity → Supabase row", { uid: user.id });

    return {
      uid: user.id,
      email: user.email,
      display_name: user.displayName,
      photo_url: user.photoUrl ?? null,
      preferences: user.preferences,
      created_at: user.createdAt.toISOString(),
      updated_at: user.updatedAt.toISOString(),
      last_synced_at: user.lastSyncedAt?.toISOString(),
    };
  }

  /**
   * Convert a Supabase row directly to a DTO (shortcut).
   *
   * Useful when you don't need a full domain entity and want to avoid
   * the overhead of creating an intermediate User instance.
   *
   * @param row - The raw Supabase user row
   * @returns A plain UserDTO object
   */
  static rowToDTO(row: SupabaseUserRow): UserDTO {
    Logger.debug("[UserMapper.rowToDTO] Mapping Supabase row → UserDTO (direct)", { uid: row.uid });

    return {
      uid: row.uid,
      email: row.email ?? "",
      displayName: row.display_name ?? "",
      photoUrl: row.photo_url ?? undefined,
      preferences: row.preferences ?? {},
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}
