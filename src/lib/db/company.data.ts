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
  writeBatch,
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
const paginationCursors = new Map<string, QueryDocumentSnapshot>();

function mapFirestoreDocToCompany(
  docSnap: import("firebase/firestore").DocumentSnapshot,
): Company {
  const data = docSnap.data()!;
  return {
    id: docSnap.id,
    slug: data.slug || slugify(data.name),
    name: data.name,
    normalizedName: data.normalizedName,
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

// Generate a unique cursor key
function generateCursorKey(
  searchTerm?: string,
  direction: "next" | "prev" = "next",
): string {
  return `${searchTerm || "all"}_${direction}_${Date.now()}`;
}

// Cursor-based pagination - only loads visible companies
async function fetchCompaniesWithCursor(
  pageSize: number,
  searchTerm?: string,
  cursor?: string,
  direction: "next" | "prev" = "next",
): Promise<{
  companies: Company[];
  nextCursor?: string;
  prevCursor?: string;
  hasMore: boolean;
  hasPrev: boolean;
}> {
  const companiesCol = collection(getFirestore(), "companies");
  let queryBuilder = query(
    companiesCol,
    orderBy("normalizedName"),
    limit(pageSize + 1),
  ); // +1 to check if there's more

  // Apply search filter if provided
  if (searchTerm && searchTerm.trim() !== "") {
    const lowercasedSearchTerm = searchTerm.toLowerCase().trim();
    queryBuilder = query(
      companiesCol,
      orderBy("normalizedName"),
      where("normalizedName", ">=", lowercasedSearchTerm),
      where("normalizedName", "<=", lowercasedSearchTerm + "\uf8ff"),
      limit(pageSize + 1),
    );
  }

  // Apply cursor for pagination
  if (cursor && paginationCursors.has(cursor)) {
    const cursorDoc = paginationCursors.get(cursor)!;
    queryBuilder = query(queryBuilder, startAfter(cursorDoc));
  }

  const querySnapshot = await getDocs(queryBuilder);
  const docs = querySnapshot.docs;
  const hasMore = docs.length > pageSize;
  const hasPrev = !!cursor; // If we have a cursor, we can go back

  // Remove the extra document used for hasMore check
  const companies = docs.slice(0, pageSize).map(mapFirestoreDocToCompany);

  // Generate cursors for navigation
  let nextCursor: string | undefined;
  let prevCursor: string | undefined;

  if (hasMore && companies.length > 0) {
    nextCursor = generateCursorKey(searchTerm, "next");
    paginationCursors.set(nextCursor, docs[pageSize - 1]);
  }

  if (hasPrev && companies.length > 0) {
    prevCursor = generateCursorKey(searchTerm, "prev");
    paginationCursors.set(prevCursor, docs[0]);
  }

  return {
    companies,
    nextCursor,
    prevCursor,
    hasMore,
    hasPrev,
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
  pageSize = 9,
  searchTerm,
  cursor,
}: GetCompaniesParams = {}): Promise<PaginatedCompaniesResponse> {
  try {
    const normalizedSearchTerm = searchTerm?.trim();

    // Use cursor-based pagination for better performance
    const result = await fetchCompaniesWithCursor(
      pageSize,
      normalizedSearchTerm,
      cursor,
    );

    // For backward compatibility, calculate approximate page info
    // Note: This is less accurate but more performant than counting all documents
    return {
      companies: result.companies,
      nextCursor: result.nextCursor,
      prevCursor: result.prevCursor,
      hasMore: result.hasMore,
      // Optional traditional pagination info (less accurate)
      currentPage: cursor ? undefined : page,
      totalPages: undefined, // We don't calculate this for performance
      totalCompanies: undefined, // We don't calculate this for performance
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
 * @function getCompaniesWithTotalCount
 * @description Fetches a paginated list of companies using traditional offset-based pagination.
 * This function is less performant as it calculates the total number of companies to provide total page counts, which involves an expensive Firestore count operation.
 * Use this only when total counts are absolutely necessary.
 * @param {Omit<GetCompaniesParams, "cursor">} [params={}] - The parameters for fetching companies, including page and page size.
 * @returns {Promise<PaginatedCompaniesResponse>} A promise that resolves to a paginated list of companies with full pagination details.
 */
export async function getCompaniesWithTotalCount({
  page = 1,
  pageSize = 9,
  searchTerm,
}: Omit<
  GetCompaniesParams,
  "cursor"
> = {}): Promise<PaginatedCompaniesResponse> {
  try {
    const cacheKey = `list_${page}_${pageSize}_${searchTerm || ""}`;
    
    if (companiesListCache.has(cacheKey)) {
      const cached = companiesListCache.get(cacheKey)!;
      if (Date.now() - cached.timestamp < CACHE_DURATION) {
        return cached.response;
      }
    }

    const companiesCol = collection(getFirestore(), "companies");
    let baseQuery = query(companiesCol, orderBy("normalizedName"));

    const normalizedSearchTerm = searchTerm?.trim();
    if (normalizedSearchTerm) {
      const lowercasedSearchTerm = normalizedSearchTerm.toLowerCase();
      baseQuery = query(
        companiesCol,
        orderBy("normalizedName"),
        where("normalizedName", ">=", lowercasedSearchTerm),
        where("normalizedName", "<=", lowercasedSearchTerm + "\uf8ff"),
      );
    }

    // Get total count (this is expensive!)
    const countSnapshot = await getCountFromServer(baseQuery);
    const totalCompanies = countSnapshot.data().count;
    const totalPages = Math.ceil(totalCompanies / pageSize) || 1;
    const currentPage = Math.min(Math.max(1, page), totalPages);

    // Calculate offset for traditional pagination
    const offset = (currentPage - 1) * pageSize;

    // Get the actual data with limit
    let finalQuery = query(baseQuery, limit(pageSize));

    if (offset > 0) {
      const skipQuery = query(baseQuery, limit(offset));
      const skipSnapshot = await getDocs(skipQuery);
      if (skipSnapshot.docs.length > 0) {
        const lastSkippedDoc = skipSnapshot.docs[skipSnapshot.docs.length - 1];
        finalQuery = query(
          baseQuery,
          startAfter(lastSkippedDoc),
          limit(pageSize),
        );
      }
    }

    const querySnapshot = await getDocs(finalQuery);
    const companies = querySnapshot.docs.map(mapFirestoreDocToCompany);
    const hasMore = currentPage < totalPages;

    let nextCursor: string | undefined;
    if (hasMore && querySnapshot.docs.length > 0) {
      const lastDoc = querySnapshot.docs[querySnapshot.docs.length - 1];
      nextCursor = generateCursorKey(searchTerm, "next");
      paginationCursors.set(nextCursor, lastDoc);
    }

    const response = {
      companies,
      totalCompanies,
      totalPages,
      currentPage,
      hasMore,
      nextCursor,
    };

    companiesListCache.set(cacheKey, {
      response,
      timestamp: Date.now(),
    });

    return response;
  } catch (error) {
    console.error("Error in getCompaniesWithTotalCount:", error);
    return {
      companies: [],
      totalCompanies: 0,
      totalPages: 1,
      currentPage: 1,
      hasMore: false,
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
const singleCompanyCache = new Map<
  string,
  { company: Company; timestamp: number }
>();
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 1 day

async function fetchCompanyByIdFromFirestore(
  companyId?: string,
  useCache: boolean = true,
): Promise<Company | undefined> {
  if (!companyId || typeof companyId !== "string") {
    console.warn("fetchCompanyByIdFromFirestore: invalid companyId", companyId);
    return undefined;
  }

  if (useCache && singleCompanyCache.has(companyId)) {
    const cached = singleCompanyCache.get(companyId)!;
    if (Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.company;
    }
  }

  const companyDocRef = doc(getFirestore(), "companies", companyId);
  const companySnap = await getDoc(companyDocRef);

  if (companySnap.exists()) {
    const company = mapFirestoreDocToCompany(companySnap);
    if (useCache) {
      singleCompanyCache.set(companyId, {
        company,
        timestamp: Date.now(),
      });
    }
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
  try {
    return await fetchCompanyByIdFromFirestore(id, useCache);
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

  const cacheKey = `slug_${companySlug}`;
  if (useCache && singleCompanyCache.has(cacheKey)) {
    const cached = singleCompanyCache.get(cacheKey)!;
    if (Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.company;
    }
  }

  const companiesCol = collection(getFirestore(), "companies");
  const q = query(companiesCol, where("slug", "==", companySlug), limit(1));
  const querySnapshot = await getDocs(q);

  if (!querySnapshot.empty) {
    const company = mapFirestoreDocToCompany(querySnapshot.docs[0]);
    if (useCache) {
      singleCompanyCache.set(cacheKey, {
        company,
        timestamp: Date.now(),
      });
    }
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
  try {
    return await fetchCompanyBySlugFromFirestore(slug, useCache);
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
  if (
    useCache &&
    cachedSlugs &&
    Date.now() - cachedSlugs.timestamp < CACHE_DURATION
  ) {
    return cachedSlugs.slugs;
  }

  const companiesCol = collection(getFirestore(), "companies");
  const q = query(companiesCol, orderBy("slug"));
  const companiesSnapshot = await getDocs(q);
  const slugs = companiesSnapshot.docs
    .map((docSnap) => docSnap.data().slug as string)
    .filter(Boolean);

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
// Cached companies list fetching
const companiesListCache = new Map<
  string,
  { response: PaginatedCompaniesResponse; timestamp: number }
>();

/**
 * @function invalidateCompaniesCache
 * @description Clears all in-memory caches related to company data, including single company cache, slug cache, pagination cursors, and list cache.
 * This should be called after any write operation (add, update, delete) to ensure data consistency.
 */
export const invalidateCompaniesCache = () => {
  singleCompanyCache.clear();
  cachedSlugs = null;
  paginationCursors.clear();
  companiesListCache.clear();
};

/**
 * @function revalidateCompaniesPage
 * @description Triggers a revalidation of the Next.js pages that display company data and invalidates the in-memory cache.
 * @async
 */
async function revalidateCompaniesPage() {
  try {
    // We no longer trigger the admin API revalidation here as it's being removed.
    // The server action calling this data layer should handle Next.js cache revalidation (revalidatePath/revalidateTag).
    invalidateCompaniesCache();
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
    const docRef = await addDoc(companiesCol, dataForFirestore);

    await revalidateCompaniesPage();

    return { id: docRef.id };
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

    await revalidateCompaniesPage();

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

    await revalidateCompaniesPage();

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
    
    await import("firebase/firestore").then(mod => mod.deleteDoc(companyDocRef));

    await revalidateCompaniesPage();

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
