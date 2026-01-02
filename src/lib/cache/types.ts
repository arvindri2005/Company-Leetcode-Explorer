/**
 * @fileoverview Defines types and constants for the application's caching strategy.
 */

/**
 * Standard Time-To-Live (TTL) values in seconds.
 * Use these constants to ensure consistency across the application.
 */
export const CacheTTL = {
  /** 30 days - For data that rarely changes (e.g., historical problems, static content) */
  STATIC: 2592000,
  /** 7 days - For content that changes weekly */
  WEEKLY: 604800,
  /** 24 hours - For daily updates (e.g., daily challenges) */
  DAILY: 86400,
  /** 1 hour - For semi-dynamic content */
  HOURLY: 3600,
  /** 5 minutes - For frequently updated data */
  SHORT: 300,
  /** 0 - No caching */
  INSTANT: 0,
} as const;

export type CacheTTLValue = (typeof CacheTTL)[keyof typeof CacheTTL];

/**
 * Options for configuring a cache entry.
 */
export interface CacheOptions {
  /**
   * Tags for cache invalidation (Revalidation).
   * Used with revalidateTag() to purge specific cache entries.
   */
  tags?: string[];

  /**
   * Time in seconds before the cache is considered stale.
   * Defaults to CacheTTL.SHORT if not specified.
   */
  revalidate?: number | CacheTTLValue;
}

/**
 * Interface for a Cache Adapter.
 * Allows swapping the underlying caching mechanism (e.g., Next.js Cache, Redis, In-Memory).
 */
export interface CacheAdapter {
  /**
   * Wraps a function with caching logic.
   * @param key The unique key for the cache entry.
   * @param fn The function that fetches the data if the cache is missing/stale.
   * @param options Cache configuration options.
   */
  wrap<T>(key: string, fn: () => Promise<T>, options?: CacheOptions): Promise<T>;

  /**
   * Revalidates cache entries associated with a specific tag.
   * @param tag The tag to revalidate.
   */
  revalidateTag(tag: string): void;
}
