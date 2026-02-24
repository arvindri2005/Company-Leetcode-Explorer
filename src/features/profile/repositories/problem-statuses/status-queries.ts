/**
 * Problem Status Queries Module
 *
 * Provides read-only query operations for problem statuses, optimised for
 * batch lookups (e.g. checking statuses for a list of problems on a company page).
 *
 * @module status-queries
 */

import { createSupabaseBrowserClient } from "@/shared/lib/api/supabase-browser";
import { Logger } from "@/shared/lib/utils/logger";
import type { ProblemStatus, UserProblemStatusInfo } from "@/shared/types";

/**
 * Interface for problem status query operations.
 */
export interface StatusQueries {
  /** Get statuses for a specific set of problem IDs */
  getProblemStatusesForIds(
    userId: string,
    problemIds: string[]
  ): Promise<Record<string, UserProblemStatusInfo>>;
}

/**
 * Shape of a raw Supabase result row with nested joins to resolve slugs.
 */
interface SupabaseProblemStatusRow {
  problem_id: string;
  status: string;
  updated_at: string;
  problems: {
    slug: string;
    company_problems: {
      companies: {
        slug: string;
      };
    }[];
  } | null;
}

/**
 * Supabase-backed implementation of {@link StatusQueries}.
 */
export class StatusQueriesImpl implements StatusQueries {
  private supabase = createSupabaseBrowserClient();

  /**
   * Get problem statuses for a specific set of problem IDs.
   *
   * Uses a nested select with `.in()` filter to batch-fetch statuses
   * along with problem and company slugs (needed for URL construction).
   * Rows with incomplete join data are silently skipped.
   *
   * @param userId - The user's uid
   * @param problemIds - Array of problem IDs to look up
   * @returns Record mapping problem ID → status info
   */
  async getProblemStatusesForIds(
    userId: string,
    problemIds: string[]
  ): Promise<Record<string, UserProblemStatusInfo>> {
    if (!userId || !problemIds || problemIds.length === 0) {
      Logger.debug("[StatusQueries.getForIds] Skipped — empty userId or problemIds");
      return {};
    }

    Logger.debug("[StatusQueries.getForIds] Fetching statuses for problem batch", {
      userId,
      problemCount: problemIds.length,
    });

    const statuses: Record<string, UserProblemStatusInfo> = {};

    try {
      // Nested join: user_problem_status → problems → company_problems → companies
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
        .in("problem_id", problemIds);

      if (error) {
        Logger.error("[StatusQueries.getForIds] Supabase query failed", error, { userId });
        throw error;
      }

      let skippedCount = 0;

      if (data) {
        (data as unknown as SupabaseProblemStatusRow[]).forEach((row) => {
           const problem = row.problems;
           // Resolve company slug from the first entry in the many-to-many join
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
            // Incomplete join data — skip this row
            skippedCount++;
           }
        });
      }

      Logger.debug("[StatusQueries.getForIds] Statuses resolved", {
        userId,
        requested: problemIds.length,
        found: Object.keys(statuses).length,
        skipped: skippedCount,
      });

      return statuses;
    } catch (error) {
      Logger.error("[StatusQueries.getForIds] Unexpected error", error, { userId });
      return {};
    }
  }
}
