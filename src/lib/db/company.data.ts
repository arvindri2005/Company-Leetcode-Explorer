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
    orderBy,
} from "firebase/firestore";
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
    return querySnapshot.docs.map(
        (docSnap) =>
            ({
                id: docSnap.id,
                slug: docSnap.data().slug || slugify(docSnap.data().name),
                ...docSnap.data(),
            } as Company)
    );
}

export const getCompanies = async ({
    page = 1,
    pageSize = 9,
    searchTerm,
}: GetCompaniesParams = {}): Promise<PaginatedCompaniesResponse> => {
    try {
        let baseCompaniesList = await fetchAllCompaniesFromFirestore(
            searchTerm?.trim()
        );
        let filteredCompanies = [...baseCompaniesList];

        if (searchTerm && searchTerm.trim() !== "") {
            const lowercasedSearchTerm = searchTerm.toLowerCase().trim();
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
};

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
        const data = companySnap.data();
        return {
            id: companySnap.id,
            slug: data.slug || slugify(data.name),
            ...data,
        } as Company;
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
        const data = companyDoc.data();
        return {
            id: companyDoc.id,
            slug: data.slug || slugify(data.name),
            ...data,
        } as Company;
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
        console.error("Error in addCompanyToDb:", message, error);
        return { id: null, error: message };
    }
};
