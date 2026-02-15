/**
 * User Security Validators Module
 * Handles user security validations
 */

import { createSupabaseBrowserClient } from "@/shared/lib/api/supabase-browser";

/**
 * Interface for user security validations
 */
export interface UserValidators {
  /**
   * Check if the current user is authorized to access a user's data
   * @param userId - The user ID to check authorization for
   * @returns Promise<boolean> - True if authorized, false otherwise (async because checking session)
   */
  isAuthorized(userId: string): Promise<boolean>;

  /**
   * Check if text contains invalid characters
   * @param text - The text to validate
   * @returns True if text contains invalid characters, false otherwise
   */
  hasInvalidCharacters(text: string | undefined | null): boolean;
}

/**
 * Implementation of user security validators
 */
export class UserValidatorsImpl implements UserValidators {
    private supabase = createSupabaseBrowserClient();

  /**
   * Check if the current user is authorized to access a user's data
   * @param userId - The user ID to check authorization for
   * @returns Promise<boolean> - True if authorized, false otherwise
   */
  async isAuthorized(userId: string): Promise<boolean> {
    const { data: { user } } = await this.supabase.auth.getUser();
    return !!user && user.id === userId;
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
    // Security: Block specific characters commonly used in XSS, while allowing standard punctuation
    // We block '<' to prevent HTML tag opening, but allow '>' for things like "GPA > 3.0"
    return /[<]/.test(text);
  }
}
