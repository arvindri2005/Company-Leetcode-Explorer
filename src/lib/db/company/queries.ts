import { unstable_cache } from "next/cache";
import type { Company } from "@/types";
import {
  collection,
  getDocs,
  doc,
  getDoc,
  query,
  where,
  limit,
  orderBy,
  startAfter,
} from "firebase/firestore";
import {
  getFirestore,
  mapFirestoreDocToCompany,
  encodeCursor,
  decodeCursor,
} from "./utils";

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
  console.log(
    `[DB] Companies list query executed. Fetched ${querySnapshot.docs.length} docs. Cost: ${querySnapshot.docs.length} reads.`,
  );

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
      id: lastCompany.id,
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
  pageSize = 9,
  searchTerm,
  cursor,
}: GetCompaniesParams = {}): Promise<PaginatedCompaniesResponse> {
  try {
    const normalizedSearchTerm = searchTerm?.trim();

    // Cache the initial load (no search, no cursor/page 1)
    if (
      !cursor &&
      (!normalizedSearchTerm || normalizedSearchTerm === "") &&
      page === 1
    ) {
      const cacheKey = `companies-list-initial-${pageSize}`;

      const getCachedInitialCompanies = unstable_cache(
        async () => {
          return await fetchCompaniesWithCursor(pageSize, undefined, undefined);
        },
        [cacheKey],
        {
          revalidate: 3600, // 1 hour
          tags: ["companies-list"],
        },
      );

      const result = await getCachedInitialCompanies();

      return {
        companies: result.companies,
        nextCursor: result.nextCursor,
        prevCursor: result.prevCursor,
        hasMore: result.hasMore,
        currentPage: 1,
        totalPages: undefined,
        totalCompanies: undefined,
      };
    }

    // Non-cached path (search or pagination)
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
  console.log(
    `[DB] fetchCompanyByIdFromFirestore: Fetching company ${companyId}`,
  );
  const companySnap = await getDoc(companyDocRef);
  console.log(
    `[DB] Company doc fetched. Cost: 1 read. Exists: ${companySnap.exists()}`,
  );

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
      tags: [`company-${id}`],
    },
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
  console.log(
    `[DB] fetchCompanyBySlugFromFirestore: Fetching company slug ${companySlug}`,
  );
  const companySnap = await getDoc(companyDocRef);
  console.log(
    `[DB] Company slug doc fetched. Cost: 1 read. Exists: ${companySnap.exists()}`,
  );

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
      tags: [`company-slug-${slug}`],
    },
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

export { fetchCompanyBySlugFromFirestore };
