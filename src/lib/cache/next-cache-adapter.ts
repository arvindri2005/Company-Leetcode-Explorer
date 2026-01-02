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

    const cachedFn = unstable_cache(
      async () => {
        try {
          return await fn();
        } catch (error) {
          (Logger as any).error(`[Cache] Error executing source function for ${key}`, error);
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
      (Logger as any).info(`[Cache] Revalidating tag: ${tag}`);
      revalidateTag(tag);
    } catch (error) {
      (Logger as any).error(`[Cache] Failed to revalidate tag: ${tag}`, error);
    }
  }
}
