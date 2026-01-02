import { unstable_cache, revalidateTag } from "next/cache";
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
        // This execution happens on cache MISS
        // Logger.debug(`[Cache] MISS: Executing source function for ${key}`);
        try {
          return await fn();
        } catch (error) {
          Logger.error(`[Cache] Error executing source function for ${key}`, error);
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
      revalidateTag(tag);
    } catch (error) {
      Logger.error(`[Cache] Failed to revalidate tag: ${tag}`, error);
    }
  }
}
