/**
 * Education Validators Module
 * Handles education validation logic
 */

import { EducationExperienceSchema } from "@/types";
import { Logger } from "@/lib/utils/logger";

/**
 * Interface for education validators
 */
export interface EducationValidators {
  /**
   * Validate education data
   */
  validateEducationData(
    educationData: unknown,
    userId: string
  ): { isValid: boolean; error?: string; data?: unknown };

  /**
   * Check if text contains invalid characters
   */
  hasInvalidCharacters(text: string | undefined | null): boolean;
}

/**
 * Implementation of education validators
 */
export class EducationValidatorsImpl implements EducationValidators {
  /**
   * Validate education data using Zod schema
   * @param educationData - The education data to validate
   * @param userId - The user ID for logging purposes
   * @returns Validation result with error message if invalid
   */
  validateEducationData(
    educationData: unknown,
    userId: string
  ): { isValid: boolean; error?: string; data?: unknown } {
    // Validate data using Zod schema
    const validationResult = EducationExperienceSchema.omit({
      id: true,
    }).safeParse(educationData);

    if (!validationResult.success) {
      const errorMessage = validationResult.error.issues.map((e) => e.message).join(", ");
      Logger.warn("Invalid education data provided", {
        userId,
        errors: errorMessage,
      });
      return { isValid: false, error: errorMessage };
    }

    // Security: Validate for invalid characters to prevent XSS
    const hasInvalidChars = Object.values(educationData as Record<string, unknown>).some(
      (value) => typeof value === "string" && this.hasInvalidCharacters(value)
    );

    if (hasInvalidChars) {
      Logger.warn("Blocked attempt to add education with invalid characters", { userId });
      return { isValid: false, error: "Input contains invalid characters." };
    }

    return { isValid: true, data: validationResult.data };
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
