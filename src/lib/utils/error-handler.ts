import { Logger } from "@/lib/utils/logger";

/**
 * Standardizes error handling for Server Actions.
 * Logs the error with structured context and returns a user-friendly error message.
 */
export function handleServerActionError(
  error: unknown,
  actionName: string,
  context?: Record<string, unknown>
): string {
  let errorMessage: string;

  if (error instanceof Error) {
    errorMessage = error.message;
  } else if (typeof error === "string") {
    errorMessage = error;
  } else {
    errorMessage = "Unknown error";
  }
  
  // Log the full error with context for debugging
  Logger.error(`Action failed: ${actionName}`, error, {
    ...context,
    originalError: errorMessage,
  });

  // Return a clean message for the UI
  // In production, we might want to mask sensitive internal errors here
  // For now, we return the error message to help with development/beta
  return errorMessage;
}






