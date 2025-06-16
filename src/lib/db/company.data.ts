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
} from "firebase/firestore";
import { slugify } from "@/lib/utils";
import { headers } from "next/headers";

interface GetCompaniesParams {
    page?: number;
    pageSize?: number;
    searchTerm?: string;
}

interface PaginatedCompaniesResponse {
    companies: Company[];
    totalCompanies: number;
    totalPages: number;
    currentPage: number;
}

function mapFirestoreDocToCompany(
    docSnap: import("firebase/firestore").DocumentSnapshot
): Company {
    const data = docSnap.data()!;
    const company: Company = {
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
    return company;
}

const setCacheHeaders = () => {
    const headersList = headers();
    headersList.set(
        "Cache-Control",
        "public, s-maxage=3600, stale-while-revalidate=7200"
    );
};

async function fetchAllCompaniesFromFirestore(
    currentSearchTerm?: string
): Promise<Company[]> {
    const companiesCol = collection(db, "companies");
    let q = query(companiesCol, orderBy("normalizedName"));

    if (currentSearchTerm && currentSearchTerm.trim() !== "") {
        const lowercasedSearchTerm = currentSearchTerm.toLowerCase().trim();
        q = query(
            companiesCol,
            orderBy("normalizedName"),
            where("normalizedName", ">=", lowercasedSearchTerm),
            where("normalizedName", "<=", lowercasedSearchTerm + "\uf8ff")
        );
    }
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(mapFirestoreDocToCompany);
}

export async function getCompanies({
    page = 1,
    pageSize = 9,
    searchTerm,
}: GetCompaniesParams = {}): Promise<PaginatedCompaniesResponse> {
    setCacheHeaders();
    try {
        let baseCompaniesList = await fetchAllCompaniesFromFirestore(
            searchTerm?.trim()
        );
        let filteredCompanies = [...baseCompaniesList];

        if (searchTerm && searchTerm.trim() !== "") {
            const lowercasedSearchTerm = searchTerm.toLowerCase().trim();
            // Refetch all if search term exists, then filter locally (as Firestore doesn't support OR on different fields well)
            filteredCompanies = (
                await fetchAllCompaniesFromFirestore(undefined)
            ).filter(
                (company) =>
                    (company.normalizedName &&
                        company.normalizedName.includes(
                            lowercasedSearchTerm
                        )) ||
                    (company.description &&
                        company.description
                            .toLowerCase()
                            .includes(lowercasedSearchTerm))
            );
        }

        const totalCompanies = filteredCompanies.length;
        const totalPages = Math.ceil(totalCompanies / pageSize) || 1;
        const currentPageResult = Math.min(Math.max(1, page), totalPages);
        const startIndex = (currentPageResult - 1) * pageSize;
        const paginatedCompanies = filteredCompanies.slice(
            startIndex,
            startIndex + pageSize
        );

        return {
            companies: paginatedCompanies,
            totalCompanies,
            totalPages,
            currentPage: currentPageResult,
        };
    } catch (error) {
        console.error("Error in getCompanies:", error);
        return {
            companies: [],
            totalCompanies: 0,
            totalPages: 1,
            currentPage: 1,
        };
    }
}

async function fetchCompanyByIdFromFirestore(
    companyId?: string
): Promise<Company | undefined> {
    if (!companyId || typeof companyId !== "string") {
        console.warn(
            "fetchCompanyByIdFromFirestore: companyId was undefined or not a string.",
            companyId
        );
        return undefined;
    }
    const companyDocRef = doc(db, "companies", companyId);
    const companySnap = await getDoc(companyDocRef);
    if (companySnap.exists()) {
        return mapFirestoreDocToCompany(companySnap);
    }
    return undefined;
}

export const getCompanyById = async (
    id: string
): Promise<Company | undefined> => {
    try {
        return await fetchCompanyByIdFromFirestore(id);
    } catch (error) {
        console.error(`Error fetching company by ID ${id}:`, error);
        return undefined;
    }
};

async function fetchCompanyBySlugFromFirestore(
    companySlug?: string
): Promise<Company | undefined> {
    if (!companySlug || typeof companySlug !== "string") {
        console.warn(
            "fetchCompanyBySlugFromFirestore: companySlug was undefined or not a string.",
            companySlug
        );
        return undefined;
    }
    const companiesCol = collection(db, "companies");
    const q = query(companiesCol, where("slug", "==", companySlug), limit(1));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
        const companyDoc = querySnapshot.docs[0];
        return mapFirestoreDocToCompany(companyDoc);
    }
    return undefined;
}

export const getCompanyBySlug = async (
    slug: string
): Promise<Company | undefined> => {
    try {
        return await fetchCompanyBySlugFromFirestore(slug);
    } catch (error) {
        console.error(`Error fetching company by slug ${slug}:`, error);
        return undefined;
    }
};

async function fetchAllCompanySlugsFromFirestore(): Promise<string[]> {
    const companiesCol = collection(db, "companies");
    const q = query(companiesCol, orderBy("slug"));
    const companiesSnapshot = await getDocs(q);
    return companiesSnapshot.docs
        .map((docSnap) => docSnap.data().slug as string)
        .filter(Boolean);
}

export const getAllCompanySlugs = async (): Promise<string[]> => {
    try {
        return await fetchAllCompanySlugsFromFirestore();
    } catch (error) {
        console.error("Error fetching all company slugs:", error);
        return [];
    }
};

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
        const companySlug = slugify(companyData.name);
        const normalizedName = companyData.name.toLowerCase();

        const slugQuery = query(
            collection(db, "companies"),
            where("slug", "==", companySlug),
            limit(1)
        );
        const slugSnapshot = await getDocs(slugQuery);
        if (!slugSnapshot.empty) {
            return {
                id: slugSnapshot.docs[0].id,
                error: `Company with name "${companyData.name}" (slug: ${companySlug}) already exists.`,
                alreadyExists: true,
            };
        }

        const companiesCol = collection(db, "companies");
        const dataForFirestore: Omit<Company, "id"> & {
            statsLastUpdatedAt?: FieldValue | null;
        } = {
            ...companyData,
            slug: companySlug,
            normalizedName: normalizedName,
            problemCount: 0,
            difficultyCounts: { Easy: 0, Medium: 0, Hard: 0 },
            recencyCounts: {
                last_30_days: 0,
                within_3_months: 0,
                within_6_months: 0,
                older_than_6_months: 0,
            },
            commonTags: [],
            statsLastUpdatedAt: undefined, // Let the admin action populate this
        };
        if (companyData.logo === undefined) delete dataForFirestore.logo;
        if (companyData.description === undefined)
            delete dataForFirestore.description;
        if (companyData.website === undefined) delete dataForFirestore.website;

        const docRef = await addDoc(companiesCol, dataForFirestore);
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
