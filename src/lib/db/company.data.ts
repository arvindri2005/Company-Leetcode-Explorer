import { unstable_cache, revalidateTag } from "next/cache";
import type { Company, LastAskedPeriod, LeetCodeProblem } from "@/types";
import { db } from "@/lib/firebase";
import {
  collection,
  getDocs,
  doc,
  getDoc,
  query,
  where,
  limit,
  addDoc,
  updateDoc,
  orderBy,
  Timestamp,
  FieldValue,
  startAfter,
  QueryDocumentSnapshot,
  Firestore,
  getCountFromServer,
  setDoc,
  writeBatch,
  deleteDoc,
} from "firebase/firestore";
import { slugify } from "@/lib/utils";

// Helper function to ensure db is not null
function getFirestore(): Firestore {
  if (!db) {
    throw new Error(
      "Firestore is not initialized. Check your Firebase configuration.",
    );
  }
  return db;
}

interface GetCompaniesParams {
  page?: number;
  pageSize?: number;
  searchTerm?: string;
  cursor?: string; // Add cursor for pagination
}

interface PaginatedCompaniesResponse {
  companies: Company[];
  totalCompanies?: number; // Optional for cursor-based pagination
  totalPages?: number; // Optional for cursor-based pagination
  currentPage?: number; // Optional for cursor-based pagination
  nextCursor?: string; // Cursor for next page
  prevCursor?: string; // Cursor for previous page
  hasMore: boolean; // Whether there are more companies to load
}

// Store cursors for navigation

function mapFirestoreDocToCompany(
  docSnap: import("firebase/firestore").DocumentSnapshot,
): Company {
  const data = docSnap.data()!;
  return {
    id: docSnap.id,
    slug: data.slug || docSnap.id || slugify(data.name || ""),
    name: data.name || docSnap.id.charAt(0).toUpperCase() + docSnap.id.slice(1), // Capitalize ID as fallback
    normalizedName: data.normalizedName || data.name?.toLowerCase() || docSnap.id.toLowerCase(),
    logo: data.logo,
    description: data.description,
    website: data.website,
    problemCount: data.problemCount || 0,
    difficultyCounts: data.difficultyCounts || {
      Easy: 0,
      Medium: 0,
      Hard: 0,
    },
    recencyCounts: data.recencyCounts || {
      last_30_days: 0,
      within_3_months: 0,
      within_6_months: 0,
      older_than_6_months: 0,
    },
    commonTags: data.commonTags || [],
    relatedCompanies: data.relatedCompanies || [],
    statsLastUpdatedAt:
      data.statsLastUpdatedAt instanceof Timestamp
        ? data.statsLastUpdatedAt.toDate()
        : undefined,
  };
}
// Helper to encode cursor
function encodeCursor(data: { normalizedName: string; id: string }): string {
  return Buffer.from(JSON.stringify(data)).toString("base64");
}

// Helper to decode cursor
function decodeCursor(cursor: string): { normalizedName: string; id: string } | null {
  try {
    return JSON.parse(Buffer.from(cursor, "base64").toString("utf-8"));
  } catch (e) {
    console.error("Failed to decode cursor:", e);
    return null;
  }
}

// Cursor-based pagination - only loads visible companies
async function fetchCompaniesWithCursor(
  pageSize: number,
  searchTerm?: string,
  cursor?: string,
): Promise<{
  companies: Company[];
  nextCursor?: string;
  prevCursor?: string; // Kept for interface compatibility, but usually null in stateless forward-only
  hasMore: boolean;
  hasPrev: boolean;
}> {
  const companiesCol = collection(getFirestore(), "companies");
  console.log(`[DB] fetchCompaniesWithCursor called. PageSize: ${pageSize}`);
  
  let dbReads = 0;
  
  // Base query with deterministic ordering
  let queryConstraints: any[] = [
    orderBy("normalizedName", "asc"),
    orderBy("id", "asc"), // Secondary sort for stability
    limit(pageSize + 1),
  ];

  // Apply search filter if provided
  if (searchTerm && searchTerm.trim() !== "") {
    const lowercasedSearchTerm = searchTerm.toLowerCase().trim();
    queryConstraints = [
      where("normalizedName", ">=", lowercasedSearchTerm),
      where("normalizedName", "<=", lowercasedSearchTerm + "\uf8ff"),
      orderBy("normalizedName", "asc"),
      orderBy("id", "asc"),
      limit(pageSize + 1),
    ];
  }

  // Apply cursor for pagination
  if (cursor) {
    const decoded = decodeCursor(cursor);
    if (decoded) {
      queryConstraints.push(startAfter(decoded.normalizedName, decoded.id));
    }
  }

  const queryBuilder = query(companiesCol, ...queryConstraints);

  const querySnapshot = await getDocs(queryBuilder);
  dbReads += querySnapshot.docs.length;
  console.log(`[DB] Companies list query executed. Fetched ${querySnapshot.docs.length} docs. Cost: ${querySnapshot.docs.length} reads.`);
  
  const docs = querySnapshot.docs;
  const hasMore = docs.length > pageSize;
  
  // Remove the extra document used for hasMore check
  const companies = docs.slice(0, pageSize).map(mapFirestoreDocToCompany);

  // Generate next cursor
  let nextCursor: string | undefined;
  
  if (hasMore && companies.length > 0) {
    const lastCompany = companies[companies.length - 1];
    nextCursor = encodeCursor({
      normalizedName: lastCompany.normalizedName || "",
      id: lastCompany.id
    });
  }

  return {
    companies,
    nextCursor,
    prevCursor: undefined, // Stateless back pagination is complex, omitting for now
    hasMore,
    hasPrev: !!cursor, // If we have a cursor, we are not on the first page
  };
}

/**
 * @function getCompanies
 * @description Fetches a paginated list of companies using a performant cursor-based method.
 * This is the primary function for listing companies and is optimized for speed by not calculating total counts.
 * @param {GetCompaniesParams} [params={}] - The parameters for fetching companies, including page size, search term, and cursor.
 * @returns {Promise<PaginatedCompaniesResponse>} A promise that resolves to a paginated list of companies with cursor information.
 */
export async function getCompanies({
  page = 1,
  pageSize = 30, // Updated default to match page constant
  searchTerm,
  cursor,
}: GetCompaniesParams = {}): Promise<PaginatedCompaniesResponse> {
  try {
    const normalizedSearchTerm = searchTerm?.trim().toLowerCase();

    // Strategy 1: Search provided - use simple filtering on client side if list is small, or specialized search index
    // For now, we'll assume search needs to scan or use existing startAt/endAt if possible.
    // But since we want "page 2 of search results", we might need to fetch all matching slugs first.
    // Given the constraints and likely dataset size (< 1000), fetching all basic metadata is feasible.

    // Strategy 2: Cursor provided - legacy/infinite scroll support (keep as is or adapt)
    if (cursor) {
        // ... legacy cursor logic ...
        // We might want to phase this out if fully switching to pagination, but keeping for backward compat if needed.
         const result = await fetchCompaniesWithCursor(
            pageSize,
            normalizedSearchTerm,
            cursor,
          );
          return {
            companies: result.companies,
            nextCursor: result.nextCursor,
            prevCursor: result.prevCursor,
            hasMore: result.hasMore,
            currentPage: 1, // Cursor pagination doesn't easily map to page numbers
          };
    }

    // Strategy 3: Page provided (Standard Pagination)
    // 1. Get ALL company slugs (cached).
    // 2. Filter by search term if present (client-side filter on slugs/names if we have them).
    //    Note: We only have slugs here. If search matches name but not slug, this fails.
    //    Ideally we need a "lightweight directory" of {slug, name, normalizedName} for this.
    
    // Let's improve `getAllCompanySlugs` to return lightweight objects if we need searching.
    // For now, if no search term:
    
    if (!normalizedSearchTerm) {
        const allSlugs = await getAllCompanySlugs();
        const totalCompanies = allSlugs.length;
        const totalPages = Math.ceil(totalCompanies / pageSize);
        
        // Ensure page is valid
        const safePage = Math.max(1, Math.min(page, totalPages || 1));
        
        const startIndex = (safePage - 1) * pageSize;
        const endIndex = startIndex + pageSize;
        const pageSlugs = allSlugs.slice(startIndex, endIndex);
        
        // Fetch full details for these slugs
        console.log(`[getCompanies] Fetching details for ${pageSlugs.length} slugs: ${pageSlugs.join(", ")}`);
        const companyPromises = pageSlugs.map(slug => getCompanyBySlug(slug));
        const companies = (await Promise.all(companyPromises)).filter((c): c is Company => !!c);
        console.log(`[getCompanies] Resolved ${companies.length} companies details.`);
        
        return {
            companies,
            totalCompanies,
            totalPages,
            currentPage: safePage,
            hasMore: safePage < totalPages,
            nextCursor: undefined, // Not used for page-based
            prevCursor: undefined,
        };
    }

    // If search term IS provided, we fall back to the cursor/query based approach 
    // BUT since we want pagination for search results too, we ideally need to fetch all matching docs
    // or use a more advanced search index (Algolia/Typesense).
    // For Firestore simple search:
    // We can fetch ALL matching docs (ids only) then paginate?
    // Cost: 1 read per match.
    // If we assume result set is small, we can fetch all.
    
    const companiesCol = collection(getFirestore(), "companies");
    let q = query(companiesCol, 
        where("normalizedName", ">=", normalizedSearchTerm),
        where("normalizedName", "<=", normalizedSearchTerm + "\uf8ff"),
        orderBy("normalizedName", "asc")
    );
    
    // We fetch ALL matches to calculate pagination. 
    // Warning: If search matches 1000 items, this is 1000 reads.
    // Optimization: limit to 200 matches max?
    const snapshot = await getDocs(q);
    const allMatchingDocs = snapshot.docs;
    const totalMatching = allMatchingDocs.length;
    const totalPages = Math.ceil(totalMatching / pageSize);
    const safePage = Math.max(1, Math.min(page, totalPages || 1));
    
    const startIndex = (safePage - 1) * pageSize;
    const pageDocs = allMatchingDocs.slice(startIndex, startIndex + pageSize);
    const companies = pageDocs.map(mapFirestoreDocToCompany);
    
    return {
        companies,
        totalCompanies: totalMatching,
        totalPages,
        currentPage: safePage,
        hasMore: safePage < totalPages,
        nextCursor: undefined,
    };

  } catch (error) {
    console.error("Error in getCompanies:", error);
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
 * @function loadMoreCompanies
 * @description Fetches the next batch of companies for an infinite scroll feature.
 * @param {string} currentCursor - The cursor pointing to the last item of the previously fetched list.
 * @param {number} [pageSize=9] - The number of companies to fetch.
 * @param {string} [searchTerm] - An optional search term to filter the companies.
 * @returns {Promise<{ companies: Company[]; nextCursor?: string; hasMore: boolean; }>} A promise that resolves to the next set of companies and pagination info.
 */
export async function loadMoreCompanies(
  currentCursor: string,
  pageSize: number = 9,
  searchTerm?: string,
): Promise<{
  companies: Company[];
  nextCursor?: string;
  hasMore: boolean;
}> {
  try {
    const result = await fetchCompaniesWithCursor(
      pageSize,
      searchTerm,
      currentCursor,
    );
    return {
      companies: result.companies,
      nextCursor: result.nextCursor,
      hasMore: result.hasMore,
    };
  } catch (error) {
    console.error("Error in loadMoreCompanies:", error);
    return {
      companies: [],
      hasMore: false,
    };
  }
}

// Optimized individual company fetchers with simple caching
// Removed singleCompanyCache in favor of unstable_cache
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 1 day

async function fetchCompanyByIdFromFirestore(
  companyId?: string,
  useCache: boolean = true,
): Promise<Company | undefined> {
  if (!companyId || typeof companyId !== "string") {
    console.warn("fetchCompanyByIdFromFirestore: invalid companyId", companyId);
    return undefined;
  }


  const companyDocRef = doc(getFirestore(), "companies", companyId);
  console.log(`[DB] fetchCompanyByIdFromFirestore: Fetching company ${companyId}`);
  const companySnap = await getDoc(companyDocRef);
  console.log(`[DB] Company doc fetched. Cost: 1 read. Exists: ${companySnap.exists()}`);

  if (companySnap.exists()) {
    const company = mapFirestoreDocToCompany(companySnap);
    return company;
  }
  return undefined;
}

/**
 * @function getCompanyById
 * @description Fetches a single company by its document ID.
 * @param {string} id - The unique identifier of the company.
 * @param {boolean} [useCache=true] - Whether to use the in-memory cache to retrieve the company.
 * @returns {Promise<Company | undefined>} A promise that resolves to the company object or undefined if not found.
 */
export const getCompanyById = async (
  id: string,
  useCache: boolean = true,
): Promise<Company | undefined> => {
  if (!useCache) {
    return await fetchCompanyByIdFromFirestore(id, false);
  }

  const getCachedCompany = unstable_cache(
    async () => fetchCompanyByIdFromFirestore(id, false),
    [`company-${id}`],
    {
      revalidate: 3600, // 1 hour
      tags: [`company-${id}-v2`],
    }
  );

  try {
    return await getCachedCompany();
  } catch (error) {
    console.error(`Error fetching company by ID ${id}:`, error);
    return undefined;
  }
};

async function fetchCompanyBySlugFromFirestore(
  companySlug?: string,
  useCache: boolean = true,
): Promise<Company | undefined> {
  if (!companySlug || typeof companySlug !== "string") {
    console.warn(
      "fetchCompanyBySlugFromFirestore: invalid companySlug",
      companySlug,
    );
    return undefined;
  }


  const companyDocRef = doc(getFirestore(), "companies", companySlug);
  console.log(`[DB] fetchCompanyBySlugFromFirestore: Fetching company slug ${companySlug}`);
  const companySnap = await getDoc(companyDocRef);
  console.log(`[DB] Company slug doc fetched. Cost: 1 read. Exists: ${companySnap.exists()}`);

  if (companySnap.exists()) {
    const company = mapFirestoreDocToCompany(companySnap);
    return company;
  }
  return undefined;
}

/**
 * @function getCompanyBySlug
 * @description Fetches a single company by its URL-friendly slug.
 * @param {string} slug - The slug of the company.
 * @param {boolean} [useCache=true] - Whether to use the in-memory cache to retrieve the company.
 * @returns {Promise<Company | undefined>} A promise that resolves to the company object or undefined if not found.
 */
export const getCompanyBySlug = async (
  slug: string,
  useCache: boolean = true,
): Promise<Company | undefined> => {
  if (!useCache) {
    return await fetchCompanyBySlugFromFirestore(slug, false);
  }

  const getCachedCompany = unstable_cache(
    async () => fetchCompanyBySlugFromFirestore(slug, false),
    [`company-slug-${slug}`],
    {
      revalidate: 3600, // 1 hour
      tags: [`company-slug-${slug}-v2`],
    }
  );

  try {
    return await getCachedCompany();
  } catch (error) {
    console.error(`Error fetching company by slug ${slug}:`, error);
    return undefined;
  }
};

// Cached slugs fetching - only load when needed
let cachedSlugs: { slugs: string[]; timestamp: number } | null = null;

async function fetchAllCompanySlugsFromFirestore(
  useCache: boolean = true,
): Promise<string[]> {
  /*
  if (
    useCache &&
    cachedSlugs &&
    Date.now() - cachedSlugs.timestamp < CACHE_DURATION
  ) {
    return cachedSlugs.slugs;
  }
  */

  const companiesCol = collection(getFirestore(), "companies");
  // Fetch all docs without ordering to avoid missing index issues
  const q = query(companiesCol); 
  const companiesSnapshot = await getDocs(q);
  const slugs = companiesSnapshot.docs
    .map((docSnap) => docSnap.id)
    .sort(); // Sort in memory

  if (useCache) {
    cachedSlugs = { slugs, timestamp: Date.now() };
  }

  return slugs;
}

/**
 * @function getAllCompanySlugs
 * @description Fetches the slugs of all companies in the database. This is useful for generating static site paths.
 * @param {boolean} [useCache=true] - Whether to use the in-memory cache to retrieve the slugs.
 * @returns {Promise<string[]>} A promise that resolves to an array of all company slugs.
 */
export const getAllCompanySlugs = async (
  useCache: boolean = true,
): Promise<string[]> => {
  try {
    return await fetchAllCompanySlugsFromFirestore(useCache);
  } catch (error) {
    console.error("Error fetching all company slugs:", error);
    return [];
  }
};

/**
 * @function invalidateCompaniesCache
 * @description Clears all in-memory caches related to company data, including single company cache, slug cache, and pagination cursors.
 * This should be called after any write operation (add, update, delete) to ensure data consistency.
 */
export const invalidateCompaniesCache = () => {
  // singleCompanyCache.clear(); // Removed
  cachedSlugs = null;
};

/**
 * @function revalidateCompaniesPage
 * @description Triggers a revalidation of the Next.js pages that display company data and invalidates the in-memory cache.
 * @param {string} [companyId] - The ID of the company to revalidate.
 * @param {string} [companySlug] - The slug of the company to revalidate.
 * @async
 */
async function revalidateCompaniesPage(companyId?: string, companySlug?: string) {
  try {
    // Invalidate in-memory caches
    invalidateCompaniesCache();
    
    // Invalidate Next.js Data Cache tags
    revalidateTag("companies-list");
    
    if (companyId) {
      revalidateTag(`company-${companyId}`);
    }
    
    if (companySlug) {
      revalidateTag(`company-slug-${companySlug}`);
    }
    
    console.log(`[Cache] Revalidated companies page. Id: ${companyId}, Slug: ${companySlug}`);
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
    console.error(`Error in updateCompanyInDb for ${companyId}:`, message, error);
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
       revalidateTag(`company-${id}`);
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
    console.error(`Error in deleteCompanyFromDb for ${companyId}:`, message, error);
    return { success: false, error: message };
  }
};
