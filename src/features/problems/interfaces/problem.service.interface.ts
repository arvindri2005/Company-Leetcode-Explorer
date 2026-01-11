/**
 * Problem Service Interface
 * Defines business operations for Problem entities
 */

import type { Result } from "@/shared/types/result";
import type { ServiceError } from "@/shared/types/service-error";
import type {
  DifficultyFilter,
  LastAskedFilter,
  LastAskedPeriod,
  SortKey,
  PaginatedProblemsResponse,
  LeetCodeProblem,
} from "../types";
import type { Company } from "@/features/companies/types";

/**
 * Parameters for fetching public problems
 */
export interface GetPublicProblemsParams {
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
}

/**
 * Parameters for fetching all problems paginated
 */
export interface GetAllProblemsParams {
  cursor?: string;
  page?: number;
  pageSize?: number;
  difficultyFilter?: DifficultyFilter[];
  lastAskedFilter?: LastAskedFilter[];
  searchTerm?: string;
  sortKey?: SortKey;
}

/**
 * Input data for creating a new problem via service
 */
export interface CreateProblemInput {
  title: string;
  difficulty: "Easy" | "Medium" | "Hard";
  link: string;
  tags: string[];
  normalizedTitle: string;
  acceptanceRate?: number;
  lastAskedPeriod?: LastAskedPeriod;
}

/**
 * Problem Service Interface
 * Defines all business operations for problems
 */
export interface IProblemService {
  /**
   * Get public problems for a company with filtering and pagination
   * @param companyId - The company's unique identifier
   * @param params - Filter and pagination parameters
   * @returns Result containing paginated problems or error
   */
  getPublicProblems(
    companyId: string,
    params?: GetPublicProblemsParams
  ): Promise<Result<PaginatedProblemsResponse, ServiceError>>;

  /**
   * Get problems by company slug with filtering and pagination
   * @param companySlug - The company's slug
   * @param params - Filter and pagination parameters
   * @returns Result containing paginated problems or error
   */
  getProblemsByCompanySlug(
    companySlug: string,
    params?: GetPublicProblemsParams
  ): Promise<Result<PaginatedProblemsResponse, ServiceError>>;

  /**
   * Get all problems with filtering and pagination
   * @param params - Filter and pagination parameters
   * @returns Result containing paginated problems or error
   */
  getAllProblemsPaginated(
    params?: GetAllProblemsParams
  ): Promise<Result<PaginatedProblemsResponse, ServiceError>>;

  /**
   * Get all problems without pagination
   * @returns Result containing all problems or error
   */
  getAllProblems(): Promise<Result<LeetCodeProblem[], ServiceError>>;

  /**
   * Get problem details by company ID and problem ID
   * @param companyId - The company's unique identifier
   * @param problemId - The problem's unique identifier (slug)
   * @returns Result containing the problem or error
   */
  getProblemDetails(
    companyId: string,
    problemId: string
  ): Promise<Result<LeetCodeProblem, ServiceError>>;

  /**
   * Get problem by company slug and problem slug
   * @param companySlug - The company's slug
   * @param problemSlug - The problem's slug
   * @returns Result containing company and problem or error
   */
  getProblemByCompanySlugAndProblemSlug(
    companySlug: string,
    problemSlug: string
  ): Promise<Result<{ company: Company; problem: LeetCodeProblem }, ServiceError>>;

  /**
   * Get all problem and company slug combinations
   * @returns Result containing slug pairs or error
   */
  getAllProblemCompanyAndProblemSlugs(): Promise<
    Result<Array<{ companySlug: string; problemSlug: string }>, ServiceError>
  >;

  /**
   * Add a new problem to a company
   * @param companyId - The company's unique identifier
   * @param problemData - The problem data to add
   * @returns Result containing the created problem ID or error
   */
  addProblem(
    companyId: string,
    problemData: CreateProblemInput
  ): Promise<Result<{ id: string; updated: boolean }, ServiceError>>;
}
