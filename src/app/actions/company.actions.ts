/**
 * @fileoverview Server-side actions for managing company data.
 *
 * This module contains Next.js server actions for creating, reading, updating,
 * and deleting company-related information in the Firestore database. It includes
 * functions for adding single companies, fetching paginated company lists,
 * and providing search suggestions. These actions also handle cache revalidation
 * to ensure data consistency across the application.
 */
"use server";

import { revalidatePath, revalidateTag } from "next/cache";

import { companyService } from "@/features/companies/services/company.service";
import {
  type ApiResponse,
  errorResponse,
  type PaginationMeta,
  successResponse,
} from "@/lib/api/response";
import { slugify } from "@/lib/utils";
import { handleServerActionError } from "@/lib/utils/error-handler";
import type { Company } from "@/types";

/**
 * Adds a new company to the database after validating and cleaning the input data.
 *
 * This action ensures that the company name is present, prefixes `http(s)://` to
 * website and logo URLs if missing, and validates the URLs. It then calls the
 * database layer to create the new company record and triggers cache revalidation
 * for relevant pages.
 *
 * @param {Omit<Company, 'id' | 'normalizedName' | 'slug'>} companyDataInput - The data for the
 * new company, excluding fields that are generated automatically.
 * @returns {Promise<ApiResponse<Company>>} A promise that resolves to a standardized API response.
 */
export async function addCompany(
  companyDataInput: Omit<Company, "id" | "normalizedName" | "slug">,
): Promise<ApiResponse<Company>> {
  try {
    if (!companyDataInput.name) {
      return errorResponse({
        code: "VALIDATION_ERROR",
        message: "Company name is required.",
      });
    }

    const companyData = { ...companyDataInput };
    if (companyData.website && !companyData.website.startsWith("http")) {
      companyData.website = `https://${companyData.website}`;
    }
    if (companyData.logo && !companyData.logo.startsWith("http")) {
      companyData.logo = `https://${companyData.logo}`;
    }
    // Validate URLs after potential prefixing
    if (companyData.website) {
      try {
        new URL(companyData.website);
      } catch {
        return errorResponse({
          code: "VALIDATION_ERROR",
          message: `Invalid website URL: ${companyData.website}. Ensure it includes http:// or https://.`,
        });
      }
    }
    if (companyData.logo) {
      try {
        new URL(companyData.logo);
      } catch {
        return errorResponse({
          code: "VALIDATION_ERROR",
          message: `Invalid logo URL: ${companyData.logo}. Ensure it includes http:// or https://.`,
        });
      }
    }

    const result = await companyService.addCompany(companyData);

    if (result.isFailure) {
      return errorResponse({
        code: result.error.code,
        message: result.error.message,
      });
    }

    const { id: newCompanyId, alreadyExists } = result.value;

    if (alreadyExists) {
      return errorResponse({
        code: "CONFLICT",
        message: "A company with this name already exists.",
      });
    }

    revalidateTag("companies-collection-broad", 'max');
    revalidateTag("companies-list", 'max');
    revalidatePath("/");
    revalidatePath("/add-company");
    
    return successResponse({
      ...companyData,
      id: newCompanyId,
      slug: slugify(companyData.name),
      normalizedName: companyData.name.toLowerCase(),
    });
  } catch (error) {
    const errorMessage = handleServerActionError(error, "addCompany", {
      name: companyDataInput.name,
    });
    return errorResponse({
      code: "INTERNAL_ERROR",
      message: errorMessage,
    });
  }
}

/**
 * Fetches a paginated and optionally filtered list of companies from the database.
 *
 * This server action serves as the primary method for retrieving companies for display
 * in lists. It wraps the internal `getAllCompaniesFromDbInternal` function, providing
 * pagination and search capabilities.
 *
 * @param {number} page - The page number to retrieve (1-indexed).
 * @param {number} pageSize - The number of companies to include per page.
 * @param {string} [searchTerm] - An optional string to filter companies by name.
 * @returns {Promise<ApiResponse<{ companies: Company[]; hasMore: boolean; nextCursor?: string }>>}
 * A promise that resolves to a standardized API response with pagination metadata.
 */
export async function fetchCompaniesAction(
  page: number,
  pageSize: number,
  searchTerm?: string,
  cursor?: string,
): Promise<ApiResponse<{ companies: Company[]; hasMore: boolean; nextCursor?: string }>> {
  try {
    // SENTINEL: Input validation and DoS prevention
    const safePage = Math.max(1, page);
    const safePageSize = Math.min(50, Math.max(1, pageSize));
    const safeSearchTerm = searchTerm?.slice(0, 100);

    // Prevent deep pagination DoS via offset (limit 10k items)
    if (safePage * safePageSize > 10000 && !cursor) {
       return errorResponse({
        code: "BAD_REQUEST",
        message: "Pagination limit exceeded. Please narrow your search.",
      });
    }

    const result = await companyService.getCompanies({ 
      page: safePage, 
      pageSize: safePageSize, 
      searchTerm: safeSearchTerm, 
      cursor 
    });
    
    if (result.isFailure) {
      return errorResponse({
        code: result.error.code,
        message: result.error.message,
      });
    }

    const data = result.value;
    const pagination: PaginationMeta = {
      page: data.currentPage ?? page,
      pageSize,
      totalItems: data.totalCompanies ?? 0,
      totalPages: data.totalPages ?? 0,
      hasNext: data.hasMore ?? false,
      hasPrevious: page > 1,
    };

    return successResponse(
      {
        companies: data.companies,
        hasMore: data.hasMore ?? false,
        nextCursor: data.nextCursor,
      },
      { pagination }
    );
  } catch (error) {
    const errorMessage = handleServerActionError(error, "fetchCompaniesAction", {
      page,
      pageSize,
      searchTerm,
      cursor,
    });
    return errorResponse({
      code: "INTERNAL_ERROR",
      message: errorMessage,
    });
  }
}

/**
 * Fetches a limited list of company suggestions for autocomplete or search features.
 *
 * This action queries the database for companies whose normalized name starts with the
 * provided search term. It is optimized to be fast and return a small, relevant set
 * of data (id, name, slug, logo) suitable for display in a search dropdown.
 *
 * @param {string} searchTerm - The search term to match against the beginning of company names.
 * @param {number} [limitNum=5] - The maximum number of suggestions to return. Defaults to 5.
 * @returns {Promise<ApiResponse<Array<Pick<Company, 'id' | 'name' | 'slug' | 'logo'>>>>}
 * A promise that resolves to a standardized API response with company suggestions.
 */
export async function fetchCompanySuggestionsAction(
  searchTerm: string,
  limitNum: number = 5,
): Promise<ApiResponse<Array<Pick<Company, "id" | "name" | "slug" | "logo">>>> {
  // SENTINEL: Input validation
  const safeSearchTerm = searchTerm?.slice(0, 100) || "";
  const safeLimit = Math.min(20, Math.max(1, limitNum));

  if (!safeSearchTerm || safeSearchTerm.trim().length < 1) {
    return successResponse([]);
  }
  try {
    const result = await companyService.fetchCompanySuggestions(safeSearchTerm, safeLimit);
    
    if (result.isFailure) {
      return errorResponse({
        code: result.error.code,
        message: result.error.message,
      });
    }
    
    return successResponse(result.value);
  } catch (error) {
    const errorMessage = handleServerActionError(error, "fetchCompanySuggestionsAction", {
      searchTerm,
      limitNum,
    });
    return errorResponse({
      code: "INTERNAL_ERROR",
      message: errorMessage,
    });
  }
}






