/**
 * Contact Repository Interface
 * Defines data access operations for Contact entities
 */

import type { Contact as ContactEntity } from "@/core/domain/entities/contact.entity";
import type { IBaseRepository, PaginatedResult, PaginationParams } from "@/shared/interfaces";

/**
 * Contact message data for creating a new contact submission
 */
export interface ContactMessageData {
  name: string;
  email: string;
  message: string;
}

/**
 * DTO for creating a new contact
 */
export interface CreateContactDTO {
  name: string;
  email: string;
  message: string;
}

/**
 * DTO for updating an existing contact
 */
export interface UpdateContactDTO {
  status?: "pending" | "read" | "replied" | "archived";
  repliedAt?: Date;
}

/**
 * Contact Repository Interface
 * Extends base repository with contact-specific operations
 */
export interface IContactRepository extends IBaseRepository<ContactEntity, CreateContactDTO, UpdateContactDTO> {
  /**
   * Create a new contact message
   * @param data - The contact message data
   */
  createContactMessage(data: ContactMessageData): Promise<void>;

  /**
   * Get all contact messages with optional pagination
   * @param params - Pagination parameters
   * @returns Paginated result of contact messages
   */
  getContactMessages(params?: PaginationParams): Promise<PaginatedResult<ContactEntity>>;

  /**
   * Get contact messages by status
   * @param status - The status to filter by
   * @param params - Pagination parameters
   * @returns Paginated result of contact messages
   */
  getContactMessagesByStatus(
    status: "pending" | "read" | "replied" | "archived",
    params?: PaginationParams
  ): Promise<PaginatedResult<ContactEntity>>;

  /**
   * Mark a contact message as read
   * @param id - The contact message's unique identifier
   * @returns Result indicating success or error
   */
  markAsRead(id: string): Promise<{ success: boolean; error?: string }>;

  /**
   * Mark a contact message as replied
   * @param id - The contact message's unique identifier
   * @returns Result indicating success or error
   */
  markAsReplied(id: string): Promise<{ success: boolean; error?: string }>;

  /**
   * Archive a contact message
   * @param id - The contact message's unique identifier
   * @returns Result indicating success or error
   */
  archive(id: string): Promise<{ success: boolean; error?: string }>;
}
