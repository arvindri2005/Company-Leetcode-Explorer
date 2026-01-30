"use server";

import { revalidateTag as nextRevalidateTag } from "next/cache";

import { Logger } from "@/shared/lib/utils/logger";

/**
 * Server-only cache revalidation function.
 * This must only be called from Server Components or Server Actions.
 * 
 * Uses profile="max" for stale-while-revalidate semantics (recommended).
 * Data is marked as stale and fresh data is fetched when pages using that tag are next visited.
 */
export async function revalidateCacheTag(tag: string): Promise<void> {
  try {
    Logger.info(`[Cache] Revalidating tag: ${tag}`);
    nextRevalidateTag(tag, "max");
  } catch (error) {
    Logger.error(`[Cache] Failed to revalidate tag: ${tag}`, error);
  }
}

/**
 * Server-only cache revalidation with immediate expiration.
 * Use this for webhooks or third-party services that require immediate data expiration.
 */
export async function revalidateCacheTagImmediate(tag: string): Promise<void> {
  try {
    Logger.info(`[Cache] Immediately expiring tag: ${tag}`);
    nextRevalidateTag(tag, { expire: 0 });
  } catch (error) {
    Logger.error(`[Cache] Failed to expire tag: ${tag}`, error);
  }
}
