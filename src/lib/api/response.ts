/**
 * Standardized API Response Types
 *
 * Provides consistent response format for all API endpoints and server actions.
 * Ensures clients can reliably parse responses and handle errors.
 *
 * @module lib/api/response
 */

/**
 * Standard API response wrapper
 * @template T - The type of data returned on success
 */
export interface ApiResponse<T> {
  /** Indicates whether the request was successful */
  success: boolean;
  /** The response data (present when success is true) */
  data?: T;
  /** Error information (present when success is false) */
  error?: ApiError;
  /** Response metadata */
  meta?: ResponseMeta;
}

/**
 * Error information for failed requests
 */
export interface ApiError {
  /** Machine-readable error code */
  code: string;
  /** Human-readable error message */
  message: string;
  /** Additional error details */
  details?: Record<string, unknown>;
}

/**
 * Response metadata
 */
export interface ResponseMeta {
  /** ISO timestamp of when the response was generated */
  timestamp: string;
  /** Optional request identifier for tracing */
  requestId?: string;
  /** Pagination information for list responses */
  pagination?: PaginationMeta;
}

/**
 * Pagination metadata for paginated responses
 */
export interface PaginationMeta {
  /** Current page number (1-indexed) */
  page: number;
  /** Number of items per page */
  pageSize: number;
  /** Total number of items across all pages */
  totalItems: number;
  /** Total number of pages */
  totalPages: number;
  /** Whether there is a next page */
  hasNext: boolean;
  /** Whether there is a previous page */
  hasPrevious: boolean;
}


/**
 * Creates a successful API response
 *
 * @template T - The type of data being returned
 * @param data - The response data
 * @param meta - Optional additional metadata
 * @returns A successful ApiResponse object
 *
 * @example
 * ```typescript
 * const response = successResponse({ id: '123', name: 'Test' });
 * // { success: true, data: { id: '123', name: 'Test' }, meta: { timestamp: '...' } }
 * ```
 */
export function successResponse<T>(
  data: T,
  meta?: Partial<ResponseMeta>
): ApiResponse<T> {
  return {
    success: true,
    data,
    meta: {
      timestamp: new Date().toISOString(),
      ...meta,
    },
  };
}

/**
 * Creates an error API response
 *
 * @param error - The error information
 * @param meta - Optional additional metadata
 * @returns A failed ApiResponse object
 *
 * @example
 * ```typescript
 * const response = errorResponse({
 *   code: 'NOT_FOUND',
 *   message: 'Resource not found'
 * });
 * // { success: false, error: { code: 'NOT_FOUND', message: '...' }, meta: { timestamp: '...' } }
 * ```
 */
export function errorResponse(
  error: ApiError,
  meta?: Partial<ResponseMeta>
): ApiResponse<never> {
  return {
    success: false,
    error,
    meta: {
      timestamp: new Date().toISOString(),
      ...meta,
    },
  };
}

/**
 * Creates a paginated API response
 *
 * @template T - The type of items in the data array
 * @param data - Array of items for the current page
 * @param pagination - Pagination metadata
 * @returns A successful ApiResponse with pagination metadata
 *
 * @example
 * ```typescript
 * const response = paginatedResponse(items, {
 *   page: 1,
 *   pageSize: 10,
 *   totalItems: 100,
 *   totalPages: 10,
 *   hasNext: true,
 *   hasPrevious: false
 * });
 * ```
 */
export function paginatedResponse<T>(
  data: T[],
  pagination: PaginationMeta
): ApiResponse<T[]> {
  return {
    success: true,
    data,
    meta: {
      timestamp: new Date().toISOString(),
      pagination,
    },
  };
}
