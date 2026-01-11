import { CacheAdapter, CacheOptions, CacheTTL } from "./types";
import { Logger } from "@/lib/utils/logger";

/**
 * Implementation of CacheAdapter using Next.js 'unstable_cache'.
 * This ties the caching strategy to the Next.js Data Cache.
 * 
 * NOTE: This adapter only works in Server Components/Actions.
 * The unstable_cache import is dynamic to prevent client bundle pollution.
 */
export class NextCacheAdapter implements CacheAdapter {
  async wrap<T>(
    key: string,
    fn: () => Promise<T>,
    options: CacheOptions = {}
  ): Promise<T> {
    const { tags = [], revalidate = CacheTTL.SHORT } = options;

    // Dynamic import to ensure this only runs on server
    const { unstable_cache } = await import("next/cache");

    const cachedFn = unstable_cache(
      async () => {
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

  /**
   * @deprecated Use revalidateCacheTag from '@/lib/utils/cache/server-cache' instead.
   * This method is kept for interface compatibility but should not be used.
   */
  revalidateTag(_tag: string): void {
    throw new Error(
      "revalidateTag cannot be called from this adapter. " +
      "Use revalidateCacheTag from '@/lib/utils/cache/server-cache' in Server Actions instead."
    );
  }
}






