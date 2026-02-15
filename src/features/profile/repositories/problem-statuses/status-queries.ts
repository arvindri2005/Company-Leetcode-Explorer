/**
 * Problem Status Queries Module
 * Handles problem status query operations
 */

import { createSupabaseBrowserClient } from "@/shared/lib/api/supabase-browser";
import { Logger } from "@/shared/lib/utils/logger";
import type { ProblemStatus, UserProblemStatusInfo } from "@/shared/types";

/**
 * Interface for problem status query operations
 */
export interface StatusQueries {
  /**
   * Get problem statuses for specific problem IDs
   */
  getProblemStatusesForIds(
    userId: string,
    problemIds: string[]
  ): Promise<Record<string, UserProblemStatusInfo>>;
}

/**
 * Implementation of problem status query operations
 */
export class StatusQueriesImpl implements StatusQueries {
  private supabase = createSupabaseBrowserClient();

  /**
   * Get problem statuses for specific problem IDs
   * @param userId - The user's unique identifier
   * @param problemIds - Array of problem IDs to fetch statuses for
   * @returns Record of problem ID to status info
   */
  async getProblemStatusesForIds(
    userId: string,
    problemIds: string[]
  ): Promise<Record<string, UserProblemStatusInfo>> {
    if (!userId || !problemIds || problemIds.length === 0) {
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
        .in("problem_id", problemIds);

      if (error) {
        throw error;
      }

      if (data) {
        data.forEach((row: any) => {
           const problem = row.problems;
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
      Logger.error(`Error fetching problem statuses`, error, { userId });
      return {};
    }
  }
}
