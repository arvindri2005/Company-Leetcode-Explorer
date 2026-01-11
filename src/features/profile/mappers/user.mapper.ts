/**
 * User Mapper
 *
 * Handles conversions between:
 * - Domain entities (User)
 * - DTOs (UserProfile type from types)
 * - Firestore documents
 */

import { User as UserEntity } from "@/domain/entities/user.entity";
import type { UserProfile } from "@/types";

/**
 * Firestore document structure for users
 */
export interface UserDocument {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoUrl?: string;
  preferences?: {
    theme?: "light" | "dark" | "system";
    emailNotifications?: boolean;
    weeklyDigest?: boolean;
  };
  lastSyncedAt?: Date;
  createdAt?: Date;
}

/**
 * Maps between User domain entity and various data representations
 */
export class UserMapper {
  /**
   * Convert a Firestore document to a domain User entity
   * @param doc - The Firestore document data
   * @returns User domain entity
   */
  static toDomain(doc: UserDocument): UserEntity {
    return UserEntity.create(
      {
        email: doc.email,
        displayName: doc.displayName,
        photoUrl: doc.photoUrl,
        preferences: doc.preferences ?? {},
        lastSyncedAt: doc.lastSyncedAt,
      },
      doc.uid
    );
  }

  /**
   * Convert a domain User entity to a UserProfile DTO
   * @param entity - The User domain entity
   * @returns UserProfile DTO
   */
  static toDTO(entity: UserEntity): UserProfile {
    return {
      uid: entity.id,
      email: entity.email,
      displayName: entity.displayName,
      createdAt: entity.createdAt,
      lastSyncedAt: entity.lastSyncedAt,
    };
  }

  /**
   * Convert a domain User entity to a Firestore document
   * @param entity - The User domain entity
   * @returns Firestore document data (without uid as it's the doc ID)
   */
  static toDocument(entity: UserEntity): Omit<UserDocument, "uid"> {
    return {
      email: entity.email,
      displayName: entity.displayName,
      photoUrl: entity.photoUrl,
      preferences: entity.preferences,
      lastSyncedAt: entity.lastSyncedAt,
      createdAt: entity.createdAt,
    };
  }

  /**
   * Convert a UserProfile DTO to a domain User entity
   * Useful when receiving data from external sources
   * @param dto - The UserProfile DTO
   * @returns User domain entity
   */
  static fromDTO(dto: UserProfile): UserEntity {
    return UserEntity.create(
      {
        email: dto.email,
        displayName: dto.displayName,
        lastSyncedAt: dto.lastSyncedAt,
      },
      dto.uid
    );
  }

  /**
   * Convert a Firestore document to a UserProfile DTO
   * Direct conversion without going through domain entity
   * @param doc - The Firestore document data
   * @returns UserProfile DTO
   */
  static documentToDTO(doc: UserDocument): UserProfile {
    return {
      uid: doc.uid,
      email: doc.email,
      displayName: doc.displayName,
      createdAt: doc.createdAt ?? new Date(),
      lastSyncedAt: doc.lastSyncedAt,
    };
  }
}
