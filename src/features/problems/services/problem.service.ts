import { problemRepository } from "../repositories/problem.repository";
import {
  DifficultyFilter,
  LastAskedFilter,
  SortKey,
  PaginatedProblemsResponse,
  LeetCodeProblem,
  Company,
} from "@/types";
import { cacheManager, CacheTTL } from "@/lib/utils/cache";
import { success, failure, type Result } from "@/shared/types/result";
import type { ServiceError } from "@/shared/types/service-error";
import type {
  IProblemService,
  GetPublicProblemsParams,
  GetAllProblemsParams,
  CreateProblemInput,
} from "../interfaces/problem.service.interface";
import type { IProblemRepository } from "../interfaces/problem.repository.interface";

export class ProblemService implements IProblemService {
  constructor(private readonly repository: IProblemRepository = problemRepository) {}

  async getPublicProblems(
    companyId: string,
    params: GetPublicProblemsParams = {},
  ): Promise<Result<PaginatedProblemsResponse, ServiceError>> {
    try {
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
          return await this.repository.getProblemsByCompany(companyId, {
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
          revalidate: CacheTTL.STATIC,
          tags: [`problems-company-${companyId}`],
        }
      );

      const { problems, totalProblems, hasMore, nextCursor, totalPages, currentPage } = cachedResult;
      
      const finalTotalPages = totalPages ?? Math.ceil((totalProblemCount || totalProblems || 0) / pageSize);
      const finalCurrentPage = currentPage ?? (page || 1);

      return success({
        problems,
        totalProblems,
        hasMore,
        nextCursor,
        totalPages: finalTotalPages,
        currentPage: finalCurrentPage,
      });
    } catch (error) {
      return failure({
        code: "INTERNAL_ERROR",
        message: "Failed to fetch public problems",
        details: { companyId },
        cause: error instanceof Error ? error : undefined,
      });
    }
  }

  async getProblemsByCompanySlug(
    companySlug: string,
    params: GetPublicProblemsParams = {}
  ): Promise<Result<PaginatedProblemsResponse, ServiceError>> {
    return this.getPublicProblems(companySlug, { ...params, companySlug });
  }

  async getAllProblemsPaginated(
    params: GetAllProblemsParams = {},
  ): Promise<Result<PaginatedProblemsResponse, ServiceError>> {
    try {
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
        difficultyFilter: [...difficultyFilter].sort(),
        lastAskedFilter: [...lastAskedFilter].sort(),
        searchTerm,
        sortKey,
      })}`;

      const result = await cacheManager.wrap(
        cacheKey,
        async () => {
          return await this.repository.getAllProblemsPaginated({
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
          revalidate: CacheTTL.STATIC,
          tags: ["all-problems-v3"],
        }
      );

      return success(result);
    } catch (error) {
      return failure({
        code: "INTERNAL_ERROR",
        message: "Failed to fetch all problems",
        cause: error instanceof Error ? error : undefined,
      });
    }
  }

  async getAllProblems(): Promise<Result<LeetCodeProblem[], ServiceError>> {
    try {
      const result = await cacheManager.wrap(
        "all-problems-list",
        async () => this.repository.getAllProblems(),
        {
          revalidate: CacheTTL.STATIC,
          tags: ["all-problems"],
        }
      );

      return success(result);
    } catch (error) {
      return failure({
        code: "INTERNAL_ERROR",
        message: "Failed to fetch all problems list",
        cause: error instanceof Error ? error : undefined,
      });
    }
  }

  async getProblemDetails(
    companyId: string,
    problemId: string
  ): Promise<Result<LeetCodeProblem, ServiceError>> {
    try {
      const result = await cacheManager.wrap(
        `problem-details-${companyId}-${problemId}`,
        async () => this.repository.getProblemDetails(companyId, problemId),
        {
          revalidate: CacheTTL.STATIC,
          tags: [`problem-${problemId}`, `company-${companyId}`],
        }
      );

      if (!result) {
        return failure({
          code: "NOT_FOUND",
          message: `Problem not found: ${problemId}`,
          details: { companyId, problemId },
        });
      }

      return success(result);
    } catch (error) {
      return failure({
        code: "INTERNAL_ERROR",
        message: "Failed to fetch problem details",
        details: { companyId, problemId },
        cause: error instanceof Error ? error : undefined,
      });
    }
  }

  async getProblemByCompanySlugAndProblemSlug(
    companySlug: string,
    problemSlug: string,
  ): Promise<Result<{ company: Company; problem: LeetCodeProblem }, ServiceError>> {
    try {
      const result = await cacheManager.wrap(
        `problem-by-slugs-${companySlug}-${problemSlug}`,
        async () => this.repository.getProblemByCompanySlugAndProblemSlug(companySlug, problemSlug),
        {
          revalidate: CacheTTL.STATIC,
          tags: [`company-slug-${companySlug}`, `problem-${problemSlug}`],
        }
      );

      if (!result.company) {
        return failure({
          code: "NOT_FOUND",
          message: `Company not found: ${companySlug}`,
          details: { companySlug, problemSlug },
        });
      }

      if (!result.problem) {
        return failure({
          code: "NOT_FOUND",
          message: `Problem not found: ${problemSlug}`,
          details: { companySlug, problemSlug },
        });
      }

      return success({
        company: result.company,
        problem: result.problem,
      });
    } catch (error) {
      return failure({
        code: "INTERNAL_ERROR",
        message: "Failed to fetch problem by slugs",
        details: { companySlug, problemSlug },
        cause: error instanceof Error ? error : undefined,
      });
    }
  }

  async getAllProblemCompanyAndProblemSlugs(): Promise<
    Result<Array<{ companySlug: string; problemSlug: string }>, ServiceError>
  > {
    try {
      const result = await cacheManager.wrap(
        "all-problem-company-slugs",
        async () => this.repository.getAllProblemCompanyAndProblemSlugs(),
        {
          revalidate: CacheTTL.STATIC,
          tags: ["problems-slugs"],
        }
      );

      return success(result);
    } catch (error) {
      return failure({
        code: "INTERNAL_ERROR",
        message: "Failed to fetch problem slugs",
        cause: error instanceof Error ? error : undefined,
      });
    }
  }

  async addProblem(
    companyId: string,
    problemData: CreateProblemInput,
  ): Promise<Result<{ id: string; updated: boolean }, ServiceError>> {
    try {
      const result = await this.repository.addProblem(companyId, problemData);

      if (result.error || !result.id) {
        return failure({
          code: "INTERNAL_ERROR",
          message: result.error || "Failed to add problem",
          details: { companyId },
        });
      }

      return success({
        id: result.id,
        updated: result.updated,
      });
    } catch (error) {
      return failure({
        code: "INTERNAL_ERROR",
        message: "Failed to add problem",
        details: { companyId },
        cause: error instanceof Error ? error : undefined,
      });
    }
  }
}

export const problemService = new ProblemService();
