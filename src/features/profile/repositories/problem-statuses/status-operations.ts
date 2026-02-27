/**
 * Problem Status Operations Module
 *
 * Provides CRUD operations for tracking user progress on problems (solved,
 * attempted, in_progress, none). Data is stored in the `user_problem_status`
 * table with relational joins to `problems` and `companies`.
 *
 * @module status-operations
 */

import { createSupabaseBrowserClient } from "@/shared/lib/api/supabase-browser";
import { Logger } from "@/shared/lib/utils/logger";
import type { ProblemStatus, UserProblemStatusInfo } from "@/shared/types";

/**
 * Shape of a raw Supabase query result from user_problem_status
 * with nested joins to problems → company_problems → companies.
 */
interface UserProblemStatusQueryResult {
  problem_id: string;
  status: string;
  updated_at: string;
  problems: {
    slug: string;
    company_problems: Array<{
      companies: {
        slug: string;
      } | null;
    }> | null;
  } | null;
}

/**
 * Shape of a row used for upsert/insert into user_problem_status.
 * Includes optional timestamp fields that are set based on the status value.
 */
interface UserProblemStatusUpdate {
  uid: string;
  problem_id: string;
  status: string;
  updated_at: string;
  /** Set when status transitions to "solved" */
  solved_at?: string;
  /** Set when status transitions to "attempted" or "in_progress" */
  last_attempted_at?: string;
}

/**
 * Interface for problem status operations.
 */
export interface StatusOperations {
  /** Get all problem statuses for a user (used on the profile page) */
  getAllUserProblemStatuses(userId: string): Promise<Record<string, UserProblemStatusInfo>>;

  /** Get aggregated global problem stats (solved/attempted/bookmarked counts) */
  getUserGlobalProblemStats(userId: string): Promise<{
    solvedProblemIds: string[];
    attemptedProblemIds: string[];
    bookmarkedProblemIds: string[];
  }>;

  /** Set (or remove) the problem status for a specific user + problem pair */
  setProblemStatus(
    userId: string,
    problemId: string,
    status: ProblemStatus,
    companySlug: string,
    problemSlug: string
  ): Promise<{ success: boolean; error?: string }>;
}

/**
 * Supabase-backed implementation of {@link StatusOperations}.
 */
export class StatusOperationsImpl implements StatusOperations {
  private supabase = createSupabaseBrowserClient();

  /**
   * Get all problem statuses for a user.
   *
   * Performs a nested join: user_problem_status → problems → company_problems → companies
   * to resolve both the problem slug and company slug for URL construction.
   * Rows with incomplete join data are silently skipped.
   *
   * @param userId - The user's uid
   * @returns Record mapping problem ID → status info
   */
  async getAllUserProblemStatuses(
    userId: string
  ): Promise<Record<string, UserProblemStatusInfo>> {
    if (!userId) {
      Logger.debug("[StatusOps.getAll] Skipped — empty userId");
      return {};
    }

    Logger.debug("[StatusOps.getAll] Fetching all problem statuses", { userId });

    const statuses: Record<string, UserProblemStatusInfo> = {};
    try {
      const { data, error } = await this.supabase
        .from("user_problem_status")
        .select(`
          problem_id,
          status,
          updated_at,
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
        .order("updated_at", { ascending: false });

      if (error) {
        Logger.error("[StatusOps.getAll] Supabase query failed", error, { userId });
        throw error;
      }

      let skippedCount = 0;

      if (data) {
        (data as unknown as UserProblemStatusQueryResult[]).forEach((row) => {
          const problem = row.problems;
          // Resolve the company slug from the first company_problems join
          const companySlug = problem?.company_problems?.[0]?.companies?.slug;
          
          if (row.problem_id && row.status && problem?.slug && companySlug) {
            statuses[row.problem_id] = {
              problemId: row.problem_id,
              status: row.status as ProblemStatus,
              companySlug: companySlug,
              problemSlug: problem.slug,
              updatedAt: new Date(row.updated_at),
            };
          } else {
            // Row has incomplete join data — skip it
            Logger.warn("[StatusOps.getAll] Skipping problem status due to missing data", {
              userId,
              problemId: row.problem_id,
              status: row.status,
              hasProblemNode: !!problem,
              problemSlug: problem?.slug,
              companySlug: companySlug,
              companyProblemsExists: !!problem?.company_problems,
              companyProblemsCount: problem?.company_problems?.length ?? 0
            });
            skippedCount++;
          }
        });
      }

      Logger.info("[StatusOps.getAll] Problem statuses fetched successfully", {
        userId,
        totalRows: data?.length ?? 0,
        mapped: Object.keys(statuses).length,
        skipped: skippedCount,
      });

      return statuses;
    } catch (error) {
      Logger.error("[StatusOps.getAll] Unexpected error", error, { userId });
      return {};
    }
  }

  /**
   * Get user's global problem stats.
   *
   * Runs three parallel queries for efficiency:
   *   1. Solved problem IDs (status = "solved")
   *   2. Attempted problem IDs (status IN ["attempted", "in_progress"])
   *   3. Bookmarked problem IDs (from user_bookmarks table)
   *
   * @param userId - The user's uid
   * @returns Aggregated stats with arrays of problem IDs
   */
  async getUserGlobalProblemStats(userId: string): Promise<{
    solvedProblemIds: string[];
    attemptedProblemIds: string[];
    bookmarkedProblemIds: string[];
  }> {
    if (!userId) {
      Logger.debug("[StatusOps.getStats] Skipped — empty userId");
      return { solvedProblemIds: [], attemptedProblemIds: [], bookmarkedProblemIds: [] };
    }

    Logger.debug("[StatusOps.getStats] Fetching global problem stats", { userId });

    try {
      // Execute 3 independent queries in parallel for better performance
      const [solvedRes, attemptedRes, bookmarkRes] = await Promise.all([
        this.supabase
          .from("user_problem_status")
          .select("problem_id")
          .eq("uid", userId)
          .eq("status", "solved"),
        this.supabase
          .from("user_problem_status")
          .select("problem_id")
          .eq("uid", userId)
          .in("status", ["attempted", "in_progress"]),
        this.supabase
          .from("user_bookmarks")
          .select("problem_id")
          .eq("uid", userId)
      ]);

      // Throw on the first query that failed
      if (solvedRes.error) {
        Logger.error("[StatusOps.getStats] Solved query failed", solvedRes.error, { userId });
        throw solvedRes.error;
      }
      if (attemptedRes.error) {
        Logger.error("[StatusOps.getStats] Attempted query failed", attemptedRes.error, { userId });
        throw attemptedRes.error;
      }
      if (bookmarkRes.error) {
        Logger.error("[StatusOps.getStats] Bookmarks query failed", bookmarkRes.error, { userId });
        throw bookmarkRes.error;
      }

      if (!solvedRes.data) Logger.warn("[StatusOps.getStats] Solved problem data is null", { userId });
      if (!attemptedRes.data) Logger.warn("[StatusOps.getStats] Attempted problem data is null", { userId });
      if (!bookmarkRes.data) Logger.warn("[StatusOps.getStats] Bookmark problem data is null", { userId });

      const stats = {
        solvedProblemIds: solvedRes.data?.map(r => r.problem_id) || [],
        attemptedProblemIds: attemptedRes.data?.map(r => r.problem_id) || [],
        bookmarkedProblemIds: bookmarkRes.data?.map(r => r.problem_id) || [],
      };

      Logger.info("[StatusOps.getStats] Global stats fetched successfully", {
        userId,
        solved: stats.solvedProblemIds.length,
        attempted: stats.attemptedProblemIds.length,
        bookmarked: stats.bookmarkedProblemIds.length,
      });

      return stats;
    } catch (error) {
      Logger.error("[StatusOps.getStats] Unexpected error", error, { userId });
      return { solvedProblemIds: [], attemptedProblemIds: [], bookmarkedProblemIds: [] };
    }
  }

  /**
   * Set (or remove) a problem status for a user.
   *
   * Behaviour varies by status value:
   *   - `"none"` → DELETE the status row (user resets their progress)
   *   - Any other status → UPSERT with the new status value
   *
   * Timestamp side-effects:
   *   - `"solved"` → sets `solved_at` to now
   *   - `"attempted"` / `"in_progress"` → sets `last_attempted_at` to now
   *
   * @param userId - The user's uid
   * @param problemId - The problem's unique identifier
   * @param status - The new status value
   * @returns Result indicating success or error
   */
  async setProblemStatus(
    userId: string,
    problemId: string,
    status: ProblemStatus
  ): Promise<{ success: boolean; error?: string }> {
    if (!userId || !problemId) {
      Logger.debug("[StatusOps.set] Skipped — missing required params", { userId, problemId });
      return { success: false, error: "User ID and Problem ID are required." };
    }

    Logger.debug("[StatusOps.set] Setting problem status", { userId, problemId, status });

    try {
      if (status === "none") {
        // Remove the status row entirely (user wants to reset progress)
        Logger.debug("[StatusOps.set] Status is 'none' — deleting row", { userId, problemId });

        const { error } = await this.supabase
          .from("user_problem_status")
          .delete()
          .eq("uid", userId)
          .eq("problem_id", problemId);
          
        if (error) {
          Logger.error("[StatusOps.set] Delete failed", error, { userId, problemId });
          throw error;
        }
      } else {
        // Upsert: create or update the status row
        const updates: UserProblemStatusUpdate = {
           uid: userId,
           problem_id: problemId,
           status: status,
           updated_at: new Date().toISOString()
        };

        // Set additional timestamp fields based on the status transition
        if (status === 'solved') {
            updates.solved_at = new Date().toISOString();
            Logger.debug("[StatusOps.set] Marking as solved — setting solved_at", { userId, problemId });
        } else if (status === 'attempted' || status === 'in_progress') {
            updates.last_attempted_at = new Date().toISOString();
            Logger.debug("[StatusOps.set] Marking as attempted/in_progress — setting last_attempted_at", {
              userId, problemId,
            });
        }

        const { error } = await this.supabase
          .from("user_problem_status")
          .upsert(updates, { onConflict: "uid,problem_id" });

        if (error) {
          Logger.error("[StatusOps.set] Upsert failed", error, { userId, problemId, status });
          throw error;
        }
      }

      Logger.info("[StatusOps.set] Problem status updated successfully", {
        userId,
        problemId,
        status,
      });

      return { success: true };
    } catch (error) {
      Logger.error("[StatusOps.set] Unexpected error", error, { userId, problemId, status });
      return {
        success: false,
        error: "An unexpected error occurred while updating problem status.",
      };
    }
  }
}
