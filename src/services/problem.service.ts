import { problemRepository } from "@/repositories/problem.repository";
import {
  DifficultyFilter,
  LastAskedFilter,
  SortKey,
  PaginatedProblemsResponse,
  LeetCodeProblem,
  Company,
} from "@/types";
import { unstable_cache } from "next/cache";

export class ProblemService {
  async getProblemsByCompany(
    companyId: string,
    params: {
      cursor?: string;
      page?: number;     
      pageSize?: number;
      difficultyFilter?: DifficultyFilter[];
      lastAskedFilter?: LastAskedFilter[];
      searchTerm?: string;
      sortKey?: SortKey;
      userId?: string;
      companySlug?: string;
      totalProblemCount?: number;
      difficultyCounts?: { Easy: number; Medium: number; Hard: number };
      recencyCounts?: {
        last_30_days: number;
        within_3_months: number;
        within_6_months: number;
        older_than_6_months: number;
      };
    } = {},
  ): Promise<PaginatedProblemsResponse> {
    const {
        cursor,
        page,
        pageSize = 10,
        difficultyFilter = [],
        lastAskedFilter = [],
        searchTerm = "",
        sortKey = "title",
        companySlug,
        totalProblemCount,
        difficultyCounts,
        recencyCounts,
    } = params;

    const cacheKey = `problems-${companyId}-${JSON.stringify({
        cursor,
        page,
        pageSize,
        difficultyFilter,
        lastAskedFilter,
        searchTerm,
        sortKey,
    })}`;

    const getCachedProblems = unstable_cache(
        async () => {
            return await problemRepository.getProblemsByCompany(companyId, {
                cursor,
                page,
                pageSize,
                difficultyFilter,
                lastAskedFilter,
                searchTerm,
                sortKey,
                companySlug,
                totalProblemCount,
                difficultyCounts,
                recencyCounts,
                userId: undefined,
            });
        },
        [cacheKey],
        {
            revalidate: 3600, // 1 hour
            tags: [`problems-company-${companyId}`],
        }
    );

    const { problems, totalProblems, hasMore, nextCursor, totalPages, currentPage } = await getCachedProblems();

    // Fallback if repository doesn't return pagination metadata yet (though we just added it)
    const finalTotalPages = totalPages ?? Math.ceil((totalProblemCount || totalProblems || 0) / pageSize);
    const finalCurrentPage = currentPage ?? (page || 1);

    if (params.userId) {
        const { userService } = await import("../services/user.service");
        
        const problemIds = problems.map((p) => p.id);
        const [userBookmarks, userStatuses] = await Promise.all([
             userService.getBookmarksForIds(params.userId, problemIds),
             userService.getProblemStatusesForIds(params.userId, problemIds),
        ]);
        
        const finalProblems = problems.map((problem) => {
            const statusInfo = userStatuses[problem.id];
            return {
              ...problem,
              isBookmarked: userBookmarks.has(problem.id),
              currentStatus: statusInfo ? statusInfo.status : undefined,
            };
        });

        return {
            problems: finalProblems,
            totalProblems,
            hasMore,
            nextCursor,
            totalPages: finalTotalPages,
            currentPage: finalCurrentPage,
        };
    }
    
    return {
        problems,
        totalProblems,
        hasMore,
        nextCursor,
        totalPages: finalTotalPages,
        currentPage: finalCurrentPage,
    };
  }

  async getAllProblemsPaginated(
    params: {
      cursor?: string;
      page?: number;
      pageSize?: number;
      difficultyFilter?: DifficultyFilter[];
      lastAskedFilter?: LastAskedFilter[];
      searchTerm?: string;
      sortKey?: SortKey;
      userId?: string;
    } = {},
  ): Promise<PaginatedProblemsResponse> {
      const {
        cursor,
        page,
        pageSize = 10,
        difficultyFilter = [],
        lastAskedFilter = [],
        searchTerm = "",
        sortKey = "title",
      } = params;
      
      const cacheKey = `all-problems-v3-${JSON.stringify({
        cursor,
        page,
        pageSize,
        difficultyFilter,
        lastAskedFilter,
        searchTerm,
        sortKey,
      })}`;

      const getCachedProblems = unstable_cache(
        async () => {
            return await problemRepository.getAllProblemsPaginated({
                cursor,
                page,
                pageSize,
                difficultyFilter,
                lastAskedFilter,
                searchTerm,
                sortKey,
                userId: undefined,
            });
        },
        [cacheKey],
        {
            revalidate: 3600, // 1 hour
            tags: ["all-problems-v3"],
        }
      );

      const { problems, totalProblems, hasMore, nextCursor, totalPages, currentPage } = await getCachedProblems();

      if (params.userId) {
          const { userService } = await import("./user.service");
          const problemIds = problems.map((p) => p.id);
            const [userBookmarks, userStatuses] = await Promise.all([
                userService.getBookmarksForIds(params.userId, problemIds),
                userService.getProblemStatusesForIds(params.userId, problemIds),
            ]);

            const finalProblems = problems.map((problem) => {
                const statusInfo = userStatuses[problem.id];
                return {
                ...problem,
                isBookmarked: userBookmarks.has(problem.id),
                currentStatus: statusInfo ? statusInfo.status : undefined,
                };
            });

            return {
                problems: finalProblems,
                totalProblems,
                hasMore,
                nextCursor,
                totalPages,
                currentPage,
            };
      }

      return {
          problems,
          totalProblems,
          hasMore,
          nextCursor,
          totalPages,
          currentPage,
      };
  }

  async getAllProblems(): Promise<LeetCodeProblem[]> {
    const getCachedAllProblems = unstable_cache(
        async () => problemRepository.getAllProblems(),
        ["all-problems-list"],
        {
            revalidate: 86400, // 24 hours
            tags: ["all-problems"],
        }
    );
    return await getCachedAllProblems();
  }

  async getProblemDetails(companyId: string, problemId: string): Promise<LeetCodeProblem | undefined> {
    // Problem ID is the slug
    const getCachedProblem = unstable_cache(
        async () => problemRepository.getProblemDetails(companyId, problemId),
        [`problem-details-${companyId}-${problemId}`],
        {
            revalidate: 3600, // 1 hour
            tags: [`problem-${problemId}`, `company-${companyId}`],
        }
    );
    return await getCachedProblem();
  }

  async getProblemByCompanySlugAndProblemSlug(
    companySlug: string,
    problemSlug: string,
  ): Promise<{ company: Company | undefined; problem: LeetCodeProblem | undefined }> {
      const getCached = unstable_cache(
          async () => problemRepository.getProblemByCompanySlugAndProblemSlug(companySlug, problemSlug),
          [`problem-by-slugs-${companySlug}-${problemSlug}`],
          {
              revalidate: 3600,
              tags: [`company-slug-${companySlug}`, `problem-${problemSlug}`],
          }
      );
      return await getCached();
  }

  async getAllProblemCompanyAndProblemSlugs(): Promise<
    Array<{ companySlug: string; problemSlug: string }>
  > {
      const getCachedSlugs = unstable_cache(
          async () => problemRepository.getAllProblemCompanyAndProblemSlugs(),
          ["all-problem-company-slugs"], // Cache Key
          {
              revalidate: 86400, // 24 hours
              tags: ["problems-slugs"],
          }
      );
      return await getCachedSlugs();
  }

  async addProblem(
    companyId: string,
    problemData: Omit<
      LeetCodeProblem,
      "id" | "companyId" | "companySlug" | "slug"
    > & { normalizedTitle: string },
  ): Promise<{ id: string | null; updated: boolean; error?: string }> {
      return await problemRepository.addProblem(companyId, problemData);
  }
}

export const problemService = new ProblemService();
