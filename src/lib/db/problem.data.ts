import type {
    LeetCodeProblem,
    PaginatedProblemsResponse,
    DifficultyFilter,
    LastAskedFilter,
    SortKey,
    LastAskedPeriod,
    Company,
} from "@/types";
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
    collectionGroup,
} from "firebase/firestore";
import { slugify } from "@/lib/utils";
import { getCompanyById, getCompanyBySlug } from "./company.data";

async function fetchAllProblemsForCompanyFromFirestore(
    compId?: string
): Promise<LeetCodeProblem[]> {
    if (!compId || typeof compId !== "string") {
        console.warn(
            "fetchAllProblemsForCompanyFromFirestore: compId was undefined or not a string.",
            compId
        );
        return [];
    }
    const companyDoc = await getCompanyById(compId);
    const companySlugValue = companyDoc?.slug;

    const problemsColRef = collection(db, "companies", compId, "problems");
    const q = query(problemsColRef, orderBy("normalizedTitle"));
    const problemSnapshot = await getDocs(q);
    return problemSnapshot.docs.map((docSnap) => {
        const data = docSnap.data();
        return {
            id: docSnap.id,
            companyId: compId,
            companySlug:
                companySlugValue || slugify(companyDoc?.name || "unknown"),
            slug: data.slug || slugify(data.title),
            ...data,
        } as LeetCodeProblem;
    });
}

export const getProblemsByCompanyFromDb = async (
    companyId: string,
    params: {
        page?: number;
        pageSize?: number;
        difficultyFilter?: DifficultyFilter;
        lastAskedFilter?: LastAskedFilter;
        searchTerm?: string;
        sortKey?: SortKey;
    } = {}
): Promise<PaginatedProblemsResponse> => {
    const {
        page = 1,
        pageSize = 10,
        difficultyFilter = "all",
        lastAskedFilter = "all",
        searchTerm = "",
        sortKey = "title",
    } = params;

    try {
        const allProblemsForCompany =
            await fetchAllProblemsForCompanyFromFirestore(companyId);
        let processedProblems = [...allProblemsForCompany];

        if (difficultyFilter !== "all") {
            processedProblems = processedProblems.filter(
                (p) => p.difficulty === difficultyFilter
            );
        }
        if (lastAskedFilter !== "all") {
            processedProblems = processedProblems.filter(
                (p) => p.lastAskedPeriod === lastAskedFilter
            );
        }
        if (searchTerm.trim() !== "") {
            const lowercasedSearchTerm = searchTerm.toLowerCase().trim();
            processedProblems = processedProblems.filter(
                (p) =>
                    p.title.toLowerCase().includes(lowercasedSearchTerm) ||
                    (p.tags &&
                        p.tags.some((tag) =>
                            tag.toLowerCase().includes(lowercasedSearchTerm)
                        ))
            );
        }

        const difficultyOrder: Record<LeetCodeProblem["difficulty"], number> = {
            Easy: 1,
            Medium: 2,
            Hard: 3,
        };
        const lastAskedOrder: Record<LastAskedPeriod, number> = {
            last_30_days: 1,
            within_3_months: 2,
            within_6_months: 3,
            older_than_6_months: 4,
        };

        processedProblems.sort((a, b) => {
            if (sortKey === "title") return a.title.localeCompare(b.title);
            if (sortKey === "difficulty")
                return (
                    difficultyOrder[a.difficulty] -
                    difficultyOrder[b.difficulty]
                );
            if (sortKey === "lastAsked") {
                const aPeriod = a.lastAskedPeriod
                    ? lastAskedOrder[a.lastAskedPeriod]
                    : Number.MAX_SAFE_INTEGER;
                const bPeriod = b.lastAskedPeriod
                    ? lastAskedOrder[b.lastAskedPeriod]
                    : Number.MAX_SAFE_INTEGER;
                return aPeriod - bPeriod;
            }
            return 0;
        });

        const totalProblems = processedProblems.length;
        const totalPages = Math.ceil(totalProblems / pageSize) || 1;
        const currentPageResult = Math.min(Math.max(1, page), totalPages);
        const startIndex = (currentPageResult - 1) * pageSize;
        const paginatedProblems = processedProblems.slice(
            startIndex,
            startIndex + pageSize
        );

        return {
            problems: paginatedProblems,
            totalProblems,
            totalPages,
            currentPage: currentPageResult,
        };
    } catch (error) {
        console.error(
            `Error in getProblemsByCompanyFromDb for companyId ${companyId}:`,
            error
        );
        return {
            problems: [],
            totalProblems: 0,
            totalPages: 1,
            currentPage: 1,
        };
    }
};

async function fetchAllProblemsFromFirestore(): Promise<LeetCodeProblem[]> {
    const problemsColGroup = collectionGroup(db, "problems");
    const q = query(problemsColGroup, orderBy("normalizedTitle"));
    const problemSnapshot = await getDocs(q);

    const problemsWithCompanyInfo = await Promise.all(
        problemSnapshot.docs.map(async (docSnap) => {
            const problemData = docSnap.data();
            const companyId = docSnap.ref.parent.parent?.id;
            if (!companyId) {
                console.warn(
                    `Problem ${docSnap.id} missing companyId in path.`
                );
                return null;
            }

            const company = await getCompanyById(companyId);
            return {
                id: docSnap.id,
                companyId: companyId,
                companySlug:
                    company?.slug || slugify(company?.name || "unknown"),
                slug: problemData.slug || slugify(problemData.title),
                ...problemData,
            } as LeetCodeProblem;
        })
    );
    return problemsWithCompanyInfo.filter(Boolean) as LeetCodeProblem[];
}

export const getAllProblems = async (): Promise<LeetCodeProblem[]> => {
    try {
        return await fetchAllProblemsFromFirestore();
    } catch (error) {
        console.error("Error fetching all problems:", error);
        return [];
    }
};

async function fetchProblemDetailsFromFirestore(
    compId?: string,
    probId?: string
): Promise<LeetCodeProblem | undefined> {
    if (
        !compId ||
        typeof compId !== "string" ||
        !probId ||
        typeof probId !== "string"
    ) {
        console.warn(
            "fetchProblemDetailsFromFirestore: compId or probId was invalid.",
            { compId, probId }
        );
        return undefined;
    }
    const problemDocRef = doc(db, "companies", compId, "problems", probId);
    const problemSnap = await getDoc(problemDocRef);
    if (problemSnap.exists()) {
        const data = problemSnap.data();
        const company = await getCompanyById(compId);
        return {
            id: problemSnap.id,
            companyId: compId,
            companySlug: company?.slug || slugify(company?.name || "unknown"),
            slug: data.slug || slugify(data.title),
            ...data,
        } as LeetCodeProblem;
    }
    return undefined;
}

export const getProblemDetailsFromDb = async (
    companyId: string,
    problemId: string
): Promise<LeetCodeProblem | undefined> => {
    try {
        return await fetchProblemDetailsFromFirestore(companyId, problemId);
    } catch (error) {
        console.error(
            `Error fetching problem details for company ${companyId}, problem ${problemId}:`,
            error
        );
        return undefined;
    }
};

async function fetchProblemByCompanySlugAndProblemSlug(
    compSlug?: string,
    probSlug?: string
): Promise<{
    company: Company | undefined;
    problem: LeetCodeProblem | undefined;
}> {
    if (
        !compSlug ||
        typeof compSlug !== "string" ||
        !probSlug ||
        typeof probSlug !== "string"
    ) {
        console.warn(
            "fetchProblemByCompanySlugAndProblemSlug: compSlug or probSlug was invalid.",
            { compSlug, probSlug }
        );
        return { company: undefined, problem: undefined };
    }

    const company = await getCompanyBySlug(compSlug);
    if (!company) return { company: undefined, problem: undefined };

    const problemsColRef = collection(db, "companies", company.id, "problems");
    const q = query(problemsColRef, where("slug", "==", probSlug), limit(1));
    const problemSnapshot = await getDocs(q);

    if (!problemSnapshot.empty) {
        const problemDoc = problemSnapshot.docs[0];
        const problemData = problemDoc.data();
        return {
            company,
            problem: {
                id: problemDoc.id,
                companyId: company.id,
                companySlug: company.slug,
                slug: problemData.slug || slugify(problemData.title), // Ensure slug is populated
                ...problemData,
            } as LeetCodeProblem,
        };
    }
    return { company, problem: undefined };
}

export const getProblemByCompanySlugAndProblemSlug = async (
    companySlug: string,
    problemSlug: string
): Promise<{
    company: Company | undefined;
    problem: LeetCodeProblem | undefined;
}> => {
    try {
        return await fetchProblemByCompanySlugAndProblemSlug(
            companySlug,
            problemSlug
        );
    } catch (error) {
        console.error(
            `Error fetching problem by company slug ${companySlug} and problem slug ${problemSlug}:`,
            error
        );
        return { company: undefined, problem: undefined };
    }
};

async function fetchAllProblemCompanyAndProblemSlugsFromFirestore(): Promise<
    Array<{ companySlug: string; problemSlug: string }>
> {
    const allProbs = await fetchAllProblemsFromFirestore();
    return allProbs
        .map((p) => ({ companySlug: p.companySlug, problemSlug: p.slug }))
        .filter((s) => s.companySlug && s.problemSlug);
}

export const getAllProblemCompanyAndProblemSlugs = async (): Promise<
    Array<{ companySlug: string; problemSlug: string }>
> => {
    try {
        return await fetchAllProblemCompanyAndProblemSlugsFromFirestore();
    } catch (error) {
        console.error(
            "Error fetching all problem company and problem slugs:",
            error
        );
        return [];
    }
};

export const addProblemToDb = async (
    companyId: string,
    problemData: Omit<
        LeetCodeProblem,
        "id" | "companyId" | "companySlug" | "slug"
    > & { normalizedTitle: string }
): Promise<{ id: string | null; updated: boolean; error?: string }> => {
    try {
        const problemSlug = slugify(problemData.title);
        const problemCollectionRef = collection(
            db,
            "companies",
            companyId,
            "problems"
        );

        const q = query(
            problemCollectionRef,
            where("normalizedTitle", "==", problemData.normalizedTitle),
            limit(1)
        );
        const querySnapshot = await getDocs(q);

        const dataToSave = {
            ...problemData,
            slug: problemSlug,
        };

        if (!querySnapshot.empty) {
            const existingProblemDoc = querySnapshot.docs[0];
            await updateDoc(
                doc(
                    db,
                    "companies",
                    companyId,
                    "problems",
                    existingProblemDoc.id
                ),
                {
                    lastAskedPeriod: problemData.lastAskedPeriod,
                    tags: problemData.tags,
                    link: problemData.link,
                    difficulty: problemData.difficulty,
                    slug: problemSlug,
                }
            );
            return { id: existingProblemDoc.id, updated: true };
        } else {
            const docRef = await addDoc(problemCollectionRef, dataToSave);
            return { id: docRef.id, updated: false };
        }
    } catch (error) {
        const message =
            error instanceof Error
                ? error.message
                : "An unknown error occurred while saving problem.";
        console.error("Error in addProblemToDb:", message, error);
        return { id: null, updated: false, error: message };
    }
};

export { getProblemDetailsFromDb as getProblemDetails };
