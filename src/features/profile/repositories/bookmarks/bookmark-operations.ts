/**
 * Bookmark Operations Module
 * Handles bookmark CRUD operations
 */

import { createSupabaseBrowserClient } from "@/shared/lib/api/supabase-browser";
import { Logger } from "@/shared/lib/utils/logger";
import type { BookmarkedProblemInfo } from "@/shared/types";

const MAX_PAGE_SIZE = 50;

/**
 * Interface for bookmark operations
 */
export interface BookmarkOperations {
  /**
   * Get bookmarked problems info for a user
   */
  getBookmarkedProblemsInfo(userId: string): Promise<BookmarkedProblemInfo[]>;

  /**
   * Toggle bookmark status for a problem
   */
  toggleBookmarkProblem(
    userId: string,
    problemId: string,
    companySlug: string,
    problemSlug: string
  ): Promise<{ isBookmarked: boolean; error?: string }>;
}

/**
 * Implementation of bookmark operations
 */
export class BookmarkOperationsImpl implements BookmarkOperations {
  private supabase = createSupabaseBrowserClient();

  /**
   * Get bookmarked problems info for a user
   * @param userId - The user's unique identifier
   * @returns Array of bookmarked problem info
   */
  async getBookmarkedProblemsInfo(userId: string): Promise<BookmarkedProblemInfo[]> {
    if (!userId) {
      return [];
    }
    try {
      // Define a specific interface for the query result to avoid 'any'
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

      // Fetch bookmarks with problem details and associated companies
      // We aim to get at least one company slug to construct a valid URL
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
        throw error;
      }

      if (!data) {return [];}

      return (data as unknown as BookmarkRow[])
        .map((row) => {
          const problem = row.problems;
          // Try to find a company slug from the joined data
          // company_problems is an array of { companies: { slug: string } }
          const companySlug = problem?.company_problems?.[0]?.companies?.slug;
          
          if (!problem?.slug || !companySlug) {
            return null; // Skip if data is incomplete
          }

          return {
            problemId: row.problem_id,
            companySlug: companySlug,
            problemSlug: problem.slug,
            bookmarkedAt: new Date(row.created_at),
          } as BookmarkedProblemInfo;
        })
        .filter((info): info is BookmarkedProblemInfo => info !== null);
    } catch (error) {
      Logger.error(`Error fetching bookmarked problems info`, error, { userId });
      return [];
    }
  }

  /**
   * Toggle bookmark status for a problem
   * @param userId - The user's unique identifier
   * @param problemId - The problem's unique identifier
   * @param companySlug - The company's slug
   * @param problemSlug - The problem's slug
   * @returns Result with bookmark status or error
   */
  async toggleBookmarkProblem(
    userId: string,
    problemId: string,
  ): Promise<{ isBookmarked: boolean; error?: string }> {
    if (!userId || !problemId) {
      return {
        isBookmarked: false,
        error: "User ID and Problem ID are required.",
      };
    }

    try {
      // Check if bookmark exists
      const { data: existing, error: checkError } = await this.supabase
        .from("user_bookmarks")
        .select("problem_id")
        .eq("uid", userId)
        .eq("problem_id", problemId)
        .single();

      if (checkError && checkError.code !== "PGRST116") {
        throw checkError;
      }

      if (existing) {
        // Delete if exists
        const { error: deleteError } = await this.supabase
          .from("user_bookmarks")
          .delete()
          .eq("uid", userId)
          .eq("problem_id", problemId);

        if (deleteError) {throw deleteError;}
        
        return { isBookmarked: false };
      } else {
        // Insert if not exists
        // Note: we don't store slugs in user_bookmarks table, relying on relational storage
        const { error: insertError } = await this.supabase
          .from("user_bookmarks")
          .insert({
            uid: userId,
            problem_id: problemId,
            notes: null // notes can be added later
          });

        if (insertError) {throw insertError;}

        return { isBookmarked: true };
      }
    } catch (error) {
      Logger.error("Error toggling bookmark in Supabase", error);
      return {
        isBookmarked: false,
        error: "An unexpected error occurred while toggling bookmark.",
      };
    }
  }
}
