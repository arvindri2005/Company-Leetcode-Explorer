/**
 * Company Service Interface
 * Defines business operations for Company entities
 */

import type { Result } from "@/shared/types/result";
import type { ServiceError } from "@/shared/types/service-error";

import type { Company } from "../types";

import type { CreateCompanyDTO, GetCompaniesParams, PaginatedCompaniesResponse, UpdateCompanyDTO } from "./company.repository.interface";

/**
 * Load more companies response
 */
export interface LoadMoreCompaniesResponse {
  companies: Company[];
  nextCursor?: string;
  hasMore: boolean;
}

/**
 * Company Service Interface
 * Defines all business operations for companies
 */
export interface ICompanyService {
  /**
   * Get companies with pagination and optional search
   * @param params - Pagination and search parameters
   * @returns Result containing paginated companies or error
   */
  getCompanies(
    params?: GetCompaniesParams
  ): Promise<Result<PaginatedCompaniesResponse, ServiceError>>;

  /**
   * Load more companies for infinite scroll
   * @param currentCursor - The current pagination cursor
   * @param pageSize - Number of companies to load
   * @param searchTerm - Optional search term
   * @returns Result containing companies and pagination info or error
   */
  loadMoreCompanies(
    currentCursor: string,
    pageSize?: number,
    searchTerm?: string
  ): Promise<Result<LoadMoreCompaniesResponse, ServiceError>>;

  /**
   * Get a company by its unique identifier
   * @param id - The company's unique identifier
   * @param useCache - Whether to use cached data
   * @returns Result containing the company or error
   */
  getCompanyById(
    id: string,
    useCache?: boolean
  ): Promise<Result<Company, ServiceError>>;

  /**
   * Get a company by its slug
   * @param slug - The company's slug
   * @param useCache - Whether to use cached data
   * @returns Result containing the company or error
   */
  getCompanyBySlug(
    slug: string,
    useCache?: boolean
  ): Promise<Result<Company, ServiceError>>;

  /**
   * Get all company slugs
   * @param useCache - Whether to use cached data
   * @returns Result containing array of slugs or error
   */
  getAllCompanySlugs(
    useCache?: boolean
  ): Promise<Result<string[], ServiceError>>;

  /**
   * Add a new company
   * @param companyData - The company data to add
   * @returns Result containing the created company ID or error
   */
  addCompany(
    companyData: CreateCompanyDTO
  ): Promise<Result<{ id: string; alreadyExists?: boolean }, ServiceError>>;

  /**
   * Update an existing company
   * @param companyId - The company's unique identifier
   * @param companyData - The data to update
   * @returns Result indicating success or error
   */
  updateCompany(
    companyId: string,
    companyData: UpdateCompanyDTO
  ): Promise<Result<void, ServiceError>>;

  /**
   * Revalidate companies page cache
   * @param companyId - Optional company ID to revalidate
   * @param companySlug - Optional company slug to revalidate
   */
  revalidateCompaniesPage(
    companyId?: string,
    companySlug?: string
  ): Promise<void>;

  /**
   * Fetch company suggestions for autocomplete
   * @param searchTerm - The search term to match
   * @param limit - Maximum number of suggestions to return
   * @returns Result containing company suggestions or error
   */
  fetchCompanySuggestions(
    searchTerm: string,
    limit?: number
  ): Promise<Result<Array<Pick<Company, "id" | "name" | "slug" | "logo">>, ServiceError>>;
}
