/**
 * Company Repository Interface
 * Defines data access operations for Company entities
 */

import type { Company as CompanyEntity } from "@/domain/entities/company.entity";
import type { IBaseRepository, PaginationParams } from "@/shared/interfaces";

import type { Company } from "../types";

/**
 * Parameters for fetching companies
 */
export interface GetCompaniesParams extends PaginationParams {
  searchTerm?: string;
}

/**
 * Paginated companies response
 */
export interface PaginatedCompaniesResponse {
  companies: Company[];
  totalCompanies: number;
  hasMore: boolean;
  nextCursor?: string;
  totalPages?: number;
  currentPage?: number;
}

/**
 * DTO for creating a new company
 */
export interface CreateCompanyDTO {
  name: string;
  normalizedName?: string;
  logo?: string;
  description?: string;
  website?: string;
  relatedCompanies?: string[];
}

/**
 * DTO for updating an existing company
 */
export interface UpdateCompanyDTO {
  name?: string;
  normalizedName?: string;
  logo?: string;
  description?: string;
  website?: string;
  problemCount?: number;
  difficultyCounts?: { Easy: number; Medium: number; Hard: number };
  recencyCounts?: {
    last_30_days: number;
    within_3_months: number;
    within_6_months: number;
    older_than_6_months: number;
  };
  commonTags?: Array<{ tag: string; count: number }>;
  relatedCompanies?: string[];
  statsLastUpdatedAt?: Date;
}

/**
 * Company Repository Interface
 * Extends base repository with company-specific operations
 */
export interface ICompanyRepository extends IBaseRepository<CompanyEntity, CreateCompanyDTO, UpdateCompanyDTO> {
  /**
   * Get companies with pagination and optional search
   * @param params - Pagination and search parameters
   * @returns Paginated result of companies
   */
  getCompanies(params?: GetCompaniesParams): Promise<PaginatedCompaniesResponse>;

  /**
   * Get a company by its unique identifier
   * @param id - The company's unique identifier
   * @returns The company if found, undefined otherwise
   */
  getCompanyById(id: string): Promise<Company | undefined>;

  /**
   * Get a company by its slug
   * @param slug - The company's slug
   * @returns The company if found, undefined otherwise
   */
  getCompanyBySlug(slug: string): Promise<Company | undefined>;

  /**
   * Get all company slugs
   * @param includeHidden - Whether to include hidden companies
   * @returns Array of company slugs
   */
  getAllCompanySlugs(includeHidden?: boolean): Promise<string[]>;

  /**
   * Add a new company
   * @param companyData - The company data to add
   * @returns Result with ID if created, or error/alreadyExists flag
   */
  addCompany(
    companyData: CreateCompanyDTO
  ): Promise<{ id: string | null; error?: string; alreadyExists?: boolean }>;

  /**
   * Update an existing company
   * @param companyId - The company's unique identifier
   * @param companyData - The data to update
   * @returns Result indicating success or error
   */
  updateCompany(
    companyId: string,
    companyData: UpdateCompanyDTO
  ): Promise<{ success: boolean; error?: string }>;

  /**
   * Fetch company suggestions for autocomplete
   * @param searchTerm - The search term to match
   * @param limit - Maximum number of suggestions to return
   * @returns Array of company suggestions
   */
  fetchCompanySuggestions(
    searchTerm: string,
    limit?: number
  ): Promise<Array<Pick<Company, "id" | "name" | "slug" | "logo">>>;
}
