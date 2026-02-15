/**
 * Bookmark Queries Module
 * Handles bookmark query operations
 */

import { createSupabaseBrowserClient } from "@/shared/lib/api/supabase-browser";
import { Logger } from "@/shared/lib/utils/logger";

/**
 * Interface for bookmark query operations
 */
export interface BookmarkQueries {
  /**
   * Get bookmarks for specific problem IDs
   */
  getBookmarksForIds(userId: string, problemIds: string[]): Promise<Set<string>>;
}

/**
 * Implementation of bookmark query operations
 */
export class BookmarkQueriesImpl implements BookmarkQueries {
  private supabase = createSupabaseBrowserClient();

  /**
   * Get bookmarks for specific problem IDs
   * @param userId - The user's unique identifier
   * @param problemIds - Array of problem IDs to check bookmarks for
   * @returns Set of bookmarked problem IDs
   */
  async getBookmarksForIds(userId: string, problemIds: string[]): Promise<Set<string>> {
    if (!userId || !problemIds || problemIds.length === 0) {
      return new Set();
    }
    const bookmarkedIds = new Set<string>();

    try {
      // Supabase supports 'in' filter which maps to SQL IN
      const { data, error } = await this.supabase
        .from("user_bookmarks")
        .select("problem_id")
        .eq("uid", userId)
        .in("problem_id", problemIds);

      if (error) {
        throw error;
      }

      if (data) {
        data.forEach((row) => {
          bookmarkedIds.add(row.problem_id);
        });
      }

      return bookmarkedIds;
    } catch (error) {
      Logger.error(`Error fetching bookmarks`, error, { userId });
      return new Set();
    }
  }
}
