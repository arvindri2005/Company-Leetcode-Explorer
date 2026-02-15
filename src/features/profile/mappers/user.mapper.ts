import { User, type UserPreferences } from "@/core/domain/entities/user.entity";
import { type UserDTO } from "@/features/profile/types/user-dto";
// import type { Database } from "@/types/supabase"; // Types not found, skipping for now

// Define Supabase User Row type locally if not imported
export interface SupabaseUserRow {
  uid: string;
  email: string | null;
  display_name: string | null;
  photo_url: string | null;
  preferences: UserPreferences | null;
  created_at: string;
  updated_at: string;
  last_synced_at?: string;
}

export type UserDocument = SupabaseUserRow;

export class UserMapper {
  static toDomain(row: SupabaseUserRow): User {
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

  static toDTO(user: User): UserDTO {
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

  static toRow(user: User): SupabaseUserRow {
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

  static rowToDTO(row: SupabaseUserRow): UserDTO {
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
