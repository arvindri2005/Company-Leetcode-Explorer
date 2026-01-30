/**
 * User Query Builders Module
 * Handles user query construction
 */

import { type User as UserEntity } from "@/core/domain/entities/user.entity";
import type { PaginatedResult, PaginationParams } from "@/shared/interfaces";

/**
 * Interface for user query operations
 */
export interface UserQueries {
  /**
   * Find all users with optional pagination
   * @param params - Optional pagination parameters
   * @returns Paginated result containing User entities
   */
  findAll(params?: PaginationParams): Promise<PaginatedResult<UserEntity>>;
}

/**
 * Implementation of user query operations
 */
export class UserQueriesImpl implements UserQueries {
  /**
   * Find all users with optional pagination
   * @param params - Optional pagination parameters
   * @returns Paginated result containing User entities
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async findAll(params?: PaginationParams): Promise<PaginatedResult<UserEntity>> {
    // Security: Listing all users is disabled to prevent data scraping/enumeration.
    // We return an empty list instead of throwing to be graceful to any potential generic callers.
    return Promise.resolve({ items: [], totalItems: 0, hasMore: false });
  }
}
