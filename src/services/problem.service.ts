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
import { cacheManager, CacheTTL } from "@/lib/cache";
import { Logger } from "@/lib/logger";
import { randomUUID } from "crypto";

export class ProblemService {
  private async withObservability<T>(
    operationName: string,
    operation: () => Promise<T>,
    metadata: Record<string, any> = {}
  ): Promise<T> {
    const startTime = Date.now();
    const requestId = randomUUID();

    Logger.info(`[ProblemService] Starting ${operationName}`, {
      requestId,
      operationName,
      ...metadata,
    });

    try {
      const result = await operation();
      const durationMs = Date.now() - startTime;

      let resultCount: number | undefined;
      let success = true;

      // Check for result count
      if (Array.isArray(result)) {
        resultCount = result.length;
      } else if (result && typeof result === 'object') {
        if (Array.isArray((result as any).problems)) {
          resultCount = (result as any).problems.length;
        }
        // Check for soft error pattern
        if ((result as any).error) {
            success = false;
        }
      }

      if (success) {
        Logger.info(`[ProblemService] Completed ${operationName}`, {
            requestId,
            operationName,
            durationMs,
            success: true,
            resultCount,
        });
      } else {
        Logger.warn(`[ProblemService] Completed ${operationName} with logical error`, {
            requestId,
            operationName,
            durationMs,
            success: false,
            error: (result as any).error,
            resultCount,
        });
      }

      return result;
    } catch (error) {
      const durationMs = Date.now() - startTime;
      Logger.error(`[ProblemService] Failed ${operationName}`, error, {
        requestId,
        operationName,
        durationMs,
        success: false,
        ...metadata,
      });
      throw error;
    }
  }

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

    return this.withObservability(
      "getPublicProblems",
      async () => {
        // Unified caching for all queries (default + filtered)
        // Sort array filters to ensure consistent cache keys regardless of selection order
        const cacheKey = `problems-public-${companyId}-${JSON.stringify({
            cursor,
            page,
            pageSize,
            difficultyFilter: [...difficultyFilter].sort(),
            lastAskedFilter: [...lastAskedFilter].sort(),
            searchTerm,
            sortKey,
        })}`;

        const cachedResult = await cacheManager.wrap(
            cacheKey,
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
                });
            },
            {
                revalidate: CacheTTL.STATIC, // 30 days
                tags: [`problems-company-${companyId}`],
            }
        );

        const { problems, totalProblems, hasMore, nextCursor, totalPages, currentPage } = cachedResult;

        // Apply default pagination logic that might be computed at runtime or missing from older cached entries
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
      },
      { companyId, companySlug, params: { ...params, totalProblemCount: undefined } } // Exclude potentially large/redundant fields from metadata log
    );
  }

  async getProblemsByCompanySlug(
    companySlug: string,
    params: Parameters<ProblemService["getPublicProblems"]>[1]
  ): Promise<PaginatedProblemsResponse> {
      // Direct optimization: Use slug as ID (invariant in our system)
      // No extra observability wrapper needed here as it delegates to getPublicProblems which has it.
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
      
      return this.withObservability(
        "getAllProblemsPaginated",
        async () => {
          const cacheKey = `all-problems-v3-${JSON.stringify({
            cursor,
            page,
            pageSize,
            difficultyFilter: [...difficultyFilter].sort(),
            lastAskedFilter: [...lastAskedFilter].sort(),
            searchTerm,
            sortKey,
          })}`;

          return await cacheManager.wrap(
            cacheKey,
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
            {
                revalidate: CacheTTL.STATIC, // 30 days
                tags: ["all-problems-v3"],
            }
          );
        },
        { params }
      );
  }

  async getAllProblems(): Promise<LeetCodeProblem[]> {
    return this.withObservability(
      "getAllProblems",
      async () => {
        return await cacheManager.wrap(
            "all-problems-list",
            async () => problemRepository.getAllProblems(),
            {
                revalidate: CacheTTL.STATIC, // 30 days
                tags: ["all-problems"],
            }
        );
      }
    );
  }

  async getProblemDetails(companyId: string, problemId: string): Promise<LeetCodeProblem | undefined> {
    return this.withObservability(
      "getProblemDetails",
      async () => {
        // Problem ID is the slug
        return await cacheManager.wrap(
            `problem-details-${companyId}-${problemId}`,
            async () => problemRepository.getProblemDetails(companyId, problemId),
            {
                revalidate: CacheTTL.STATIC, // 30 days
                tags: [`problem-${problemId}`, `company-${companyId}`],
            }
        );
      },
      { companyId, problemId }
    );
  }

  async getProblemByCompanySlugAndProblemSlug(
    companySlug: string,
    problemSlug: string,
  ): Promise<{ company: Company | undefined; problem: LeetCodeProblem | undefined }> {
      return this.withObservability(
        "getProblemByCompanySlugAndProblemSlug",
        async () => {
          return await cacheManager.wrap(
              `problem-by-slugs-${companySlug}-${problemSlug}`,
              async () => problemRepository.getProblemByCompanySlugAndProblemSlug(companySlug, problemSlug),
              {
                  revalidate: CacheTTL.STATIC, // 30 days
                  tags: [`company-slug-${companySlug}`, `problem-${problemSlug}`],
              }
          );
        },
        { companySlug, problemSlug }
      );
  }

  async getAllProblemCompanyAndProblemSlugs(): Promise<
    Array<{ companySlug: string; problemSlug: string }>
  > {
      return this.withObservability(
        "getAllProblemCompanyAndProblemSlugs",
        async () => {
          return await cacheManager.wrap(
              "all-problem-company-slugs",
              async () => problemRepository.getAllProblemCompanyAndProblemSlugs(),
              {
                  revalidate: CacheTTL.STATIC, // 30 days
                  tags: ["problems-slugs"],
              }
          );
        }
      );
  }

  async addProblem(
    companyId: string,
    problemData: Omit<
      LeetCodeProblem,
      "id" | "companyId" | "companySlug" | "slug"
    > & { normalizedTitle: string },
  ): Promise<{ id: string | null; updated: boolean; error?: string }> {
      return this.withObservability(
        "addProblem",
        async () => {
          return await problemRepository.addProblem(companyId, problemData);
        },
        { companyId, problemTitle: problemData.title }
      );
  }
}

export const problemService = new ProblemService();
