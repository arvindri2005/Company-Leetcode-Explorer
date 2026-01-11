/**
 * Problem Repository Interface
 * Defines data access operations for Problem entities
 */

import type { Problem } from "@/domain/entities/problem.entity";
import type { IBaseRepository, PaginatedResult, PaginationParams } from "@/shared/interfaces";
import type {
  DifficultyFilter,
  LastAskedFilter,
  LastAskedPeriod,
  SortKey,
  LeetCodeProblem,
  PaginatedProblemsResponse,
} from "../types";
import type { Company } from "@/features/companies/types";

/**
 * Filter parameters for problem queries
 */
export interface ProblemFilterParams extends PaginationParams {
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
 * DTO for creating a new problem
 */
export interface CreateProblemDTO {
  title: string;
  description?: string;
  difficulty: "Easy" | "Medium" | "Hard";
  link: string;
  tags: string[];
  normalizedTitle: string;
  acceptanceRate?: number;
  lastAskedPeriod?: LastAskedPeriod;
}

/**
 * DTO for updating an existing problem
 */
export interface UpdateProblemDTO {
  title?: string;
  description?: string;
  difficulty?: "Easy" | "Medium" | "Hard";
  link?: string;
  tags?: string[];
  normalizedTitle?: string;
  acceptanceRate?: number;
  lastAskedPeriod?: LastAskedPeriod;
}

/**
 * Problem Repository Interface
 * Extends base repository with problem-specific operations
 */
export interface IProblemRepository extends IBaseRepository<Problem, CreateProblemDTO, UpdateProblemDTO> {
  /**
   * Get problems by company ID with filtering and pagination
   * @param companyId - The company's unique identifier
   * @param params - Filter and pagination parameters
   * @returns Paginated result of problems
   */
  getProblemsByCompany(
    companyId: string,
    params?: ProblemFilterParams
  ): Promise<PaginatedProblemsResponse>;

  /**
   * Get all problems with filtering and pagination
   * @param params - Filter and pagination parameters
   * @returns Paginated result of problems
   */
  getAllProblemsPaginated(
    params?: ProblemFilterParams
  ): Promise<PaginatedProblemsResponse>;

  /**
   * Get all problems without pagination
   * @returns Array of all problems
   */
  getAllProblems(): Promise<LeetCodeProblem[]>;

  /**
   * Get problem details by company ID and problem ID
   * @param companyId - The company's unique identifier
   * @param problemId - The problem's unique identifier (slug)
   * @returns The problem if found, undefined otherwise
   */
  getProblemDetails(
    companyId: string,
    problemId: string
  ): Promise<LeetCodeProblem | undefined>;

  /**
   * Get problem by company slug and problem slug
   * @param companySlug - The company's slug
   * @param problemSlug - The problem's slug
   * @returns Object containing company and problem if found
   */
  getProblemByCompanySlugAndProblemSlug(
    companySlug: string,
    problemSlug: string
  ): Promise<{ company: Company | undefined; problem: LeetCodeProblem | undefined }>;

  /**
   * Get all problem and company slug combinations
   * @returns Array of company and problem slug pairs
   */
  getAllProblemCompanyAndProblemSlugs(): Promise<
    Array<{ companySlug: string; problemSlug: string }>
  >;

  /**
   * Add a new problem to a company
   * @param companyId - The company's unique identifier
   * @param problemData - The problem data to add
   * @returns Result with ID if created, or updated flag if existing
   */
  addProblem(
    companyId: string,
    problemData: CreateProblemDTO
  ): Promise<{ id: string | null; updated: boolean; error?: string }>;
}
