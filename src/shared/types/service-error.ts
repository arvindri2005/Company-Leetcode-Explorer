/**
 * Service error types for standardized error handling
 */

/**
 * Standard error codes for service operations
 */
export type ServiceErrorCode =
  | "NOT_FOUND"
  | "VALIDATION_ERROR"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "CONFLICT"
  | "INTERNAL_ERROR"
  | "EXTERNAL_SERVICE_ERROR";

/**
 * Standardized service error interface
 * Used as the error type in Result<T, ServiceError>
 */
export interface ServiceError {
  /** Error code for programmatic handling */
  code: ServiceErrorCode;
  /** Human-readable error message */
  message: string;
  /** Optional additional error details */
  details?: Record<string, unknown>;
  /** Optional original error that caused this error */
  cause?: Error;
}
