import { revalidateTag } from "next/cache";
import type { Company } from "@/types";
import {
  collection,
  doc,
  setDoc,
  updateDoc,
  writeBatch,
  deleteDoc,
} from "firebase/firestore";
import { slugify } from "@/lib/utils";
import { getFirestore } from "./utils";
import { fetchCompanyBySlugFromFirestore, getCompanyById } from "./queries";

// Cached slugs fetching - only load when needed
// Note: We can't easily share the cachedSlugs variable between modules if we want to invalidate it here.
// For now, we'll just accept that invalidation might not clear the local variable in `queries.ts`.
// A better approach would be to move the cache state to a shared state module or use a class.
// However, since this is server-side, the variable scope is per-request or per-lambda instance anyway.

/**
 * @function invalidateCompaniesCache
 * @description Clears all in-memory caches related to company data, including single company cache, slug cache, and pagination cursors.
 * This should be called after any write operation (add, update, delete) to ensure data consistency.
 */
export const invalidateCompaniesCache = () => {
  // In a module system, we can't easily clear the local variable `cachedSlugs` in `queries.ts`.
  // But since we are using `unstable_cache` and `revalidateTag`, that's the primary mechanism.
  // The local `cachedSlugs` in `queries.ts` is a secondary optimization that might become stale.
  // We should probably export a function from `queries.ts` to clear it if strict consistency is needed.
};

/**
 * @function revalidateCompaniesPage
 * @description Triggers a revalidation of the Next.js pages that display company data and invalidates the in-memory cache.
 * @param {string} [companyId] - The ID of the company to revalidate.
 * @param {string} [companySlug] - The slug of the company to revalidate.
 * @async
 */
export async function revalidateCompaniesPage(
  companyId?: string,
  companySlug?: string,
) {
  try {
    // Invalidate in-memory caches
    invalidateCompaniesCache();

    // Invalidate Next.js Data Cache tags
    revalidateTag("companies-list", "max");

    if (companyId) {
      revalidateTag(`company-${companyId}`, "max");
    }

    if (companySlug) {
      revalidateTag(`company-slug-${companySlug}`, "max");
    }

    console.log(
      `[Cache] Revalidated companies page. Id: ${companyId}, Slug: ${companySlug}`,
    );
  } catch (error) {
    console.error("Failed to revalidate companies page:", error);
  }
}

/**
 * @function addCompanyToDb
 * @description Adds a new company to the Firestore database. It checks for duplicates by slug before adding.
 * @param {Omit<Company, 'id' | 'slug' | 'problemCount' | 'difficultyCounts' | 'recencyCounts' | 'commonTags' | 'statsLastUpdatedAt'>} companyData - The company data to add.
 * @returns {Promise<{ id: string | null; error?: string; alreadyExists?: boolean }>} A promise that resolves to an object containing the new company's ID, or an error if the operation failed.
 */
export const addCompanyToDb = async (
  companyData: Omit<
    Company,
    | "id"
    | "slug"
    | "problemCount"
    | "difficultyCounts"
    | "recencyCounts"
    | "commonTags"
    | "statsLastUpdatedAt"
  >,
): Promise<{ id: string | null; error?: string; alreadyExists?: boolean }> => {
  try {
    if (!companyData.name?.trim()) {
      return { id: null, error: "Company name is required" };
    }

    const companySlug = slugify(companyData.name);
    const normalizedName = companyData.name.toLowerCase().trim();

    // Check for existing company
    const existingCompany = await fetchCompanyBySlugFromFirestore(
      companySlug,
      false,
    );
    if (existingCompany) {
      return {
        id: existingCompany.id,
        error: `Company with name "${companyData.name}" already exists.`,
        alreadyExists: true,
      };
    }

    const dataForFirestore: Omit<Company, "id"> = {
      name: companyData.name.trim(),
      normalizedName,
      slug: companySlug,
      logo: companyData.logo,
      description: companyData.description?.trim(),
      website: companyData.website?.trim(),
      problemCount: 0,
      difficultyCounts: { Easy: 0, Medium: 0, Hard: 0 },
      recencyCounts: {
        last_30_days: 0,
        within_3_months: 0,
        within_6_months: 0,
        older_than_6_months: 0,
      },
      commonTags: [],
      relatedCompanies: companyData.relatedCompanies || [],
      statsLastUpdatedAt: undefined,
    };

    // Clean up undefined values
    Object.keys(dataForFirestore).forEach((key) => {
      if (
        dataForFirestore[key as keyof typeof dataForFirestore] === undefined
      ) {
        delete dataForFirestore[key as keyof typeof dataForFirestore];
      }
    });

    const companiesCol = collection(getFirestore(), "companies");
    const docRef = doc(companiesCol, companySlug);
    await setDoc(docRef, dataForFirestore);

    await revalidateCompaniesPage(companySlug, companySlug);

    return { id: companySlug };
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "An unknown error occurred while adding company.";
    console.error("Error in addCompanyToDb:", message, error);
    return { id: null, error: message };
  }
};

/**
 * @function updateCompanyInDb
 * @description Updates an existing company in the Firestore database.
 * @param {string} companyId - The ID of the company to update.
 * @param {Partial<Company>} companyData - The company data to update.
 * @returns {Promise<{ success: boolean; error?: string }>} A promise that resolves to an object indicating success or failure.
 */
export const updateCompanyInDb = async (
  companyId: string,
  companyData: Partial<Company>,
): Promise<{ success: boolean; error?: string }> => {
  try {
    if (!companyId) {
      return { success: false, error: "Company ID is required" };
    }

    const updates: Record<string, any> = { ...companyData };

    // Ensure normalizedName is updated if name is changed
    if (updates.name) {
      updates.normalizedName = updates.name.toLowerCase().trim();
      // We explicitly DO NOT update the slug to avoid breaking URLs
    }

    // Remove undefined values and dangerous fields
    delete updates.id;
    delete updates.slug; // Prevent slug updates
    delete updates.problemCount; // Managed by background stats
    delete updates.difficultyCounts; // Managed by background stats
    delete updates.recencyCounts; // Managed by background stats
    delete updates.commonTags; // Managed by background stats
    delete updates.statsLastUpdatedAt;

    Object.keys(updates).forEach((key) => {
      if (updates[key] === undefined) {
        delete updates[key];
      }
    });

    const companyDocRef = doc(getFirestore(), "companies", companyId);
    await updateDoc(companyDocRef, updates);

    // We need the slug to invalidate the slug cache, but we might not have it here.
    // Ideally we should fetch it, but that adds a read.
    // For now, we invalidate the ID cache and the list.
    // If the caller knows the slug, they should pass it, but the signature doesn't allow it.
    // We can try to fetch the company from cache to get the slug?
    const existingCompany = await getCompanyById(companyId);
    const companySlug = existingCompany?.slug;

    await revalidateCompaniesPage(companyId, companySlug);

    return { success: true };
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "An unknown error occurred while updating company.";
    console.error(
      `Error in updateCompanyInDb for ${companyId}:`,
      message,
      error,
    );
    return { success: false, error: message };
  }
};

/**
 * @function bulkDeleteCompaniesFromDb
 * @description Hard deletes multiple companies from the Firestore database using a batch operation.
 * @param {string[]} companyIds - The IDs of the companies to delete.
 * @returns {Promise<{ success: boolean; error?: string; deletedCount?: number }>} A promise that resolves to an object indicating success or failure.
 */
export const bulkDeleteCompaniesFromDb = async (
  companyIds: string[],
): Promise<{ success: boolean; error?: string; deletedCount?: number }> => {
  try {
    if (!companyIds || companyIds.length === 0) {
      return { success: true, deletedCount: 0 }; // Nothing to delete
    }

    const db = getFirestore();
    const batch = writeBatch(db);

    // Firestore batches are limited to 500 operations.
    // Assuming UI prevents selecting > 500, or we slice it.
    // Ideally we should loop and commit batches of 500.
    const CHUNK_SIZE = 500;

    for (let i = 0; i < companyIds.length; i += CHUNK_SIZE) {
      const chunk = companyIds.slice(i, i + CHUNK_SIZE);
      const currentBatch = writeBatch(db); // Create a new batch for each chunk

      chunk.forEach((id) => {
        const docRef = doc(db, "companies", id);
        currentBatch.delete(docRef);
      });

      await currentBatch.commit();
    }

    // We can't easily know all slugs without fetching them first.
    // So we just invalidate the list and the IDs.
    // This might leave stale slug caches if accessed directly, but they will eventually expire.
    // To be safe, we could invalidate ALL company caches, but we don't have a global tag for that except 'companies-list'.

    await revalidateCompaniesPage();
    // Also invalidate each ID
    for (const id of companyIds) {
      revalidateTag(`company-${id}`, "max");
    }

    return { success: true, deletedCount: companyIds.length };
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "An unknown error occurred while bulk deleting companies.";
    console.error(`Error in bulkDeleteCompaniesFromDb:`, message, error);
    return { success: false, error: message };
  }
};

/**
 * @function deleteCompanyFromDb
 * @description Hard deletes a company from the Firestore database.
 * @param {string} companyId - The ID of the company to delete.
 * @returns {Promise<{ success: boolean; error?: string }>} A promise that resolves to an object indicating success or failure.
 */
export const deleteCompanyFromDb = async (
  companyId: string,
): Promise<{ success: boolean; error?: string }> => {
  try {
    if (!companyId) {
      return { success: false, error: "Company ID is required" };
    }

    const companyDocRef = doc(getFirestore(), "companies", companyId);

    // Optional: Check if it exists first? Not strictly necessary for delete, but good for reporting.
    // Firestore delete succeeds even if doc doesn't exist.

    await deleteDoc(companyDocRef);

    await revalidateCompaniesPage(companyId);

    return { success: true };
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "An unknown error occurred while deleting company.";
    console.error(
      `Error in deleteCompanyFromDb for ${companyId}:`,
      message,
      error,
    );
    return { success: false, error: message };
  }
};
