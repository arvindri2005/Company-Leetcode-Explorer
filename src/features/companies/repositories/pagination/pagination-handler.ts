/**
 * Pagination Handler Module
 * Handles pagination strategies for company queries
 * Data source: Supabase (PostgreSQL)
 */

import { supabase } from "@/shared/lib/api/supabase";
import { Logger } from "@/shared/lib/utils/logger";
import type { Company } from "@/shared/types";

import type {
  GetCompaniesParams,
  PaginatedCompaniesResponse,
} from "../../interfaces/company.repository.interface";
import {
  mapSupabaseRowToCompany,
  type SupabaseCompanyRow,
} from "../operations/company-crud";

import { decodeCursor, encodeCursor } from "./cursor-manager";

const MAX_PAGE_SIZE = 50;
const MAX_OFFSET_LIMIT = 2000;
const MAX_SEARCH_TERM_LENGTH = 100;

/** Full select query with all joined tables */
const COMPANY_SELECT_WITH_JOINS =
  "*, company_stats(*), company_tags(*), related_companies(*)";

/**
 * Interface for Company Pagination Handler
 */
export interface CompanyPaginationHandler {
  getCompanies(params?: GetCompaniesParams): Promise<PaginatedCompaniesResponse>;
}

/**
 * Company Pagination Handler Implementation (Supabase)
 */
export class PaginationHandler implements CompanyPaginationHandler {
  /**
   * Get companies with pagination and optional search
   * Supports both cursor-based and page-based pagination
   */
  async getCompanies({
    page = 1,
    pageSize = 30,
    searchTerm,
    cursor,
  }: GetCompaniesParams = {}): Promise<PaginatedCompaniesResponse> {
    try {
      // Security: Sanitize and limit search term length
      const normalizedSearchTerm = searchTerm
        ?.trim()
        .slice(0, MAX_SEARCH_TERM_LENGTH)
        .toLowerCase();

      // Security: Clamp page size to prevent large reads
      const safePageSize = Math.min(pageSize, MAX_PAGE_SIZE);

      // Strategy: Cursor provided (Load More)
      if (cursor) {
        return await this.fetchCompaniesWithCursor(
          safePageSize,
          normalizedSearchTerm,
          cursor
        );
      }

      // Security: Prevent deep pagination DoS
      if (page * safePageSize > MAX_OFFSET_LIMIT) {
        throw new Error(
          `Pagination limit exceeded. Please refine your search or use filters.`
        );
      }

      // Strategy: Standard Page-based Pagination
      return await this.fetchCompaniesWithPageNumber(
        page,
        safePageSize,
        normalizedSearchTerm
      );
    } catch (error) {
      Logger.error("Error in getCompanies", error);
      return {
        companies: [],
        hasMore: false,
        currentPage: 1,
        totalPages: 1,
        totalCompanies: 0,
      };
    }
  }

  /**
   * Fetch companies using page-based pagination
   * @private
   */
  private async fetchCompaniesWithPageNumber(
    page: number,
    pageSize: number,
    searchTerm?: string
  ): Promise<PaginatedCompaniesResponse> {
    // Calculate offset range for Supabase .range()
    const startIndex = (page - 1) * pageSize;
    // Fetch one extra to know if there are more
    const endIndex = startIndex + pageSize;

    let query = supabase
      .from("companies")
      .select(COMPANY_SELECT_WITH_JOINS)
      .order("normalized_name", { ascending: true })
      .order("id", { ascending: true })
      .range(startIndex, endIndex);

    if (searchTerm) {
      query = query.ilike("normalized_name", `${searchTerm}%`);
    }

    const { data, error } = await query;

    if (error) {
      Logger.error("Error in fetchCompaniesWithPageNumber", error);
      throw error;
    }

    const rows = (data || []) as unknown as SupabaseCompanyRow[];
    const hasMore = rows.length > pageSize;
    const companies: Company[] = rows
      .slice(0, pageSize)
      .map(mapSupabaseRowToCompany);

    let nextCursor: string | undefined;
    if (hasMore && companies.length > 0) {
      const lastCompany = companies[companies.length - 1];
      nextCursor = encodeCursor({
        normalizedName: lastCompany.normalizedName || "",
        id: lastCompany.id,
      });
    }

    return {
      companies,
      totalCompanies: -1, // Unknown total to save reads
      totalPages: -1, // Unknown pages to save reads
      currentPage: page,
      hasMore,
      nextCursor,
    };
  }

  /**
   * Fetch companies using cursor-based pagination (keyset pagination)
   * @private
   */
  private async fetchCompaniesWithCursor(
    pageSize: number,
    searchTerm?: string,
    cursor?: string
  ): Promise<PaginatedCompaniesResponse> {
    let query = supabase
      .from("companies")
      .select(COMPANY_SELECT_WITH_JOINS)
      .order("normalized_name", { ascending: true })
      .order("id", { ascending: true })
      .limit(pageSize + 1);

    if (searchTerm && searchTerm.trim() !== "") {
      query = query.ilike("normalized_name", `${searchTerm}%`);
    }

    // Apply cursor-based keyset pagination
    if (cursor) {
      const decoded = decodeCursor(cursor);
      if (decoded) {
        // Keyset pagination: (normalized_name, id) > (cursor_name, cursor_id)
        query = query.or(
          `normalized_name.gt.${decoded.normalizedName},and(normalized_name.eq.${decoded.normalizedName},id.gt.${decoded.id})`
        );
      }
    }

    const { data, error } = await query;

    if (error) {
      Logger.error("Error in fetchCompaniesWithCursor", error);
      throw error;
    }

    const rows = (data || []) as unknown as SupabaseCompanyRow[];
    const hasMore = rows.length > pageSize;
    const companies = rows.slice(0, pageSize).map(mapSupabaseRowToCompany);

    let nextCursor: string | undefined;
    if (hasMore && companies.length > 0) {
      const lastCompany = companies[companies.length - 1];
      nextCursor = encodeCursor({
        normalizedName: lastCompany.normalizedName || "",
        id: lastCompany.id,
      });
    }

    return {
      companies,
      nextCursor,
      hasMore,
      totalCompanies: -1,
    };
  }
}
