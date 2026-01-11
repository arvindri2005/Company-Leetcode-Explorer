/**
 * Contact Mapper
 *
 * Handles conversions between:
 * - Domain entities (Contact)
 * - DTOs (ContactDTO)
 * - Firestore documents
 */

import { Contact as ContactEntity } from "@/domain/entities/contact.entity";

/**
 * Contact status type
 */
export type ContactStatus = "pending" | "read" | "replied" | "archived";

/**
 * Firestore document structure for contacts
 */
export interface ContactDocument {
  id: string;
  name: string;
  email: string;
  message: string;
  status: ContactStatus;
  repliedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Contact DTO for API responses
 */
export interface ContactDTO {
  id: string;
  name: string;
  email: string;
  message: string;
  status: ContactStatus;
  repliedAt?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Maps between Contact domain entity and various data representations
 */
export class ContactMapper {
  /**
   * Convert a Firestore document to a domain Contact entity
   * @param doc - The Firestore document data
   * @returns Contact domain entity
   */
  static toDomain(doc: ContactDocument): ContactEntity {
    // Create entity with existing data, preserving status and timestamps
    const entity = ContactEntity.create(
      {
        name: doc.name,
        email: doc.email,
        message: doc.message,
      },
      doc.id
    );

    // Update status if not pending (since create() defaults to pending)
    if (doc.status === "read") {
      entity.markAsRead();
    } else if (doc.status === "replied") {
      entity.markAsReplied();
    } else if (doc.status === "archived") {
      entity.archive();
    }

    return entity;
  }

  /**
   * Convert a domain Contact entity to a ContactDTO
   * @param entity - The Contact domain entity
   * @returns ContactDTO
   */
  static toDTO(entity: ContactEntity): ContactDTO {
    return {
      id: entity.id,
      name: entity.name,
      email: entity.email,
      message: entity.message,
      status: entity.status,
      repliedAt: entity.repliedAt?.toISOString(),
      createdAt: entity.createdAt.toISOString(),
      updatedAt: entity.updatedAt.toISOString(),
    };
  }

  /**
   * Convert a domain Contact entity to a Firestore document
   * @param entity - The Contact domain entity
   * @returns Firestore document data (without id as it's the doc ID)
   */
  static toDocument(entity: ContactEntity): Omit<ContactDocument, "id"> {
    return {
      name: entity.name,
      email: entity.email,
      message: entity.message,
      status: entity.status,
      repliedAt: entity.repliedAt,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }

  /**
   * Convert a Firestore document to a ContactDTO
   * Direct conversion without going through domain entity
   * @param doc - The Firestore document data
   * @returns ContactDTO
   */
  static documentToDTO(doc: ContactDocument): ContactDTO {
    return {
      id: doc.id,
      name: doc.name,
      email: doc.email,
      message: doc.message,
      status: doc.status,
      repliedAt: doc.repliedAt?.toISOString(),
      createdAt: doc.createdAt.toISOString(),
      updatedAt: doc.updatedAt.toISOString(),
    };
  }
}
