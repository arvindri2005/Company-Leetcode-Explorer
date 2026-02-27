/**
 * Bookmark Operations Module
 *
 * Provides CRUD operations for user problem bookmarks backed by Supabase.
 * Bookmarks live in the `user_bookmarks` table, linked to `problems` and
 * `companies` via foreign-key joins.
 *
 * @module bookmark-operations
 */

import { createSupabaseBrowserClient } from "@/shared/lib/api/supabase-browser";
import { Logger } from "@/shared/lib/utils/logger";
import type { BookmarkedProblemInfo } from "@/shared/types";

/** Maximum number of bookmark rows returned per query (pagination guard) */
const MAX_PAGE_SIZE = 50;

/**
 * Interface for bookmark operations.
 * Defines the contract for bookmark-related data access.
 */
export interface BookmarkOperations {
  /** Retrieve full bookmark info (with problem/company slugs) for a user */
  getBookmarkedProblemsInfo(userId: string): Promise<BookmarkedProblemInfo[]>;

  /** Toggle (add or remove) a bookmark for a specific problem */
  toggleBookmarkProblem(
    userId: string,
    problemId: string,
    companySlug: string,
    problemSlug: string
  ): Promise<{ isBookmarked: boolean; error?: string }>;
}

/**
 * Supabase-backed implementation of {@link BookmarkOperations}.
 */
export class BookmarkOperationsImpl implements BookmarkOperations {
  private supabase = createSupabaseBrowserClient();

  /**
   * Get bookmarked problems info for a user.
   *
   * Performs a nested join: user_bookmarks → problems → company_problems → companies
   * so that each bookmark includes enough context to construct a problem URL
   * (companySlug + problemSlug).
   *
   * Rows with incomplete join data (missing slug) are filtered out.
   *
   * @param userId - The user's uid
   * @returns Array of bookmarked problem info, sorted newest-first
   */
  async getBookmarkedProblemsInfo(userId: string): Promise<BookmarkedProblemInfo[]> {
    if (!userId) {
      Logger.debug("[BookmarkOps.getInfo] Skipped — empty userId");
      return [];
    }

    Logger.debug("[BookmarkOps.getInfo] Fetching bookmarked problems", { userId });

    try {
      // Type for the raw Supabase join result
      interface BookmarkRow {
        created_at: string;
        problem_id: string;
        problems: {
          slug: string;
          company_problems: {
            companies: {
              slug: string;
            } | null;
          }[] | null;
        } | null;
      }

      // Nested select: join through problems → company_problems → companies
      // to resolve slugs needed for URL construction
      const { data, error } = await this.supabase
        .from("user_bookmarks")
        .select(`
          created_at,
          problem_id,
          problems (
            slug,
            company_problems (
              companies (
                slug
              )
            )
          )
        `)
        .eq("uid", userId)
        .order("created_at", { ascending: false })
        .limit(MAX_PAGE_SIZE);

      if (error) {
        Logger.error("[BookmarkOps.getInfo] Supabase query failed", error, { userId });
        throw error;
      }

      if (!data) {
        Logger.info("[BookmarkOps.getInfo] No data returned", { userId });
        return [];
      }

      // Map raw rows to domain objects, dropping any with incomplete joins
      const results = (data as unknown as BookmarkRow[])
        .map((row) => {
          const problem = row.problems;
          // Pick the first company slug from the many-to-many relationship
          const companySlug = problem?.company_problems?.[0]?.companies?.slug;
          
          if (!problem?.slug || !companySlug) {
            // Incomplete join data — skip this bookmark
            Logger.warn("[BookmarkOps.getInfo] Skipping bookmark due to missing join data", {
              userId,
              problemId: row.problem_id,
              hasProblemNode: !!problem,
              problemSlug: problem?.slug,
              companySlug: companySlug,
              companyProblemsExists: !!problem?.company_problems,
              companyProblemsCount: problem?.company_problems?.length ?? 0
            });
            return null;
          }

          return {
            problemId: row.problem_id,
            companySlug: companySlug,
            problemSlug: problem.slug,
            bookmarkedAt: new Date(row.created_at),
          } as BookmarkedProblemInfo;
        })
        .filter((info): info is BookmarkedProblemInfo => info !== null);

      Logger.info("[BookmarkOps.getInfo] Fetched bookmarks successfully", {
        userId,
        totalRows: data.length,
        validBookmarks: results.length,
      });

      return results;
    } catch (error) {
      Logger.error("[BookmarkOps.getInfo] Unexpected error", error, { userId });
      return [];
    }
  }

  /**
   * Toggle bookmark status for a problem.
   *
   * Uses a check-then-act pattern:
   *   1. Query for an existing bookmark (uid + problem_id)
   *   2. If found → delete it (un-bookmark)
   *   3. If not found → insert a new row (bookmark)
   *
   * Note: PGRST116 from `.single()` means no row matched, which is the
   * expected case when the problem hasn't been bookmarked yet.
   *
   * @param userId - The user's uid
   * @param problemId - The problem's unique identifier
   * @returns Result with the new bookmark state or error
   */
  async toggleBookmarkProblem(
    userId: string,
    problemId: string,
  ): Promise<{ isBookmarked: boolean; error?: string }> {
    if (!userId || !problemId) {
      Logger.debug("[BookmarkOps.toggle] Skipped — missing required params", { userId, problemId });
      return {
        isBookmarked: false,
        error: "User ID and Problem ID are required.",
      };
    }

    Logger.debug("[BookmarkOps.toggle] Toggling bookmark", { userId, problemId });

    try {
      // Step 1: Check if the bookmark already exists
      const { data: existing, error: checkError } = await this.supabase
        .from("user_bookmarks")
        .select("problem_id")
        .eq("uid", userId)
        .eq("problem_id", problemId)
        .single();

      // PGRST116 = no rows found — expected when bookmark doesn't exist
      if (checkError && checkError.code !== "PGRST116") {
        Logger.error("[BookmarkOps.toggle] Error checking existing bookmark", checkError, {
          userId,
          problemId,
        });
        throw checkError;
      }

      if (existing) {
        // Step 2a: Bookmark exists → remove it
        Logger.debug("[BookmarkOps.toggle] Bookmark exists — removing", { userId, problemId });

        const { error: deleteError } = await this.supabase
          .from("user_bookmarks")
          .delete()
          .eq("uid", userId)
          .eq("problem_id", problemId);

        if (deleteError) {
          Logger.error("[BookmarkOps.toggle] Delete failed", deleteError, { userId, problemId });
          throw deleteError;
        }
        
        Logger.info("[BookmarkOps.toggle] Bookmark removed", { userId, problemId });
        return { isBookmarked: false };
      } else {
        // Step 2b: Bookmark doesn't exist → create it
        // Note: slugs are not stored in user_bookmarks; they're resolved
        // via relational joins at query time.
        Logger.debug("[BookmarkOps.toggle] Bookmark not found — creating", { userId, problemId });

        const { error: insertError } = await this.supabase
          .from("user_bookmarks")
          .insert({
            uid: userId,
            problem_id: problemId,
            notes: null // Notes can be added later via a separate UI
          });

        if (insertError) {
          Logger.error("[BookmarkOps.toggle] Insert failed", insertError, { userId, problemId });
          throw insertError;
        }

        Logger.info("[BookmarkOps.toggle] Bookmark created", { userId, problemId });
        return { isBookmarked: true };
      }
    } catch (error) {
      Logger.error("[BookmarkOps.toggle] Unexpected error", error, { userId, problemId });
      return {
        isBookmarked: false,
        error: "An unexpected error occurred while toggling bookmark.",
      };
    }
  }
}
