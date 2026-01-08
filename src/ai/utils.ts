import { Logger } from "@/lib/utils/logger";

/**
 * Retries an asynchronous operation with exponential backoff.
 *
 * @param operation - The asynchronous function to retry.
 * @param retries - The maximum number of retries (default: 3).
 * @param delay - The initial delay in milliseconds (default: 1000).
 * @param factor - The multiplier for the delay (default: 2).
 * @returns The result of the operation.
 * @throws The last error encountered if all retries fail.
 */
export async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  retries: number = 3,
  delay: number = 1000,
  factor: number = 2
): Promise<T> {
  let currentDelay = delay;

  for (let i = 0; i < retries; i++) {
    try {
      return await operation();
    } catch (error) {
      if (i === retries - 1) {
        Logger.error(`Operation failed after ${retries} retries`, error);
        throw error;
      }
      Logger.warn(
        `Operation failed (attempt ${i + 1}/${retries}). Retrying in ${currentDelay}ms...`,
        {},
        error
      );
      await new Promise((resolve) => setTimeout(resolve, currentDelay));
      currentDelay *= factor;
    }
  }

  // This part should be unreachable because of the throw in the loop,
  // but TypeScript might want a return or throw here.
  throw new Error("Operation failed after maximum retries");
}

/**
 * Smartly truncates text to a maximum length, trying to cut at sentence boundaries.
 *
 * @param text - The text to truncate.
 * @param maxLength - The maximum length of the text.
 * @returns The truncated text.
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) {
    return text;
  }

  const truncated = text.slice(0, maxLength);
  const lastSentenceEnd = Math.max(
    truncated.lastIndexOf("."),
    truncated.lastIndexOf("!"),
    truncated.lastIndexOf("?"),
    truncated.lastIndexOf("\n")
  );

  // If we found a sentence boundary reasonably close to the limit (e.g. within last 200 chars), use it.
  if (lastSentenceEnd !== -1 && lastSentenceEnd > maxLength - 200) {
    return truncated.slice(0, lastSentenceEnd + 1) + " ...(truncated)";
  }

  return truncated + "...(truncated)";
}

/**
 * Sanitizes input text by redacting potential PII like email addresses.
 *
 * @param text - The text to sanitize.
 * @returns The sanitized text.
 */
export function sanitizeInput(text: string): string {
  // Simple regex for email redaction
  const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
  return text.replace(emailRegex, "[REDACTED_EMAIL]");
}






