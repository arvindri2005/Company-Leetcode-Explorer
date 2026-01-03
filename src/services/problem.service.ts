import { problemRepository } from "@/repositories/problem.repository";
import { companyService } from "@/services/company.service";
import {
  DifficultyFilter,
  LastAskedFilter,
  SortKey,
  PaginatedProblemsResponse,
  LeetCodeProblem,
  Company,
} from "@/types";
import { unstable_cache } from "next/cache";
import { Logger } from "@/lib/logger";

export class ProblemService {
  async getPublicProblems(
    companyId: string,
    params: {
      cursor?: string;
      page?: number;     
      pageSize?: number;
      difficultyFilter?: DifficultyFilter[];
      lastAskedFilter?: LastAskedFilter[];
      searchTerm?: string;
      sortKey?: SortKey;
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

    // Unified caching for all queries (default + filtered)
    const cacheKey = `problems-public-${companyId}-${JSON.stringify({
        cursor,
        page,
        pageSize,
        difficultyFilter,
        lastAskedFilter,
        searchTerm,
        sortKey,
    })}`;

    const fetchProblems = async () => {
        const startTime = Date.now();
        Logger.info(`[Cache MISS] Fetching public problems`, {
            companyId,
            params: { page, pageSize, difficultyFilter, lastAskedFilter, searchTerm, sortKey }
        });

        try {
            const result = await problemRepository.getProblemsByCompany(companyId, {
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
            });

            Logger.info(`[Cache REFRESH] Fetched public problems`, {
                companyId,
                durationMs: Date.now() - startTime,
                resultCount: result.problems.length,
            });

            return result;
        } catch (error) {
            Logger.error(`[Cache FAIL] Failed to fetch public problems`, error, { companyId });
            throw error;
        }
    };

    const getCachedProblems = unstable_cache(
        fetchProblems,
        [cacheKey],
        {
            revalidate: 2592000, // 30 days
            tags: [`problems-company-${companyId}`],
        }
    );
    
    const { problems, totalProblems, hasMore, nextCursor, totalPages, currentPage } = await getCachedProblems();
    const finalTotalPages = totalPages ?? Math.ceil((totalProblemCount || totalProblems || 0) / pageSize);
    const finalCurrentPage = currentPage ?? (page || 1);

    return {
        problems,
        totalProblems,
        hasMore,
        nextCursor,
        totalPages: finalTotalPages,
        currentPage: finalCurrentPage,
    };
  }

  async getProblemsByCompanySlug(
    companySlug: string,
    params: Parameters<ProblemService["getPublicProblems"]>[1]
  ): Promise<PaginatedProblemsResponse> {
      // Direct optimization: Use slug as ID (invariant in our system)
      return this.getPublicProblems(companySlug, { ...params, companySlug });
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

            });
        },
        [cacheKey],
        {
            revalidate: 2592000, // 30 days
            tags: ["all-problems-v3"],
        }
      );

      return await getCachedProblems();
  }

  async getAllProblems(): Promise<LeetCodeProblem[]> {
    const getCachedAllProblems = unstable_cache(
        async () => problemRepository.getAllProblems(),
        ["all-problems-list"],
        {
            revalidate: 2592000, // 30 days
            tags: ["all-problems"],
        }
    );
    return await getCachedAllProblems();
  }

  async getProblemDetails(companyId: string, problemId: string): Promise<LeetCodeProblem | undefined> {
    // Problem ID is the slug
    const getCachedProblem = unstable_cache(
        async () => {
            const startTime = Date.now();
            Logger.info(`[Cache MISS] Fetching problem details`, { companyId, problemId });
            try {
                const result = await problemRepository.getProblemDetails(companyId, problemId);
                Logger.info(`[Cache REFRESH] Fetched problem details`, {
                    companyId,
                    problemId,
                    durationMs: Date.now() - startTime,
                    found: !!result
                });
                return result;
            } catch (error) {
                Logger.error(`[Cache FAIL] Failed to fetch problem details`, error, { companyId, problemId });
                throw error;
            }
        },
        [`problem-details-${companyId}-${problemId}`],
        {
            revalidate: 2592000, // 30 days
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
              revalidate: 2592000, // 30 days
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
              revalidate: 2592000, // 30 days
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
