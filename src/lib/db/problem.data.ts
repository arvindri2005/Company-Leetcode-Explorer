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
  setDoc,
  startAfter,
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

  const problemsColRef = collection(db, "problems");
  // Use array-contains to find problems for this company.
  // We sort in memory to avoid needing a composite index on (companyIds, normalizedTitle).
  const q = query(problemsColRef, where("companyIds", "array-contains", compId));
  const problemSnapshot = await getDocs(q);
  
  const problems = problemSnapshot.docs.map((docSnap) => {
    const data = docSnap.data();
    // Map the company-specific data from the 'companies' map if available
    const companySpecificData = data.companies?.[compId] || {};
    
    return {
      id: docSnap.id, // This is now the slug
      companyId: compId, // Legacy/Primary for this view
      companySlug: companySlugValue || slugify(companyDoc?.name || "unknown"), // Legacy/Primary
      slug: docSnap.id,
      ...data,
      ...companySpecificData, // Override with company-specific data (e.g. lastAskedPeriod)
    } as LeetCodeProblem;
  });

  // Sort by normalizedTitle
  return problems.sort((a, b) => a.normalizedTitle.localeCompare(b.normalizedTitle));
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
    companySlug?: string; // Optimization: pass slug if known
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
    companySlug,
  } = params;

  try {
    // Optimization: Fast path for initial load (no filters, default sort, no search)
    // This avoids fetching ALL documents and filtering in memory
    const isDefaultSort = sortKey === "title";
    const hasNoFilters =
      difficultyFilter.length === 0 &&
      lastAskedFilter.length === 0 &&
      searchTerm.trim() === "";

    if (isDefaultSort && hasNoFilters) {
      const problemsColRef = collection(db, "problems");
      
      try {
          let q = query(
            problemsColRef, 
            where("companyIds", "array-contains", companyId),
            orderBy("normalizedTitle", "asc"),
            limit(pageSize)
          );

          if (cursor) {
              const cursorDocRef = doc(db, "problems", cursor);
              const cursorDocSnap = await getDoc(cursorDocRef);
              if (cursorDocSnap.exists()) {
                   q = query(
                    problemsColRef, 
                    where("companyIds", "array-contains", companyId),
                    orderBy("normalizedTitle", "asc"),
                    startAfter(cursorDocSnap),
                    limit(pageSize)
                  );
              }
          }

          const problemSnapshot = await getDocs(q);
          const docs = problemSnapshot.docs;
          
          const hasMore = docs.length === pageSize; 

            let finalCompanySlug = companySlug;
            if (!finalCompanySlug) {
                 const company = await getCompanyById(companyId);
                 finalCompanySlug = company?.slug || slugify(company?.name || "unknown");
            }

            const problems = docs.map((docSnap) => {
                const data = docSnap.data();
                const companySpecificData = data.companies?.[companyId] || {};
                return {
                  id: docSnap.id,
                  companyId: companyId,
                  companySlug: finalCompanySlug!,
                  slug: docSnap.id,
                  ...data,
                  ...companySpecificData,
                } as LeetCodeProblem;
            });

            if (userId) {
                 const [userBookmarks, userStatuses] = await Promise.all([
                    dbGetUserBookmarkedProblemsInfo(userId),
                    dbGetAllUserProblemStatuses(userId),
                  ]);
                  const bookmarkedProblemIds = new Set(userBookmarks.map((b) => b.problemId));

                  return {
                    problems: problems.map(p => {
                        const statusInfo = userStatuses[p.id];
                        return {
                            ...p,
                            isBookmarked: bookmarkedProblemIds.has(p.id),
                            currentStatus: statusInfo ? statusInfo.status : undefined,
                        };
                    }),
                    totalProblems: 100, 
                    hasMore,
                    nextCursor: hasMore ? problems[problems.length - 1].id : undefined,
                  };
            }

            return {
                problems,
                totalProblems: 100,
                hasMore,
                nextCursor: hasMore ? problems[problems.length - 1].id : undefined,
            };
      } catch (error: any) {
          // Fallback to client-side sorting if index is missing
          if (error.code === 'failed-precondition' || error.message.includes("index")) {
              console.warn("Missing index for optimized query, falling back to client-side sorting.");
              const q = query(problemsColRef, where("companyIds", "array-contains", companyId));
              const problemSnapshot = await getDocs(q);
              let docs = problemSnapshot.docs;
              
              docs.sort((a, b) => {
                  const titleA = a.data().normalizedTitle || "";
                  const titleB = b.data().normalizedTitle || "";
                  return titleA.localeCompare(titleB);
              });

              const hasMore = docs.length > pageSize;
              const slicedDocs = docs.slice(0, pageSize);

                let finalCompanySlug = companySlug;
                if (!finalCompanySlug) {
                     const company = await getCompanyById(companyId);
                     finalCompanySlug = company?.slug || slugify(company?.name || "unknown");
                }

                const problems = slicedDocs.map((docSnap) => {
                    const data = docSnap.data();
                    const companySpecificData = data.companies?.[companyId] || {};
                    return {
                      id: docSnap.id,
                      companyId: companyId,
                      companySlug: finalCompanySlug!,
                      slug: docSnap.id,
                      ...data,
                      ...companySpecificData,
                    } as LeetCodeProblem;
                });

                if (userId) {
                     const [userBookmarks, userStatuses] = await Promise.all([
                        dbGetUserBookmarkedProblemsInfo(userId),
                        dbGetAllUserProblemStatuses(userId),
                      ]);
                      const bookmarkedProblemIds = new Set(userBookmarks.map((b) => b.problemId));

                      return {
                        problems: problems.map(p => {
                            const statusInfo = userStatuses[p.id];
                            return {
                                ...p,
                                isBookmarked: bookmarkedProblemIds.has(p.id),
                                currentStatus: statusInfo ? statusInfo.status : undefined,
                            };
                        }),
                        totalProblems: docs.length, 
                        hasMore,
                        nextCursor: hasMore ? problems[problems.length - 1].id : undefined,
                      };
                }

                return {
                    problems,
                    totalProblems: docs.length,
                    hasMore,
                    nextCursor: hasMore ? problems[problems.length - 1].id : undefined,
                };
          }
          throw error;
      }
    }

    // --- SLOW PATH (Existing Logic) ---
    // Fetches ALL problems and filters in memory.
    // Used when filters/sort are applied or for pagination beyond first page (until cursor logic is improved).

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

/**
 * @function getAllProblemsPaginated
 * @description Fetches a paginated, filtered, and sorted list of ALL problems.
 * @param {object} [params={}] - The parameters for filtering, sorting, and pagination.
 * @returns {Promise<PaginatedProblemsResponse>} A promise that resolves to the paginated list of problems.
 */
export const getAllProblemsPaginated = async (
  params: {
    cursor?: string;
    pageSize?: number;
    difficultyFilter?: DifficultyFilter[];
    lastAskedFilter?: LastAskedFilter[]; // Note: This might be less relevant without a specific company context, but we can still support it if data exists.
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
    // Optimized path using Firestore orderBy and limit
    // Only use this if NO filters are active and default sort is used.
    const hasFilters = 
        difficultyFilter.length > 0 || 
        lastAskedFilter.length > 0 || 
        searchTerm.trim() !== "";
    const isDefaultSort = sortKey === "title";

    if (!hasFilters && isDefaultSort) {
        const problemsColRef = collection(db, "problems");
        let q = query(
            problemsColRef, 
            orderBy("normalizedTitle", "asc"),
            limit(pageSize)
        );

        if (cursor) {
            const cursorDocRef = doc(db, "problems", cursor);
            const cursorDocSnap = await getDoc(cursorDocRef);
            if (cursorDocSnap.exists()) {
                q = query(
                    problemsColRef, 
                    orderBy("normalizedTitle", "asc"),
                    startAfter(cursorDocSnap),
                    limit(pageSize)
                );
            }
        }

        const snap = await getDocs(q);
        const docs = snap.docs;
        const hasMore = docs.length === pageSize;
        
        let problems = docs.map(docSnap => {
             const data = docSnap.data();
             return {
                id: docSnap.id,
                companyId: data.companyIds?.[0] || "unknown",
                companySlug: "unknown",
                slug: docSnap.id,
                ...data,
             } as LeetCodeProblem;
        });
        
        if (userId) {
             const [userBookmarks, userStatuses] = await Promise.all([
                dbGetUserBookmarkedProblemsInfo(userId),
                dbGetAllUserProblemStatuses(userId),
              ]);
              const bookmarkedProblemIds = new Set(userBookmarks.map((b) => b.problemId));
              problems = problems.map(p => {
                  const statusInfo = userStatuses[p.id];
                  return { ...p, isBookmarked: bookmarkedProblemIds.has(p.id), currentStatus: statusInfo?.status };
              });
        }
        
        return {
            problems,
            totalProblems: 100, // Placeholder
            hasMore,
            nextCursor: hasMore ? problems[problems.length - 1].id : undefined
        };
    }

    // --- SLOW PATH (Filters or non-default sort) ---
    // Fetch all and filter in memory.
    
    const problemsCol = collection(db, "problems");
    const q = query(problemsCol, orderBy("normalizedTitle")); // Basic sort
    const problemSnapshot = await getDocs(q);

    let processedProblems = problemSnapshot.docs.map((docSnap) => {
      const data = docSnap.data();
      const firstCompanyId = data.companyIds?.[0] || "unknown";
      
      return {
        id: docSnap.id,
        companyId: firstCompanyId,
        companySlug: "unknown", 
        slug: docSnap.id,
        ...data,
      } as LeetCodeProblem;
    });

    // If userId is provided, fetch and merge user-specific data
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

    // Apply Filters
    if (difficultyFilter.length > 0) {
      processedProblems = processedProblems.filter((p) =>
        difficultyFilter.includes(p.difficulty),
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

    // Apply Sorting
    const difficultyOrder: Record<LeetCodeProblem["difficulty"], number> = {
      Easy: 1,
      Medium: 2,
      Hard: 3,
    };
    
    processedProblems.sort((a, b) => {
      if (sortKey === "title") return a.title.localeCompare(b.title);
      if (sortKey === "difficulty")
        return difficultyOrder[a.difficulty] - difficultyOrder[b.difficulty];
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
    console.error("Error in getAllProblemsPaginated:", error);
    return {
      problems: [],
      totalProblems: 0,
      hasMore: false,
    };
  }
};

async function fetchAllProblemsFromFirestore(): Promise<LeetCodeProblem[]> {
  const problemsCol = collection(db, "problems");
  const q = query(problemsCol, orderBy("normalizedTitle"));
  const problemSnapshot = await getDocs(q);

  return problemSnapshot.docs.map((docSnap) => {
      const problemData = docSnap.data();
      // For fetchAll, we don't have a specific company context.
      // We can pick the first companyId if available, or just leave it generic.
      // But LeetCodeProblem requires companyId/Slug.
      // Let's pick the first one from companyIds if available.
      const firstCompanyId = problemData.companyIds?.[0] || "unknown";
      
      return {
        id: docSnap.id,
        companyId: firstCompanyId,
        companySlug: "unknown", // We'd need to fetch company to get slug, or store it.
        slug: docSnap.id,
        ...problemData,
      } as LeetCodeProblem;
    });
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
  // probId is expected to be the slug now
  const problemDocRef = doc(db, "problems", probId);
  const problemSnap = await getDoc(problemDocRef);
  
  if (problemSnap.exists()) {
    const data = problemSnap.data();
    const company = await getCompanyById(compId);
    const companySpecificData = data.companies?.[compId] || {};

    return {
      id: problemSnap.id,
      companyId: compId,
      companySlug: company?.slug || slugify(company?.name || "unknown"),
      slug: problemSnap.id,
      ...data,
      ...companySpecificData,
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

  // Fetch from root problems collection by slug (ID)
  const problemDocRef = doc(db, "problems", probSlug);
  const problemSnap = await getDoc(problemDocRef);

  if (problemSnap.exists()) {
    const problemData = problemSnap.data();
    const companySpecificData = problemData.companies?.[company.id] || {};
    
    return {
      company,
      problem: {
        id: problemSnap.id,
        companyId: company.id,
        companySlug: company.slug,
        slug: problemSnap.id,
        ...problemData,
        ...companySpecificData,
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
    const problemDocRef = doc(db, "problems", problemSlug);
    const problemSnap = await getDoc(problemDocRef);

    if (problemSnap.exists()) {
      const existingData = problemSnap.data();
      const companyIds = new Set(existingData.companyIds || []);
      companyIds.add(companyId);
      
      const companiesMap = existingData.companies || {};
      companiesMap[companyId] = {
          lastAskedPeriod: problemData.lastAskedPeriod,
      };

      await updateDoc(problemDocRef, {
        ...problemData, // Update common fields
        slug: problemSlug,
        companyIds: Array.from(companyIds),
        companies: companiesMap,
      });
      return { id: problemSlug, updated: true };
    } else {
      const companiesMap = {
          [companyId]: {
              lastAskedPeriod: problemData.lastAskedPeriod,
          }
      };
      
      const dataToSave = {
        ...problemData,
        slug: problemSlug,
        companyIds: [companyId],
        companies: companiesMap,
      };
      
      await setDoc(problemDocRef, dataToSave);
      return { id: problemSlug, updated: false };
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
