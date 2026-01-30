/**
 * Shared Validators Module
 * Common validation patterns used across repository modules
 */

import { Logger } from "@/shared/lib/utils/logger";
import { SavedStrategyTodoListSchema } from "@/shared/types";

/**
 * Interface for shared validators
 */
export interface SharedValidators {
  /**
   * Validate strategy data
   */
  validateStrategyData(
    strategyData: unknown,
    userId: string
  ): { isValid: boolean; error?: string; data?: unknown };

  /**
   * Check if text contains invalid characters
   */
  hasInvalidCharacters(text: string | undefined | null): boolean;
}

/**
 * Implementation of shared validators
 */
export class SharedValidatorsImpl implements SharedValidators {
  /**
   * Validate strategy data using Zod schema
   * @param strategyData - The strategy data to validate
   * @param userId - The user ID for logging purposes
   * @returns Validation result with error message if invalid
   */
  validateStrategyData(
    strategyData: unknown,
    userId: string
  ): { isValid: boolean; error?: string; data?: unknown } {
    // Validate data using Zod schema
    const validationResult = SavedStrategyTodoListSchema.safeParse(strategyData);

    if (!validationResult.success) {
      const errorMessage = validationResult.error.issues.map((e) => e.message).join(", ");
      Logger.warn("Invalid strategy data provided", {
        userId,
        errors: errorMessage,
      });
      return { isValid: false, error: errorMessage };
    }

    const data = validationResult.data;

    // Security: Validate nested fields for invalid characters to prevent XSS
    // Check top-level strings
    let hasInvalidChars =
      this.hasInvalidCharacters(data.companyName) ||
      this.hasInvalidCharacters(data.preparationStrategy);

    // Check nested arrays
    if (!hasInvalidChars && data.focusTopics) {
      hasInvalidChars = data.focusTopics.some(
        (topic) =>
          this.hasInvalidCharacters(topic.topic) || this.hasInvalidCharacters(topic.reason)
      );
    }

    if (!hasInvalidChars && data.items) {
      hasInvalidChars = data.items.some((item) => this.hasInvalidCharacters(item.text));
    }

    if (hasInvalidChars) {
      Logger.warn("Blocked attempt to save strategy with invalid characters", { userId });
      return { isValid: false, error: "Input contains invalid characters." };
    }

    return { isValid: true, data: data };
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
