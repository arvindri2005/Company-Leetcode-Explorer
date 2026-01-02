import { LeetCodeProblem } from "@/types";
import { userService } from "./user.service";
import { problemService } from "./problem.service";
import { PaginatedProblemsResponse, ProblemSummaryDTO } from "@/types";

/**
 * Service to bridge the gap between ProblemService and UserService,
 * decoupling them to prevent circular dependencies.
 * 
 * This service handles operations that require aggregating data from both domains,
 * specifically enriching problem data with user-specific status (bookmarks, solved status).
 */
export class UserProblemBridgeService {
  
  /**
   * Enriches a list of problems with user-specific data (bookmarks, status).
   */
  async enrichProblemsWithUserData(
    userId: string,
    problems: (LeetCodeProblem | ProblemSummaryDTO)[]
  ): Promise<(LeetCodeProblem | ProblemSummaryDTO)[]> {
    if (!problems.length) return problems;

    const problemIds = problems.map((p) => p.id);
    const [userBookmarks, userStatuses] = await Promise.all([
      userService.getBookmarksForIds(userId, problemIds),
      userService.getProblemStatusesForIds(userId, problemIds),
    ]);

    return problems.map((problem) => {
      const statusInfo = userStatuses[problem.id];
      return {
        ...problem,
        isBookmarked: userBookmarks.has(problem.id),
        currentStatus: statusInfo ? statusInfo.status : undefined,
      };
    });
  }

  /**
   * Fetches paginated problems and enriches them with user status if a userId is provided.
   */
  async getAllProblemsPaginatedWithUserStatus(
    params: Parameters<typeof problemService.getAllProblemsPaginated>[0] & { userId?: string }
  ): Promise<PaginatedProblemsResponse> {
    const { userId, ...problemParams } = params;

    // Call the base service which now only returns raw problem data
    const response = await problemService.getAllProblemsPaginated(problemParams);

    if (!userId) {
      return response;
    }

    const finalProblems = await this.enrichProblemsWithUserData(userId, response.problems);

    return {
      ...response,
      problems: finalProblems,
    };
  }

  /**
   * Fetches user statuses for a specific list of problem IDs.
   */
  async getUserProblemStatuses(
      userId: string,
      problemIds: string[]
  ): Promise<Record<string, { isBookmarked: boolean; status?: string }>> {
      const [userBookmarks, userStatuses] = await Promise.all([
           userService.getBookmarksForIds(userId, problemIds),
           userService.getProblemStatusesForIds(userId, problemIds),
      ]);

      const result: Record<string, { isBookmarked: boolean; status?: string }> = {};
      problemIds.forEach(id => {
          const statusInfo = userStatuses[id];
          result[id] = {
              isBookmarked: userBookmarks.has(id),
              status: statusInfo ? statusInfo.status : undefined
          };
      });
      return result;
  }
}

export const userProblemBridgeService = new UserProblemBridgeService();
