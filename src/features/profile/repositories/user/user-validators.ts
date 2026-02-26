/**
 * User Security Validators Module
 * Handles user security validations
 */

import { auth } from "@/shared/lib/api/firebase";

/**
 * Interface for user security validations
 */
export interface UserValidators {
  /**
   * Check if the current user is authorized to access a user's data
   * @param userId - The user ID to check authorization for
   * @returns True if authorized, false otherwise
   */
  isAuthorized(userId: string): boolean;

  /**
   * Check if text contains invalid characters
   * @param text - The text to validate
   * @returns True if text contains invalid characters, false otherwise
   */
  hasInvalidCharacters(text: string | undefined | null): boolean;

  /**
   * Sanitize display name by removing invalid characters and truncating
   * @param text - The display name to sanitize
   * @returns Sanitized display name or null if input is null/undefined
   */
  sanitizeDisplayName(text: string | undefined | null): string | null;
}

/**
 * Implementation of user security validators
 */
export class UserValidatorsImpl implements UserValidators {
  /**
   * Check if the current user is authorized to access a user's data
   * @param userId - The user ID to check authorization for
   * @returns True if authorized, false otherwise
   */
  isAuthorized(userId: string): boolean {
    const currentUser = auth.currentUser;
    return !!currentUser && currentUser.uid === userId;
  }

  /**
   * Check if text contains invalid characters
   * @param text - The text to validate
   * @returns True if text contains invalid characters, false otherwise
   */
  hasInvalidCharacters(text: string | undefined | null): boolean {
    if (!text) {
      return false;
    }
    // Security: Block specific characters commonly used in XSS and spoofing
    // Block:
    // - '<' and '>' to prevent HTML injection
    // - ASCII control characters (\x00-\x1F, \x7F)
    // - Unicode BiDi overrides (\u202A-\u202E, \u2066-\u2069)
    return /[<>]|[\x00-\x1F\x7F]|[\u202A-\u202E\u2066-\u2069]/.test(text);
  }

  /**
   * Sanitize display name by removing invalid characters and truncating
   * @param text - The display name to sanitize
   * @returns Sanitized display name or null if input is null/undefined
   */
  sanitizeDisplayName(text: string | undefined | null): string | null {
    if (!text) {
      return null;
    }

    let sanitized = text.trim();

    // Security: Remove invalid characters
    // Remove ASCII control characters
    sanitized = sanitized.replace(/[\x00-\x1F\x7F]/g, "");
    // Remove Unicode BiDi overrides
    sanitized = sanitized.replace(/[\u202A-\u202E\u2066-\u2069]/g, "");
    // Remove < and >
    sanitized = sanitized.replace(/[<>]/g, "");

    // Truncate to 50 characters
    if (sanitized.length > 50) {
      sanitized = sanitized.substring(0, 50);
    }

    return sanitized;
  }
}
