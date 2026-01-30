/**
 * Contact Service Interface
 * Defines business operations for Contact entities
 */

import type { Contact as ContactEntity } from "@/core/domain/entities/contact.entity";
import type { PaginatedResult, PaginationParams } from "@/shared/interfaces";
import type { Result } from "@/shared/types/result";
import type { ServiceError } from "@/shared/types/service-error";

import type { ContactMessageData } from "./contact.repository.interface";

/**
 * Contact Service Interface
 * Defines all business operations for contact submissions
 */
export interface IContactService {
  /**
   * Submit a new contact message
   * @param data - The contact message data
   * @returns Result indicating success or error
   */
  submitMessage(data: ContactMessageData): Promise<Result<void, ServiceError>>;

  /**
   * Get all contact messages with optional pagination
   * @param params - Pagination parameters
   * @returns Result containing paginated contact messages or error
   */
  getContactMessages(
    params?: PaginationParams
  ): Promise<Result<PaginatedResult<ContactEntity>, ServiceError>>;

  /**
   * Get contact messages by status
   * @param status - The status to filter by
   * @param params - Pagination parameters
   * @returns Result containing paginated contact messages or error
   */
  getContactMessagesByStatus(
    status: "pending" | "read" | "replied" | "archived",
    params?: PaginationParams
  ): Promise<Result<PaginatedResult<ContactEntity>, ServiceError>>;

  /**
   * Get a contact message by ID
   * @param id - The contact message's unique identifier
   * @returns Result containing the contact message or error
   */
  getContactById(id: string): Promise<Result<ContactEntity, ServiceError>>;

  /**
   * Mark a contact message as read
   * @param id - The contact message's unique identifier
   * @returns Result indicating success or error
   */
  markAsRead(id: string): Promise<Result<void, ServiceError>>;

  /**
   * Mark a contact message as replied
   * @param id - The contact message's unique identifier
   * @returns Result indicating success or error
   */
  markAsReplied(id: string): Promise<Result<void, ServiceError>>;

  /**
   * Archive a contact message
   * @param id - The contact message's unique identifier
   * @returns Result indicating success or error
   */
  archive(id: string): Promise<Result<void, ServiceError>>;
}
