/**
 * Shared Error Handlers Module
 * Common error handling utilities used across repository modules
 */

import { Logger } from "@/lib/utils/logger";

/**
 * Interface for error handlers
 */
export interface ErrorHandlers {
  /**
   * Handle repository errors with consistent logging and error messages
   */
  handleRepositoryError(
    operation: string,
    error: unknown,
    context?: Record<string, unknown>
  ): { success: false; error: string };

  /**
   * Create a generic error response
   */
  createErrorResponse(message: string): { success: false; error: string };

  /**
   * Create a success response
   */
  createSuccessResponse(): { success: true };
}

/**
 * Implementation of error handlers
 */
export class ErrorHandlersImpl implements ErrorHandlers {
  /**
   * Handle repository errors with consistent logging and error messages
   * @param operation - The operation that failed
   * @param error - The error that occurred
   * @param context - Additional context for logging
   * @returns Standardized error response
   */
  handleRepositoryError(
    operation: string,
    error: unknown,
    context?: Record<string, unknown>
  ): { success: false; error: string } {
    // Security: Return generic error message to prevent leaking internal details
    Logger.error(`Error during ${operation}`, error, context);
    return {
      success: false,
      error: `An unexpected error occurred while ${operation}.`,
    };
  }

  /**
   * Create a generic error response
   * @param message - The error message
   * @returns Error response object
   */
  createErrorResponse(message: string): { success: false; error: string } {
    return {
      success: false,
      error: message,
    };
  }

  /**
   * Create a success response
   * @returns Success response object
   */
  createSuccessResponse(): { success: true } {
    return {
      success: true,
    };
  }
}
