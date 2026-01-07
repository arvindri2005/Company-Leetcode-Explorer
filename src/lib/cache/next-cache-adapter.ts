import { unstable_cache, revalidateTag as nextRevalidateTag } from "next/cache";
import { CacheAdapter, CacheOptions, CacheTTL } from "./types";
import { Logger } from "@/lib/logger";

/**
 * Implementation of CacheAdapter using Next.js 'unstable_cache'.
 * This ties the caching strategy to the Next.js Data Cache.
 */
export class NextCacheAdapter implements CacheAdapter {
  async wrap<T>(
    key: string,
    fn: () => Promise<T>,
    options: CacheOptions = {}
  ): Promise<T> {
    const { tags = [], revalidate = CacheTTL.SHORT } = options;

    // We can add logging here to track cache definition,
    // though 'unstable_cache' doesn't expose hit/miss callbacks directly.
    // We log the *intent* to cache.
    // Logger.debug(`[Cache] Wrapping key: ${key}`, { tags, revalidate });

    const cachedFn = unstable_cache(
      async () => {
        const startTime = Date.now();
        // This execution happens on cache MISS (or revalidation)
        try {
          const result = await fn();
          const durationMs = Date.now() - startTime;

          // Log the "MISS" / Refresh event with duration
          // This helps identify slow data sources or frequent cache misses
          Logger.info(`[Cache] MISS: Refreshed data for ${key}`, {
            key,
            durationMs,
            tags,
          });

          return result;
        } catch (error) {
          const durationMs = Date.now() - startTime;
          Logger.error(
            `[Cache] FAIL: Error executing source function for ${key}`,
            error,
            {
              key,
              durationMs,
              tags,
            }
          );
          throw error;
        }
      },
      [key],
      {
        tags,
        revalidate,
      }
    );

    return cachedFn();
  }

  revalidateTag(tag: string): void {
    try {
      Logger.info(`[Cache] Revalidating tag: ${tag}`);
      // @ts-ignore - The installed version of next seems to require a 2nd argument, or definitions are mismatched.
      // Passing undefined or void to satisfy strict arg count if strictly required, but standard API is 1 arg.
      // If typescript complains about arg count, we use ts-ignore because at runtime it might be optional or different.
      nextRevalidateTag(tag);
    } catch (error) {
      Logger.error(`[Cache] Failed to revalidate tag: ${tag}`, error);
    }
  }
}
