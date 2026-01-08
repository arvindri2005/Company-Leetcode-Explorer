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

import type { Company } from "@/types";
import { companyService } from "@/features/companies/services/company.service";
import { revalidatePath, revalidateTag } from "next/cache";
import { slugify } from "@/lib/utils";
import { handleServerActionError } from "@/lib/utils/error-handler";

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
 * @returns {Promise<{ success: boolean; data?: Company; error?: string }>} A promise that resolves
 * to an object indicating the success of the operation. If successful, the `data` property
 * contains the newly created company object. If not, the `error` property contains a message.
 */
export async function addCompany(
  companyDataInput: Omit<Company, "id" | "normalizedName" | "slug">,
): Promise<{ success: boolean; data?: Company; error?: string }> {
  try {
    if (!companyDataInput.name) {
      return { success: false, error: "Company name is required." };
    }

    let companyData = { ...companyDataInput };
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
        return {
          success: false,
          error: `Invalid website URL: ${companyData.website}. Ensure it includes http:// or https://.`,
        };
      }
    }
    if (companyData.logo) {
      try {
        new URL(companyData.logo);
      } catch {
        return {
          success: false,
          error: `Invalid logo URL: ${companyData.logo}. Ensure it includes http:// or https://.`,
        };
      }
    }

    const {
      id: newCompanyId,
      error: dbError,
      alreadyExists,
    } = await companyService.addCompany(companyData);

    if (dbError || !newCompanyId) {
      if (alreadyExists) return { success: false, error: dbError };
      return {
        success: false,
        error: dbError || "Failed to save company to the database.",
      };
    }
    revalidateTag("companies-collection-broad", 'max');
    revalidateTag("companies-list", 'max');
    revalidatePath("/");
    revalidatePath("/add-company");
    return {
      success: true,
      data: {
        ...companyData,
        id: newCompanyId,
        slug: slugify(companyData.name),
        normalizedName: companyData.name.toLowerCase(),
      },
    };
  } catch (error) {
    const errorMessage = handleServerActionError(error, "addCompany", {
      name: companyDataInput.name,
      // Avoid logging potentially large or sensitive URL fields unless necessary
    });
    return {
      success: false,
      error: errorMessage,
    };
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
 * @returns {Promise<{ companies: Company[]; totalPages: number; totalCompanies: number; currentPage: number; error?: string }>}
 * A promise that resolves to an object containing the list of companies for the requested
 * page and pagination metadata. If an error occurs, the `error` property will be set.
 */
export async function fetchCompaniesAction(
  page: number,
  pageSize: number,
  searchTerm?: string,
  cursor?: string,
): Promise<{
  companies: Company[];
  totalPages: number;
  totalCompanies: number;
  currentPage: number;
  hasMore: boolean;
  nextCursor?: string;
  error?: string;
}> {
  try {
    const result = await companyService.getCompanies({ page, pageSize, searchTerm, cursor });
    return {
      ...result,
      totalPages: result.totalPages ?? 0,
      totalCompanies: result.totalCompanies ?? 0,
      currentPage: result.currentPage ?? 1,
      hasMore: result.hasMore ?? false,
      nextCursor: result.nextCursor,
    };
  } catch (error) {
    const errorMessage = handleServerActionError(error, "fetchCompaniesAction", {
      page,
      pageSize,
      searchTerm,
      cursor,
    });
    return {
      companies: [],
      totalPages: 0,
      totalCompanies: 0,
      currentPage: 1,
      hasMore: false,
      error: errorMessage,
    };
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
 * @returns {Promise<Array<Pick<Company, 'id' | 'name' | 'slug' | 'logo'>> | { error: string }>}
 * A promise that resolves to an array of company suggestion objects or an error object.
 * Returns an empty array if the search term is too short.
 */
export async function fetchCompanySuggestionsAction(
  searchTerm: string,
  limitNum: number = 5,
): Promise<
  Array<Pick<Company, "id" | "name" | "slug" | "logo">> | { error: string }
> {
  if (!searchTerm || searchTerm.trim().length < 1) {
    return [];
  }
  try {
    return await companyService.fetchCompanySuggestions(searchTerm, limitNum);
  } catch (error) {
    const errorMessage = handleServerActionError(error, "fetchCompanySuggestionsAction", {
      searchTerm,
      limitNum,
    });
    return { error: errorMessage };
  }
}






