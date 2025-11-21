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
import {
  dbGetUserBookmarkedProblemsInfo,
  dbGetAllUserProblemStatuses,
} from "./user.data";

async function fetchAllProblemsForCompanyFromFirestore(
  compId?: string,
): Promise<LeetCodeProblem[]> {
  if (!compId || typeof compId !== "string") {
    console.warn(
      "fetchAllProblemsForCompanyFromFirestore: compId was undefined or not a string.",
      compId,
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
      companySlug: companySlugValue || slugify(companyDoc?.name || "unknown"),
      slug: data.slug || slugify(data.title),
      ...data,
    } as LeetCodeProblem;
  });
}

/**
 * @function getProblemsByCompanyFromDb
 * @description Fetches a paginated, filtered, and sorted list of problems for a specific company.
 * @param {string} companyId - The ID of the company to fetch problems for.
 * @param {object} [params={}] - The parameters for filtering, sorting, and pagination.
 * @param {string} [params.cursor] - The cursor for the next page of results.
 * @param {number} [params.pageSize=10] - The number of problems to return per page.
 * @param {DifficultyFilter} [params.difficultyFilter='all'] - The difficulty level to filter by.
 * @param {LastAskedFilter} [params.lastAskedFilter='all'] - The recency period to filter by.
 * @param {string} [params.searchTerm=''] - A search term to filter problems by title or tags.
 * @param {SortKey} [params.sortKey='title'] - The key to sort the problems by.
 * @param {string} [params.userId] - The ID of the user to fetch bookmarks and status for.
 * @returns {Promise<PaginatedProblemsResponse>} A promise that resolves to the paginated list of problems.
 */
export const getProblemsByCompanyFromDb = async (
  companyId: string,
  params: {
    cursor?: string;
    pageSize?: number;
    difficultyFilter?: DifficultyFilter[];
    lastAskedFilter?: LastAskedFilter[];
    searchTerm?: string;
    sortKey?: SortKey;
    userId?: string;
  } = {},
): Promise<PaginatedProblemsResponse> => {
  const {
    cursor,
    pageSize = 10,
    difficultyFilter = [],
    lastAskedFilter = [],
    searchTerm = "",
    sortKey = "title",
    userId,
  } = params;

  try {
    const allProblemsForCompany =
      await fetchAllProblemsForCompanyFromFirestore(companyId);
    let processedProblems = [...allProblemsForCompany];

    // If a userId is provided, fetch and merge user-specific data (bookmarks, statuses)
    if (userId) {
      const [userBookmarks, userStatuses] = await Promise.all([
        dbGetUserBookmarkedProblemsInfo(userId),
        dbGetAllUserProblemStatuses(userId),
      ]);

      const bookmarkedProblemIds = new Set(
        userBookmarks.map((b) => b.problemId),
      );

      processedProblems = processedProblems.map((problem) => {
        const statusInfo = userStatuses[problem.id];
        return {
          ...problem,
          isBookmarked: bookmarkedProblemIds.has(problem.id),
          currentStatus: statusInfo ? statusInfo.status : undefined,
        };
      });
    }

    if (difficultyFilter.length > 0) {
      processedProblems = processedProblems.filter((p) =>
        difficultyFilter.includes(p.difficulty),
      );
    }
    if (lastAskedFilter.length > 0) {
      processedProblems = processedProblems.filter(
        (p) => p.lastAskedPeriod && lastAskedFilter.includes(p.lastAskedPeriod),
      );
    }
    if (searchTerm.trim() !== "") {
      const lowercasedSearchTerm = searchTerm.toLowerCase().trim();
      processedProblems = processedProblems.filter(
        (p) =>
          p.title.toLowerCase().includes(lowercasedSearchTerm) ||
          (p.tags &&
            p.tags.some((tag) =>
              tag.toLowerCase().includes(lowercasedSearchTerm),
            )),
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
        return difficultyOrder[a.difficulty] - difficultyOrder[b.difficulty];
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

    let startIndex = 0;
    if (cursor) {
      const cursorIndex = processedProblems.findIndex((p) => p.id === cursor);
      if (cursorIndex !== -1) {
        startIndex = cursorIndex + 1;
      }
    }

    const paginatedProblems = processedProblems.slice(
      startIndex,
      startIndex + pageSize,
    );

    const hasMore = startIndex + pageSize < totalProblems;
    const nextCursor = hasMore
      ? paginatedProblems[paginatedProblems.length - 1]?.id
      : undefined;

    return {
      problems: paginatedProblems,
      totalProblems,
      hasMore,
      nextCursor,
    };
  } catch (error) {
    console.error(
      `Error in getProblemsByCompanyFromDb for companyId ${companyId}:`,
      error,
    );
    return {
      problems: [],
      totalProblems: 0,
      hasMore: false,
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
        console.warn(`Problem ${docSnap.id} missing companyId in path.`);
        return null;
      }

      const company = await getCompanyById(companyId);
      return {
        id: docSnap.id,
        companyId: companyId,
        companySlug: company?.slug || slugify(company?.name || "unknown"),
        slug: problemData.slug || slugify(problemData.title),
        ...problemData,
      } as LeetCodeProblem;
    }),
  );
  return problemsWithCompanyInfo.filter(Boolean) as LeetCodeProblem[];
}

/**
 * @function getAllProblems
 * @description Fetches all problems from all companies in the database.
 * Note: This can be a very expensive operation and should be used sparingly.
 * @returns {Promise<LeetCodeProblem[]>} A promise that resolves to an array of all problems.
 */
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
  probId?: string,
): Promise<LeetCodeProblem | undefined> {
  if (
    !compId ||
    typeof compId !== "string" ||
    !probId ||
    typeof probId !== "string"
  ) {
    console.warn(
      "fetchProblemDetailsFromFirestore: compId or probId was invalid.",
      { compId, probId },
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

/**
 * @function getProblemDetailsFromDb
 * @description Fetches the detailed information for a single problem.
 * @param {string} companyId - The ID of the company the problem belongs to.
 * @param {string} problemId - The ID of the problem to fetch.
 * @returns {Promise<LeetCodeProblem | undefined>} A promise that resolves to the problem details or undefined if not found.
 */
export const getProblemDetailsFromDb = async (
  companyId: string,
  problemId: string,
): Promise<LeetCodeProblem | undefined> => {
  try {
    return await fetchProblemDetailsFromFirestore(companyId, problemId);
  } catch (error) {
    console.error(
      `Error fetching problem details for company ${companyId}, problem ${problemId}:`,
      error,
    );
    return undefined;
  }
};

async function fetchProblemByCompanySlugAndProblemSlug(
  compSlug?: string,
  probSlug?: string,
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
      { compSlug, probSlug },
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

/**
 * @function getProblemByCompanySlugAndProblemSlug
 * @description Fetches a problem and its associated company data using their respective slugs.
 * This is useful for retrieving problem data from a URL.
 * @param {string} companySlug - The slug of the company.
 * @param {string} problemSlug - The slug of the problem.
 * @returns {Promise<{ company: Company | undefined; problem: LeetCodeProblem | undefined; }>} A promise that resolves to an object containing the company and problem data, or undefined if not found.
 */
export const getProblemByCompanySlugAndProblemSlug = async (
  companySlug: string,
  problemSlug: string,
): Promise<{
  company: Company | undefined;
  problem: LeetCodeProblem | undefined;
}> => {
  try {
    return await fetchProblemByCompanySlugAndProblemSlug(
      companySlug,
      problemSlug,
    );
  } catch (error) {
    console.error(
      `Error fetching problem by company slug ${companySlug} and problem slug ${problemSlug}:`,
      error,
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

/**
 * @function getAllProblemCompanyAndProblemSlugs
 * @description Fetches all company and problem slug pairs. This is useful for generating all static problem page paths.
 * @returns {Promise<Array<{ companySlug: string; problemSlug: string }>>} A promise that resolves to an array of slug pairs.
 */
export const getAllProblemCompanyAndProblemSlugs = async (): Promise<
  Array<{ companySlug: string; problemSlug: string }>
> => {
  try {
    return await fetchAllProblemCompanyAndProblemSlugsFromFirestore();
  } catch (error) {
    console.error(
      "Error fetching all problem company and problem slugs:",
      error,
    );
    return [];
  }
};

/**
 * @function addProblemToDb
 * @description Adds a new problem to a company's subcollection in Firestore. If a problem with the same normalized title already exists, it updates the existing problem's data.
 * @param {string} companyId - The ID of the company to add the problem to.
 * @param {Omit<LeetCodeProblem, 'id' | 'companyId' | 'companySlug' | 'slug'> & { normalizedTitle: string }} problemData - The data for the problem to be added.
 * @returns {Promise<{ id: string | null; updated: boolean; error?: string }>} A promise that resolves to an object containing the problem's ID, whether it was updated, and an optional error message.
 */
export const addProblemToDb = async (
  companyId: string,
  problemData: Omit<
    LeetCodeProblem,
    "id" | "companyId" | "companySlug" | "slug"
  > & { normalizedTitle: string },
): Promise<{ id: string | null; updated: boolean; error?: string }> => {
  try {
    const problemSlug = slugify(problemData.title);
    const problemCollectionRef = collection(
      db,
      "companies",
      companyId,
      "problems",
    );

    const q = query(
      problemCollectionRef,
      where("normalizedTitle", "==", problemData.normalizedTitle),
      limit(1),
    );
    const querySnapshot = await getDocs(q);

    const dataToSave = {
      ...problemData,
      slug: problemSlug,
    };

    if (!querySnapshot.empty) {
      const existingProblemDoc = querySnapshot.docs[0];
      await updateDoc(
        doc(db, "companies", companyId, "problems", existingProblemDoc.id),
        {
          lastAskedPeriod: problemData.lastAskedPeriod,
          tags: problemData.tags,
          link: problemData.link,
          difficulty: problemData.difficulty,
          slug: problemSlug,
        },
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
