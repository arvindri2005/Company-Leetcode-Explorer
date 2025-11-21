/**
 * @fileoverview Server-side actions for managing company data.
 *
 * This module contains Next.js server actions for creating, reading, updating,
 * and deleting company-related information in the Firestore database. It includes
 * functions for adding single companies, bulk-adding from a file, fetching
 * paginated company lists, and providing search suggestions. These actions also
 * handle cache revalidation to ensure data consistency across the application.
 */
"use server";

import type { Company, LastAskedPeriod } from "@/types";
import {
  addCompanyToDb,
  getCompanies as getAllCompaniesFromDbInternal,
} from "@/lib/data";
import { revalidatePath, revalidateTag } from "next/cache";
import {
  doc as firestoreDoc,
  updateDoc as firestoreUpdateDoc,
  deleteField,
  collection,
  query,
  orderBy,
  where,
  limit,
  getDocs,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { slugify } from "@/lib/utils";

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
    } = await addCompanyToDb(companyData);

    if (dbError || !newCompanyId) {
      if (alreadyExists) return { success: false, error: dbError };
      return {
        success: false,
        error: dbError || "Failed to save company to the database.",
      };
    }
    revalidateTag("companies-collection-broad");
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
    console.error("Error adding company (action level):", error);
    if (error instanceof Error) return { success: false, error: error.message };
    return {
      success: false,
      error: "An unknown error occurred while adding the company.",
    };
  }
}

interface RawExcelCompanyData {
  name: string;
  logo?: string;
  description?: string;
  website?: string;
  relatedCompanies?: string[];
}
interface BulkAddCompanyDetailedResult {
  rowIndex: number;
  name: string;
  status: "added" | "updated" | "skipped" | "error";
  message: string;
}

/**
 * Processes a bulk import of companies, adding new ones and updating existing ones.
 *
 * This action takes an array of raw company data, typically parsed from a file.
 * It iterates through each entry, checking for an existing company by a case-insensitive
 * name match. If a company exists, it updates fields like logo, description, and website
 * if new values are provided. If it doesn't exist, a new company is created. The function
 * performs URL validation and cleaning. It also efficiently triggers cache revalidation for all
 * affected companies and pages.
 *
 * @param {RawExcelCompanyData[]} companiesFromExcel - An array of raw company data objects.
 * @returns {Promise<{ addedCount: number; updatedCount: number; skippedCount: number; errorCount: number; detailedResults: BulkAddCompanyDetailedResult[] }>}
 * A promise that resolves to an object summarizing the operation, including counts for
 * added, updated, skipped, and errored records, along with a detailed breakdown of the
 * outcome for each row.
 */
export async function bulkAddCompanies(
  companiesFromExcel: RawExcelCompanyData[],
): Promise<{
  addedCount: number;
  updatedCount: number;
  skippedCount: number;
  errorCount: number;
  detailedResults: BulkAddCompanyDetailedResult[];
}> {
  let added = 0,
    updated = 0,
    skipped = 0,
    errors = 0;
  const detailedResults: BulkAddCompanyDetailedResult[] = [];
  const companiesToRevalidateSlugs = new Set<string>();
  const companiesToRevalidateIds = new Set<string>();

  // Optimization: Instead of fetching all companies, fetch only the ones involved in this batch.
  // Firestore 'in' queries are limited to 30 items, so we batch the reads.
  const normalizedNames = Array.from(
    new Set(
      companiesFromExcel
        .map((c) => c.name?.trim().toLowerCase())
        .filter((n): n is string => !!n),
    ),
  );

  const existingCompanies: Company[] = [];
  const BATCH_SIZE = 30;

  for (let i = 0; i < normalizedNames.length; i += BATCH_SIZE) {
    const batch = normalizedNames.slice(i, i + BATCH_SIZE);
    if (batch.length === 0) continue;

    const q = query(
      collection(db, "companies"),
      where("normalizedName", "in", batch),
    );

    const querySnapshot = await getDocs(q);
    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      // Map to a minimal Company object required for comparison logic
      existingCompanies.push({
        id: docSnap.id,
        name: data.name,
        normalizedName: data.normalizedName,
        slug: data.slug,
        logo: data.logo,
        description: data.description,
        website: data.website,
        // Dummy values for fields not needed for update logic
        problemCount: 0,
        difficultyCounts: { Easy: 0, Medium: 0, Hard: 0 },
        recencyCounts: {
          last_30_days: 0,
          within_3_months: 0,
          within_6_months: 0,
          older_than_6_months: 0,
        },
        commonTags: [],
      });
    });
  }

  const companyMap = new Map(
    existingCompanies.map((c) => [
      c.normalizedName || c.name.toLowerCase(),
      c,
    ]),
  );

  for (let i = 0; i < companiesFromExcel.length; i++) {
    const raw = companiesFromExcel[i];
    let name = String(raw.name || "").trim();
    if (!name) {
      errors++;
      detailedResults.push({
        rowIndex: i,
        name: "(No Name)",
        status: "error",
        message: "Missing company name.",
      });
      continue;
    }

    let logo = String(raw.logo || "").trim();
    let website = String(raw.website || "").trim();
    const description = String(raw.description || "").trim();
    const relatedCompanies = raw.relatedCompanies || [];

    if (website && !website.startsWith("http")) website = `https://${website}`;
    if (logo && !logo.startsWith("http")) logo = `https://${logo}`;

    if (website) {
      try {
        new URL(website);
      } catch {
        errors++;
        detailedResults.push({
          rowIndex: i,
          name,
          status: "error",
          message: `Invalid Website URL: ${website}.`,
        });
        continue;
      }
    }
    if (logo) {
      try {
        new URL(logo);
      } catch {
        errors++;
        detailedResults.push({
          rowIndex: i,
          name,
          status: "error",
          message: `Invalid Logo URL: ${logo}.`,
        });
        continue;
      }
    }

    const existingCompany = companyMap.get(name.toLowerCase());
    const currentSlug = slugify(name);

    if (existingCompany) {
      const payload: Omit<Partial<Company>, "logo" | "description" | "website"> & {
        logo?: string | ReturnType<typeof deleteField>;
        description?: string | ReturnType<typeof deleteField>;
        website?: string | ReturnType<typeof deleteField>;
      } = {};
      let needsUpdate = false;

      if (
        name !== existingCompany.name ||
        currentSlug !== existingCompany.slug
      ) {
        payload.name = name;
        payload.normalizedName = name.toLowerCase();
        payload.slug = currentSlug;
        needsUpdate = true;
      }

      if (logo === "" && existingCompany.logo) {
        payload.logo = deleteField();
        needsUpdate = true;
      } else if (logo && logo !== existingCompany.logo) {
        payload.logo = logo;
        needsUpdate = true;
      }

      if (description === "" && existingCompany.description) {
        payload.description = deleteField();
        needsUpdate = true;
      } else if (description && description !== existingCompany.description) {
        payload.description = description;
        needsUpdate = true;
      }

      if (website === "" && existingCompany.website) {
        payload.website = deleteField();
        needsUpdate = true;
      } else if (website && website !== existingCompany.website) {
        payload.website = website;
        needsUpdate = true;
      }

      if (relatedCompanies.length > 0) {
        // Overwrite if new related companies are provided
        // Check if different
        const existingRelated = existingCompany.relatedCompanies || [];
        const areDifferent =
          relatedCompanies.length !== existingRelated.length ||
          relatedCompanies.some((val, index) => val !== existingRelated[index]);

        if (areDifferent) {
          payload.relatedCompanies = relatedCompanies;
          needsUpdate = true;
        }
      }

      if (needsUpdate && Object.keys(payload).length > 0) {
        try {
          await firestoreUpdateDoc(
            firestoreDoc(db, "companies", existingCompany.id),
            payload,
          );
          updated++;
          detailedResults.push({
            rowIndex: i,
            name,
            status: "updated",
            message: "Updated existing company.",
          });
          companiesToRevalidateSlugs.add(currentSlug);
          companiesToRevalidateIds.add(existingCompany.id);
        } catch (e) {
          const errorMsg =
            e instanceof Error ? e.message : "Unknown error during update.";
          errors++;
          detailedResults.push({
            rowIndex: i,
            name,
            status: "error",
            message: `Update failed: ${errorMsg}`,
          });
        }
      } else if (
        !detailedResults.find((r) => r.rowIndex === i && r.status === "error")
      ) {
        skipped++;
        detailedResults.push({
          rowIndex: i,
          name,
          status: "skipped",
          message: "No changes needed.",
        });
      }
    } else {
      const result = await addCompanyToDb({
        name,
        logo: logo || undefined,
        description: description || undefined,
        website: website || undefined,
        relatedCompanies,
      });
      if (result.id) {
        added++;
        detailedResults.push({
          rowIndex: i,
          name,
          status: "added",
          message: "Added new company.",
        });
        companiesToRevalidateSlugs.add(currentSlug);
        companiesToRevalidateIds.add(result.id);
      } else {
        errors++;
        detailedResults.push({
          rowIndex: i,
          name,
          status: "error",
          message:
            result.error || "Database error occurred adding new company.",
        });
      }
    }
  }

  if (added > 0 || updated > 0) {
    revalidateTag("companies-collection-broad");
    companiesToRevalidateSlugs.forEach((slug) =>
      revalidateTag(`company-slug-${slug}`),
    );
    companiesToRevalidateIds.forEach((id) =>
      revalidateTag(`company-detail-${id}`),
    );
    [
      "/",
      "/add-company",
      "/submit-problem",
      "/bulk-add-problems",
      "/bulk-add-companies",
      "/companies",
    ].forEach((p) => revalidatePath(p));
    companiesToRevalidateSlugs.forEach((slug) =>
      revalidatePath(`/company/${slug}`),
    );
  }

  return {
    addedCount: added,
    updatedCount: updated,
    skippedCount: skipped,
    errorCount: errors,
    detailedResults,
  };
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
): Promise<{
  companies: Company[];
  totalPages: number;
  totalCompanies: number;
  currentPage: number;
  error?: string;
}> {
  try {
    const result = await getAllCompaniesFromDbInternal({ page, pageSize, searchTerm });
    return {
      ...result,
      totalPages: result.totalPages ?? 0,
      totalCompanies: result.totalCompanies ?? 0,
      currentPage: result.currentPage ?? 1,
    };
  } catch (error) {
    console.error("Error fetching companies in action:", error);
    const message =
      error instanceof Error
        ? error.message
        : "An unknown error occurred while fetching companies.";
    return {
      companies: [],
      totalPages: 0,
      totalCompanies: 0,
      currentPage: 1,
      error: message,
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
    const companiesCol = collection(db, "companies");
    const lowercasedSearchTerm = searchTerm.toLowerCase().trim();

    const q = query(
      companiesCol,
      orderBy("normalizedName"),
      where("normalizedName", ">=", lowercasedSearchTerm),
      where("normalizedName", "<=", lowercasedSearchTerm + "\uf8ff"),
      limit(limitNum),
    );

    const querySnapshot = await getDocs(q);
    const suggestions = querySnapshot.docs.map((docSnap) => {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        name: data.name,
        slug: data.slug || slugify(data.name),
        logo: data.logo, // Include logo for richer suggestions
      } as Pick<Company, "id" | "name" | "slug" | "logo">;
    });

    return suggestions;
  } catch (error) {
    console.error("Error fetching company suggestions in action:", error);
    const message =
      error instanceof Error
        ? error.message
        : "An unknown error occurred while fetching suggestions.";
    return { error: message };
  }
}
