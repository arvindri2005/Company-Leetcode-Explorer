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
    orderBy,
    Timestamp,
    FieldValue,
    startAfter,
    QueryDocumentSnapshot,
    Firestore,
    getCountFromServer,
} from "firebase/firestore";
import { slugify } from "@/lib/utils";
import { triggerCompaniesRevalidation } from "@/app/actions/admin.actions";

// Helper function to ensure db is not null
function getFirestore(): Firestore {
    if (!db) {
        throw new Error(
            "Firestore is not initialized. Check your Firebase configuration."
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
    docSnap: import("firebase/firestore").DocumentSnapshot
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
        statsLastUpdatedAt:
            data.statsLastUpdatedAt instanceof Timestamp
                ? data.statsLastUpdatedAt.toDate()
                : undefined,
    };
}

// Generate a unique cursor key
function generateCursorKey(
    searchTerm?: string,
    direction: "next" | "prev" = "next"
): string {
    return `${searchTerm || "all"}_${direction}_${Date.now()}`;
}

// Cursor-based pagination - only loads visible companies
async function fetchCompaniesWithCursor(
    pageSize: number,
    searchTerm?: string,
    cursor?: string,
    direction: "next" | "prev" = "next"
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
        limit(pageSize + 1)
    ); // +1 to check if there's more

    // Apply search filter if provided
    if (searchTerm && searchTerm.trim() !== "") {
        const lowercasedSearchTerm = searchTerm.toLowerCase().trim();
        queryBuilder = query(
            companiesCol,
            orderBy("normalizedName"),
            where("normalizedName", ">=", lowercasedSearchTerm),
            where("normalizedName", "<=", lowercasedSearchTerm + "\uf8ff"),
            limit(pageSize + 1)
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

// Optimized main function using cursor-based pagination
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
            cursor
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

// Alternative function that provides traditional pagination with total counts
// Use this only when you specifically need total counts (slower)
export async function getCompaniesWithTotalCount({
    page = 1,
    pageSize = 9,
    searchTerm,
}: Omit<
    GetCompaniesParams,
    "cursor"
> = {}): Promise<PaginatedCompaniesResponse> {
    try {
        const companiesCol = collection(getFirestore(), "companies");
        let baseQuery = query(companiesCol, orderBy("normalizedName"));

        const normalizedSearchTerm = searchTerm?.trim();
        if (normalizedSearchTerm) {
            const lowercasedSearchTerm = normalizedSearchTerm.toLowerCase();
            baseQuery = query(
                companiesCol,
                orderBy("normalizedName"),
                where("normalizedName", ">=", lowercasedSearchTerm),
                where("normalizedName", "<=", lowercasedSearchTerm + "\uf8ff")
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
        const dataQuery = query(baseQuery, limit(pageSize));

        // For offset, we need to skip documents (this is expensive for large offsets!)
        let finalQuery = dataQuery;
        if (offset > 0) {
            // This is inefficient for large offsets - consider using cursor-based pagination instead
            const skipQuery = query(baseQuery, limit(offset));
            const skipSnapshot = await getDocs(skipQuery);
            if (skipSnapshot.docs.length > 0) {
                const lastSkippedDoc =
                    skipSnapshot.docs[skipSnapshot.docs.length - 1];
                finalQuery = query(
                    baseQuery,
                    startAfter(lastSkippedDoc),
                    limit(pageSize)
                );
            }
        }

        const querySnapshot = await getDocs(finalQuery);
        const companies = querySnapshot.docs.map(mapFirestoreDocToCompany);

        return {
            companies,
            totalCompanies,
            totalPages,
            currentPage,
            hasMore: currentPage < totalPages,
        };
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

// Infinite scroll helper - loads next batch of companies
export async function loadMoreCompanies(
    currentCursor: string,
    pageSize: number = 9,
    searchTerm?: string
): Promise<{
    companies: Company[];
    nextCursor?: string;
    hasMore: boolean;
}> {
    try {
        const result = await fetchCompaniesWithCursor(
            pageSize,
            searchTerm,
            currentCursor
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
    useCache: boolean = true
): Promise<Company | undefined> {
    if (!companyId || typeof companyId !== "string") {
        console.warn(
            "fetchCompanyByIdFromFirestore: invalid companyId",
            companyId
        );
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

export const getCompanyById = async (
    id: string,
    useCache: boolean = true
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
    useCache: boolean = true
): Promise<Company | undefined> {
    if (!companySlug || typeof companySlug !== "string") {
        console.warn(
            "fetchCompanyBySlugFromFirestore: invalid companySlug",
            companySlug
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

export const getCompanyBySlug = async (
    slug: string,
    useCache: boolean = true
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
    useCache: boolean = true
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

export const getAllCompanySlugs = async (
    useCache: boolean = true
): Promise<string[]> => {
    try {
        return await fetchAllCompanySlugsFromFirestore(useCache);
    } catch (error) {
        console.error("Error fetching all company slugs:", error);
        return [];
    }
};

// Cache invalidation function
export const invalidateCompaniesCache = () => {
    singleCompanyCache.clear();
    cachedSlugs = null;
    paginationCursors.clear();
};

async function revalidateCompaniesPage() {
    try {
        await triggerCompaniesRevalidation();
        invalidateCompaniesCache();
    } catch (error) {
        console.error("Failed to revalidate companies page:", error);
    }
}

// Optimized add function
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
    >
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
            false
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
            statsLastUpdatedAt: undefined,
        };

        // Clean up undefined values
        Object.keys(dataForFirestore).forEach((key) => {
            if (
                dataForFirestore[key as keyof typeof dataForFirestore] ===
                undefined
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
