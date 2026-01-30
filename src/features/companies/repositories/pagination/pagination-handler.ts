/**
 * Pagination Handler Module
 * Handles pagination strategies for company queries
 */

import type { Firestore } from "firebase/firestore";
import {
  collection,
  documentId,
  getDocs,
  limit,
  orderBy,
  query,
  type QueryConstraint,
  startAfter,
  where,
} from "firebase/firestore";

import { db } from "@/shared/lib/api/firebase";
import { Logger } from "@/shared/lib/utils/logger";
import type { Company } from "@/shared/types";

import type {
  GetCompaniesParams,
  PaginatedCompaniesResponse,
} from "../../interfaces/company.repository.interface";
import { mapFirestoreDocToCompany } from "../operations/company-crud";

import { decodeCursor, encodeCursor } from "./cursor-manager";

const MAX_PAGE_SIZE = 50;
const MAX_OFFSET_LIMIT = 2000;
const MAX_SEARCH_TERM_LENGTH = 100;

/**
 * Interface for Company Pagination Handler
 */
export interface CompanyPaginationHandler {
  getCompanies(params?: GetCompaniesParams): Promise<PaginatedCompaniesResponse>;
}

/**
 * Get Firestore instance with validation
 */
function getFirestore(): Firestore {
  if (!db) {
    throw new Error(
      "Firestore is not initialized. Check your Firebase configuration."
    );
  }
  return db;
}

/**
 * Company Pagination Handler Implementation
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

      // Strategy: Standard Page-based Pagination (Optimized)
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
    const companiesCol = collection(getFirestore(), "companies");
    let queryConstraints: QueryConstraint[] = [
      orderBy("normalizedName", "asc"),
    ];

    if (searchTerm) {
      queryConstraints = [
        where("normalizedName", ">=", searchTerm),
        where("normalizedName", "<=", searchTerm + "\uf8ff"),
        orderBy("normalizedName", "asc"),
      ];
    }

    // Calculate limit to fetch enough for the current page + 1 (to check hasMore)
    const limitCount = page * pageSize + 1;
    queryConstraints.push(limit(limitCount));

    // Ensure consistent sorting with cursor-based query
    queryConstraints.push(orderBy(documentId(), "asc"));

    const q = query(companiesCol, ...queryConstraints);
    const snapshot = await getDocs(q);
    const docs = snapshot.docs;

    let hasMore = false;
    let companies: Company[] = [];
    const startIndex = (page - 1) * pageSize;

    if (docs.length > page * pageSize) {
      hasMore = true;
    }

    let nextCursor: string | undefined;
    // Slice the results for the current page
    if (docs.length > startIndex) {
      const sliceEnd = Math.min(docs.length, startIndex + pageSize);
      companies = docs
        .slice(startIndex, sliceEnd)
        .map(mapFirestoreDocToCompany);

      // Generate cursor for the last item if we have more
      if (hasMore && companies.length > 0) {
        const lastCompany = companies[companies.length - 1];
        nextCursor = encodeCursor({
          normalizedName: lastCompany.normalizedName || "",
          id: lastCompany.id,
        });
      }
    } else {
      companies = [];
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
   * Fetch companies using cursor-based pagination
   * @private
   */
  private async fetchCompaniesWithCursor(
    pageSize: number,
    searchTerm?: string,
    cursor?: string
  ): Promise<PaginatedCompaniesResponse> {
    const companiesCol = collection(getFirestore(), "companies");
    let queryConstraints: QueryConstraint[] = [
      orderBy("normalizedName", "asc"),
      orderBy(documentId(), "asc"),
      limit(pageSize + 1),
    ];

    if (searchTerm && searchTerm.trim() !== "") {
      const lowercasedSearchTerm = searchTerm.toLowerCase().trim();
      queryConstraints = [
        where("normalizedName", ">=", lowercasedSearchTerm),
        where("normalizedName", "<=", lowercasedSearchTerm + "\uf8ff"),
        orderBy("normalizedName", "asc"),
        orderBy(documentId(), "asc"),
        limit(pageSize + 1),
      ];
    }

    if (cursor) {
      const decoded = decodeCursor(cursor);
      if (decoded) {
        queryConstraints.push(startAfter(decoded.normalizedName, decoded.id));
      }
    }

    const queryBuilder = query(companiesCol, ...queryConstraints);
    const querySnapshot = await getDocs(queryBuilder);
    const docs = querySnapshot.docs;
    const hasMore = docs.length > pageSize;

    const companies = docs.slice(0, pageSize).map(mapFirestoreDocToCompany);

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
