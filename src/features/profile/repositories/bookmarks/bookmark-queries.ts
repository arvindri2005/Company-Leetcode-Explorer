/**
 * Bookmark Queries Module
 *
 * Provides read-only query operations for bookmarks, optimised for
 * batch lookups (e.g. checking which problems in a list are bookmarked).
 *
 * @module bookmark-queries
 */

import { createSupabaseBrowserClient } from "@/shared/lib/api/supabase-browser";
import { Logger } from "@/shared/lib/utils/logger";

/**
 * Interface for bookmark query operations.
 */
export interface BookmarkQueries {
  /** Check which problem IDs from a given list are bookmarked by the user */
  getBookmarksForIds(userId: string, problemIds: string[]): Promise<Set<string>>;
}

/**
 * Supabase-backed implementation of {@link BookmarkQueries}.
 */
export class BookmarkQueriesImpl implements BookmarkQueries {
  private supabase = createSupabaseBrowserClient();

  /**
   * Get bookmarks for a specific set of problem IDs.
   *
   * Uses Supabase's `.in()` filter which maps to a SQL `IN` clause,
   * making this efficient for batch lookups on problem listing pages.
   *
   * @param userId - The user's uid
   * @param problemIds - Array of problem IDs to check
   * @returns Set of problem IDs that are bookmarked
   */
  async getBookmarksForIds(userId: string, problemIds: string[]): Promise<Set<string>> {
    if (!userId || !problemIds || problemIds.length === 0) {
      Logger.debug("[BookmarkQueries.getForIds] Skipped — empty userId or problemIds");
      return new Set();
    }

    Logger.debug("[BookmarkQueries.getForIds] Checking bookmarks for problem batch", {
      userId,
      problemCount: problemIds.length,
    });

    const bookmarkedIds = new Set<string>();

    try {
      // Use SQL IN filter to check all problem IDs in a single query
      const { data, error } = await this.supabase
        .from("user_bookmarks")
        .select("problem_id")
        .eq("uid", userId)
        .in("problem_id", problemIds);

      if (error) {
        Logger.error("[BookmarkQueries.getForIds] Supabase query failed", error, { userId });
        throw error;
      }

      if (data) {
        data.forEach((row) => {
          bookmarkedIds.add(row.problem_id);
        });
      }

      Logger.debug("[BookmarkQueries.getForIds] Bookmarks resolved", {
        userId,
        requested: problemIds.length,
        found: bookmarkedIds.size,
      });

      return bookmarkedIds;
    } catch (error) {
      Logger.error("[BookmarkQueries.getForIds] Unexpected error", error, { userId });
      return new Set();
    }
  }
}
