import { NextCacheAdapter } from "./next-cache-adapter";
import { CacheAdapter } from "./types";

/**
 * The global Cache Manager instance.
 * Currently uses the Next.js Cache Adapter.
 * 
 * Usage:
 * import { cacheManager, CacheTTL } from "@/lib/cache";
 * 
 * const data = await cacheManager.wrap(
 *   "my-unique-key",
 *   () => fetchData(),
 *   { revalidate: CacheTTL.HOURLY, tags: ["my-tag"] }
 * );
 */
export const cacheManager: CacheAdapter = new NextCacheAdapter();

export * from "./types";
