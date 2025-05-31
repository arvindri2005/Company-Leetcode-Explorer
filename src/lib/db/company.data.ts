import type { Company } from "@/types";
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
} from "firebase/firestore";
import { unstable_cache } from "next/cache";
import { slugify } from "@/lib/utils";

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

const getCachedFirestoreCompanies = unstable_cache(
    async (currentSearchTerm?: string) => {
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
        return querySnapshot.docs.map(
            (docSnap) =>
                ({
                    id: docSnap.id,
                    slug: docSnap.data().slug || slugify(docSnap.data().name),
                    ...docSnap.data(),
                } as Company)
        );
    },
    ["firestore-companies-list-with-optional-search-v2"],
    {
        tags: ["companies-collection-broad"],
        revalidate: 60, // Reduced from 3600 to 60 seconds
    }
);

export const getCompanies = async ({
    page = 1,
    pageSize = 9,
    searchTerm,
}: GetCompaniesParams = {}): Promise<PaginatedCompaniesResponse> => {
    try {
        let baseCompaniesList = await getCachedFirestoreCompanies(
            searchTerm?.trim()
        );
        let filteredCompanies = [...baseCompaniesList];

        if (searchTerm && searchTerm.trim() !== "") {
            const lowercasedSearchTerm = searchTerm.toLowerCase().trim();
            const searchTermPassedToCache = !!(
                searchTerm && searchTerm.trim() !== ""
            );

            filteredCompanies = filteredCompanies.filter(
                (company) =>
                    (company.description &&
                        company.description
                            .toLowerCase()
                            .includes(lowercasedSearchTerm)) ||
                    (!searchTermPassedToCache &&
                        company.normalizedName &&
                        company.normalizedName.includes(lowercasedSearchTerm))
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
        return {
            companies: [],
            totalCompanies: 0,
            totalPages: 1,
            currentPage: 1,
        };
    }
};

const getCachedCompanyById = unstable_cache(
    async (companyId: string) => {
        if (!companyId || typeof companyId !== "string") return undefined;
        const companyDocRef = doc(db, "companies", companyId);
        const companySnap = await getDoc(companyDocRef);
        if (companySnap.exists()) {
            const data = companySnap.data();
            return {
                id: companySnap.id,
                slug: data.slug || slugify(data.name),
                ...data,
            } as Company;
        }
        return undefined;
    },
    ["company-by-id-cache-key-v2"],
    {
        tags: async (companyId: string) => {
            const companyIdTag =
                typeof companyId === "string" && companyId
                    ? `company-detail-${companyId}`
                    : "company-detail-unknown-arg";
            let slugTag = "company-slug-unknown-fetch";

            if (typeof companyId === "string" && companyId) {
                try {
                    const companyRef = doc(db, "companies", companyId);
                    const companySnap = await getDoc(companyRef);
                    const slug = companySnap.data()?.slug;
                    if (slug && typeof slug === "string") {
                        slugTag = `company-slug-${slug}`;
                    }
                } catch (e) {
                    // Error fetching for slug tag, keep fallback
                }
            }
            return [companyIdTag, slugTag].filter(
                (tag) => typeof tag === "string"
            );
        },
        revalidate: 3600,
    }
);

export const getCompanyById = async (
    id: string
): Promise<Company | undefined> => {
    try {
        return await getCachedCompanyById(id);
    } catch (error) {
        return undefined;
    }
};

const getCachedCompanyBySlug = unstable_cache(
    async (companySlug: string) => {
        if (!companySlug || typeof companySlug !== "string") return undefined;
        const companiesCol = collection(db, "companies");
        const q = query(
            companiesCol,
            where("slug", "==", companySlug),
            limit(1)
        );
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
            const companyDoc = querySnapshot.docs[0];
            const data = companyDoc.data();
            return {
                id: companyDoc.id,
                slug: data.slug || slugify(data.name),
                ...data,
            } as Company;
        }
        return undefined;
    },
    ["company-by-slug-cache-key-v2"],
    {
        tags: async (companySlug: string) => {
            const companySlugTag =
                typeof companySlug === "string" && companySlug
                    ? `company-slug-${companySlug}`
                    : "company-slug-unknown-arg";
            let companyDetailTag = "company-detail-unknown-fetch";

            if (typeof companySlug === "string" && companySlug) {
                try {
                    const companyQuery = query(
                        collection(db, "companies"),
                        where("slug", "==", companySlug),
                        limit(1)
                    );
                    const companySnap = await getDocs(companyQuery);
                    if (!companySnap.empty) {
                        const companyDoc = companySnap.docs[0];
                        if (
                            companyDoc.id &&
                            typeof companyDoc.id === "string"
                        ) {
                            companyDetailTag = `company-detail-${companyDoc.id}`;
                        }
                    }
                } catch (e) {
                    // Error fetching for detail tag, keep fallback
                }
            }
            return [companySlugTag, companyDetailTag].filter(
                (tag) => typeof tag === "string"
            );
        },
        revalidate: 3600,
    }
);

export const getCompanyBySlug = async (
    slug: string
): Promise<Company | undefined> => {
    try {
        return await getCachedCompanyBySlug(slug);
    } catch (error) {
        return undefined;
    }
};

const getCachedAllCompanySlugs = unstable_cache(
    async () => {
        const companiesCol = collection(db, "companies");
        const q = query(companiesCol, orderBy("slug"));
        const companiesSnapshot = await getDocs(q);
        return companiesSnapshot.docs
            .map((docSnap) => docSnap.data().slug as string)
            .filter(Boolean);
    },
    ["all-company-slugs-cache-key-v2"],
    { tags: ["companies-collection-broad"], revalidate: 3600 }
);

export const getAllCompanySlugs = async (): Promise<string[]> => {
    try {
        return await getCachedAllCompanySlugs();
    } catch (error) {
        return [];
    }
};

export const addCompanyToDb = async (
    companyData: Omit<Company, "id" | "slug">
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
        const dataForFirestore = {
            ...companyData,
            slug: companySlug,
            normalizedName: normalizedName,
        };
        if (companyData.logo === undefined)
            delete (dataForFirestore as Partial<Company>).logo;
        if (companyData.description === undefined)
            delete (dataForFirestore as Partial<Company>).description;
        if (companyData.website === undefined)
            delete (dataForFirestore as Partial<Company>).website;

        const docRef = await addDoc(companiesCol, dataForFirestore);
        return { id: docRef.id };
    } catch (error) {
        const message =
            error instanceof Error
                ? error.message
                : "An unknown error occurred while adding company.";
        return { id: null, error: message };
    }
};
