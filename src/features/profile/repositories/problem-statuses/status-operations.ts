/**
 * Problem Status Operations Module
 * Handles problem status CRUD operations
 */

import { createSupabaseBrowserClient } from "@/shared/lib/api/supabase-browser";
import { Logger } from "@/shared/lib/utils/logger";
import type { ProblemStatus, UserProblemStatusInfo } from "@/shared/types";

/**
 * Interface for Supabase query result from user_problem_status
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
 * Interface for problem status updates
 */
interface UserProblemStatusUpdate {
  uid: string;
  problem_id: string;
  status: string;
  updated_at: string;
  solved_at?: string;
  last_attempted_at?: string;
}

/**
 * Interface for problem status operations
 */
export interface StatusOperations {
  /**
   * Get all problem statuses for a user
   */
  getAllUserProblemStatuses(userId: string): Promise<Record<string, UserProblemStatusInfo>>;

  /**
   * Get user's global problem stats
   */
  getUserGlobalProblemStats(userId: string): Promise<{
    solvedProblemIds: string[];
    attemptedProblemIds: string[];
    bookmarkedProblemIds: string[];
  }>;

  /**
   * Set problem status for a user
   */
  setProblemStatus(
    userId: string,
    problemId: string,
    status: ProblemStatus,
    companySlug: string,
    problemSlug: string
  ): Promise<{ success: boolean; error?: string }>;
}

/**
 * Implementation of problem status operations
 */
export class StatusOperationsImpl implements StatusOperations {
  private supabase = createSupabaseBrowserClient();

  /**
   * Get all problem statuses for a user
   * @param userId - The user's unique identifier
   * @returns Record of problem ID to status info
   */
  async getAllUserProblemStatuses(
    userId: string
  ): Promise<Record<string, UserProblemStatusInfo>> {
    if (!userId) {
      return {};
    }
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
        throw error;
      }

      if (data) {
        (data as unknown as UserProblemStatusQueryResult[]).forEach((row) => {
          const problem = row.problems;
          // Determine company slug from available relationships
          const companySlug = problem?.company_problems?.[0]?.companies?.slug;
          
           if (row.problem_id && row.status && problem?.slug && companySlug) {
              statuses[row.problem_id] = {
                problemId: row.problem_id,
                status: row.status as ProblemStatus,
                companySlug: companySlug,
                problemSlug: problem.slug,
                updatedAt: new Date(row.updated_at),
              };
           }
        });
      }
      return statuses;
    } catch (error) {
      Logger.error(`Error fetching all problem statuses`, error, { userId });
      return {};
    }
  }

  /**
   * Get user's global problem stats
   * @param userId - The user's unique identifier
   * @returns User's global problem stats
   */
  async getUserGlobalProblemStats(userId: string): Promise<{
    solvedProblemIds: string[];
    attemptedProblemIds: string[];
    bookmarkedProblemIds: string[];
  }> {
    if (!userId) {
      return { solvedProblemIds: [], attemptedProblemIds: [], bookmarkedProblemIds: [] };
    }
    try {
      // Execute 3 parallel queries to get the stats
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
          .in("status", ["attempted", "in_progress"]), // Assuming these count as attempted
        this.supabase
          .from("user_bookmarks")
          .select("problem_id")
          .eq("uid", userId)
      ]);

      if (solvedRes.error) {throw solvedRes.error;}
      if (attemptedRes.error) {throw attemptedRes.error;}
      if (bookmarkRes.error) {throw bookmarkRes.error;}

      return {
        solvedProblemIds: solvedRes.data?.map(r => r.problem_id) || [],
        attemptedProblemIds: attemptedRes.data?.map(r => r.problem_id) || [],
        bookmarkedProblemIds: bookmarkRes.data?.map(r => r.problem_id) || [],
      };
    } catch (error) {
      Logger.error(`Error fetching global problem stats`, error, { userId });
      return { solvedProblemIds: [], attemptedProblemIds: [], bookmarkedProblemIds: [] };
    }
  }

  /**
   * Set problem status for a user
   * @param userId - The user's unique identifier
   * @param problemId - The problem's unique identifier
   * @param status - The new status
   * @param companySlug - The company's slug
   * @param problemSlug - The problem's slug
   * @returns Result indicating success or error
   */
  async setProblemStatus(
    userId: string,
    problemId: string,
    status: ProblemStatus
  ): Promise<{ success: boolean; error?: string }> {
    if (!userId || !problemId) {
      return { success: false, error: "User ID and Problem ID are required." };
    }

    try {
      if (status === "none") {
        // Remove status
        const { error } = await this.supabase
          .from("user_problem_status")
          .delete()
          .eq("uid", userId)
          .eq("problem_id", problemId);
          
        if (error) {throw error;}
      } else {
        // Upsert status
        const updates: UserProblemStatusUpdate = {
           uid: userId,
           problem_id: problemId,
           status: status,
           updated_at: new Date().toISOString()
        };

        if (status === 'solved') {
            updates.solved_at = new Date().toISOString();
        } else if (status === 'attempted' || status === 'in_progress') {
            updates.last_attempted_at = new Date().toISOString();
        }

        const { error } = await this.supabase
          .from("user_problem_status")
          .upsert(updates, { onConflict: "uid,problem_id" });

        if (error) {throw error;}
      }

      return { success: true };
    } catch (error) {
      Logger.error("Error setting problem status in Supabase", error);
      return {
        success: false,
        error: "An unexpected error occurred while updating problem status.",
      };
    }
  }
}
