/**
 * Contact Service Implementation
 *
 * Implements IContactService interface for business operations
 * related to contact form submissions.
 */

import { contactRepository } from "../repositories/contact.repository";
import { ContactRepository } from "../repositories/contact.repository";
import { success, failure, type Result } from "@/shared/types/result";
import type { ServiceError } from "@/shared/types/service-error";
import type { Contact as ContactEntity } from "@/domain/entities/contact.entity";
import type { PaginatedResult, PaginationParams } from "@/shared/interfaces";
import type { IContactService } from "../interfaces/contact.service.interface";
import type {
  IContactRepository,
  ContactMessageData,
} from "../interfaces/contact.repository.interface";

/**
 * Contact Service Implementation
 * Implements IContactService interface for dependency injection
 */
export class ContactService implements IContactService {
  constructor(
    private readonly repository: IContactRepository = contactRepository as IContactRepository
  ) {}

  /**
   * Submit a new contact message
   */
  async submitMessage(data: ContactMessageData): Promise<Result<void, ServiceError>> {
    try {
      await this.repository.createContactMessage(data);
      return success(undefined);
    } catch (error) {
      return failure({
        code: "INTERNAL_ERROR",
        message: "Failed to submit contact message",
        cause: error instanceof Error ? error : undefined,
      });
    }
  }

  /**
   * Get all contact messages with optional pagination
   */
  async getContactMessages(
    params?: PaginationParams
  ): Promise<Result<PaginatedResult<ContactEntity>, ServiceError>> {
    try {
      const result = await this.repository.getContactMessages(params);
      return success(result);
    } catch (error) {
      return failure({
        code: "INTERNAL_ERROR",
        message: "Failed to fetch contact messages",
        cause: error instanceof Error ? error : undefined,
      });
    }
  }

  /**
   * Get contact messages by status
   */
  async getContactMessagesByStatus(
    status: "pending" | "read" | "replied" | "archived",
    params?: PaginationParams
  ): Promise<Result<PaginatedResult<ContactEntity>, ServiceError>> {
    try {
      const result = await this.repository.getContactMessagesByStatus(status, params);
      return success(result);
    } catch (error) {
      return failure({
        code: "INTERNAL_ERROR",
        message: "Failed to fetch contact messages by status",
        details: { status },
        cause: error instanceof Error ? error : undefined,
      });
    }
  }

  /**
   * Get a contact message by ID
   */
  async getContactById(id: string): Promise<Result<ContactEntity, ServiceError>> {
    try {
      const contact = await this.repository.findById(id);
      
      if (!contact) {
        return failure({
          code: "NOT_FOUND",
          message: `Contact with ID ${id} not found`,
          details: { id },
        });
      }
      
      return success(contact);
    } catch (error) {
      return failure({
        code: "INTERNAL_ERROR",
        message: "Failed to fetch contact",
        details: { id },
        cause: error instanceof Error ? error : undefined,
      });
    }
  }

  /**
   * Mark a contact message as read
   */
  async markAsRead(id: string): Promise<Result<void, ServiceError>> {
    try {
      const result = await this.repository.markAsRead(id);
      
      if (!result.success) {
        return failure({
          code: "INTERNAL_ERROR",
          message: result.error || "Failed to mark contact as read",
          details: { id },
        });
      }
      
      return success(undefined);
    } catch (error) {
      return failure({
        code: "INTERNAL_ERROR",
        message: "Failed to mark contact as read",
        details: { id },
        cause: error instanceof Error ? error : undefined,
      });
    }
  }

  /**
   * Mark a contact message as replied
   */
  async markAsReplied(id: string): Promise<Result<void, ServiceError>> {
    try {
      const result = await this.repository.markAsReplied(id);
      
      if (!result.success) {
        return failure({
          code: "INTERNAL_ERROR",
          message: result.error || "Failed to mark contact as replied",
          details: { id },
        });
      }
      
      return success(undefined);
    } catch (error) {
      return failure({
        code: "INTERNAL_ERROR",
        message: "Failed to mark contact as replied",
        details: { id },
        cause: error instanceof Error ? error : undefined,
      });
    }
  }

  /**
   * Archive a contact message
   */
  async archive(id: string): Promise<Result<void, ServiceError>> {
    try {
      const result = await this.repository.archive(id);
      
      if (!result.success) {
        return failure({
          code: "INTERNAL_ERROR",
          message: result.error || "Failed to archive contact",
          details: { id },
        });
      }
      
      return success(undefined);
    } catch (error) {
      return failure({
        code: "INTERNAL_ERROR",
        message: "Failed to archive contact",
        details: { id },
        cause: error instanceof Error ? error : undefined,
      });
    }
  }
}

export const contactService = new ContactService();
