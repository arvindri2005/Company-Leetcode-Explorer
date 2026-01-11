/**
 * Base repository interface defining generic CRUD operations
 * All feature repositories should extend this interface
 */

/**
 * Pagination parameters for list operations
 */
export interface PaginationParams {
  cursor?: string;
  page?: number;
  pageSize?: number;
}

/**
 * Paginated result structure
 */
export interface PaginatedResult<T> {
  items: T[];
  totalItems: number;
  hasMore: boolean;
  nextCursor?: string;
  totalPages?: number;
  currentPage?: number;
}

/**
 * Base repository interface with generic CRUD operations
 * @template T - The entity type
 * @template CreateDTO - The data transfer object for creating entities
 * @template UpdateDTO - The data transfer object for updating entities
 */
export interface IBaseRepository<T, CreateDTO = Partial<T>, UpdateDTO = Partial<T>> {
  /**
   * Find an entity by its unique identifier
   * @param id - The entity's unique identifier
   * @returns The entity if found, null otherwise
   */
  findById(id: string): Promise<T | null>;

  /**
   * Find all entities with optional pagination
   * @param params - Optional pagination parameters
   * @returns Paginated result containing entities
   */
  findAll(params?: PaginationParams): Promise<PaginatedResult<T>>;

  /**
   * Save a new entity
   * @param data - The data to create the entity with
   * @returns The created entity
   */
  save(data: CreateDTO): Promise<T>;

  /**
   * Update an existing entity
   * @param id - The entity's unique identifier
   * @param data - The data to update
   * @returns The updated entity
   */
  update(id: string, data: UpdateDTO): Promise<T>;

  /**
   * Delete an entity by its unique identifier
   * @param id - The entity's unique identifier
   */
  delete(id: string): Promise<void>;

  /**
   * Check if an entity exists by its unique identifier
   * @param id - The entity's unique identifier
   * @returns True if the entity exists, false otherwise
   */
  exists(id: string): Promise<boolean>;
}
