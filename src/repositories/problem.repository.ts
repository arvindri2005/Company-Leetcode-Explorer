import {
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
  orderBy,
  startAfter,
  getCountFromServer,
  updateDoc,
  setDoc,
  Firestore,
} from "firebase/firestore";
import { slugify } from "@/lib/utils";
import { companyRepository } from "./company.repository";
import { userRepository } from "./user.repository";

function getFirestore(): Firestore {
  if (!db) {
    throw new Error(
      "Firestore is not initialized. Check your Firebase configuration.",
    );
  }
  return db;
}

export class ProblemRepository {
  async getProblemsByCompany(
    companyId: string,
    params: {
      cursor?: string;
      pageSize?: number;
      difficultyFilter?: DifficultyFilter[];
      lastAskedFilter?: LastAskedFilter[];
      searchTerm?: string;
      sortKey?: SortKey;
      userId?: string;
      companySlug?: string;
      totalProblemCount?: number;
      difficultyCounts?: { Easy: number; Medium: number; Hard: number };
      recencyCounts?: {
        last_30_days: number;
        within_3_months: number;
        within_6_months: number;
        older_than_6_months: number;
      };
    } = {},
  ): Promise<PaginatedProblemsResponse> {
    const {
      cursor,
      pageSize = 10,
      difficultyFilter = [],
      lastAskedFilter = [],
      searchTerm = "",
      sortKey = "title",
      userId,
      companySlug,
      totalProblemCount,
      difficultyCounts,
      recencyCounts,
    } = params;

    const { problems, totalProblems, hasMore, nextCursor } =
      await this.fetchProblemsByCompanyCore(companyId, {
        cursor,
        pageSize,
        difficultyFilter,
        lastAskedFilter,
        searchTerm,
        sortKey,
        companySlug,
        totalProblemCount,
        difficultyCounts,
        recencyCounts,
      });

    if (userId) {
      const problemIds = problems.map((p) => p.id);
      const [userBookmarks, userStatuses] = await Promise.all([
        userRepository.getBookmarksForIds(userId, problemIds),
        userRepository.getProblemStatusesForIds(userId, problemIds),
      ]);

      const finalProblems = problems.map((problem) => {
        const statusInfo = userStatuses[problem.id];
        return {
          ...problem,
          isBookmarked: userBookmarks.has(problem.id),
          currentStatus: statusInfo ? statusInfo.status : undefined,
        };
      });

      return {
        problems: finalProblems,
        totalProblems,
        hasMore,
        nextCursor,
      };
    }

    return {
      problems,
      totalProblems,
      hasMore,
      nextCursor,
    };
  }

  async getAllProblemsPaginated(
    params: {
      cursor?: string;
      pageSize?: number;
      difficultyFilter?: DifficultyFilter[];
      lastAskedFilter?: LastAskedFilter[];
      searchTerm?: string;
      sortKey?: SortKey;
      userId?: string;
    } = {},
  ): Promise<PaginatedProblemsResponse> {
    const {
        cursor,
        pageSize = 10,
        difficultyFilter = [],
        lastAskedFilter = [],
        searchTerm = "",
        sortKey = "title",
        userId,
      } = params;
    
    const { problems, totalProblems, hasMore, nextCursor } = await this.fetchAllProblemsCore({
        cursor,
        pageSize,
        difficultyFilter,
        lastAskedFilter,
        searchTerm,
        sortKey,
    });

    // Fetch User Data if needed
    if (userId) {
      const problemIds = problems.map((p) => p.id);
      const [userBookmarks, userStatuses] = await Promise.all([
        userRepository.getBookmarksForIds(userId, problemIds),
        userRepository.getProblemStatusesForIds(userId, problemIds),
      ]);

      const finalProblems = problems.map((problem) => {
        const statusInfo = userStatuses[problem.id];
        return {
          ...problem,
          isBookmarked: userBookmarks.has(problem.id),
          currentStatus: statusInfo ? statusInfo.status : undefined,
        };
      });

      return {
        problems: finalProblems,
        totalProblems,
        hasMore,
        nextCursor,
      };
    }

    return {
      problems,
      totalProblems,
      hasMore,
      nextCursor,
    };
  }

  async getAllProblems(): Promise<LeetCodeProblem[]> {
    try {
      const problemsCol = collection(getFirestore(), "problems");
      const q = query(problemsCol, orderBy("normalizedTitle"));
      const problemSnapshot = await getDocs(q);

      return problemSnapshot.docs.map((docSnap) => {
        const problemData = docSnap.data();
        const firstCompanyId = problemData.companyIds?.[0] || "unknown";

        return {
          id: docSnap.id,
          companyId: firstCompanyId,
          companySlug: "unknown",
          slug: docSnap.id,
          ...problemData,
        } as LeetCodeProblem;
      });
    } catch (error) {
      console.error("Error fetching all problems:", error);
      return [];
    }
  }

  async getProblemDetails(
    companyId: string,
    problemId: string,
  ): Promise<LeetCodeProblem | undefined> {
    try {
      if (!companyId || !problemId) return undefined;
      const problemDocRef = doc(getFirestore(), "problems", problemId); // problemId is the slug
      const problemSnap = await getDoc(problemDocRef);

      if (problemSnap.exists()) {
        const data = problemSnap.data();
        const company = await companyRepository.getCompanyById(companyId);
        const companySpecificData = data.companies?.[companyId] || {};

        return {
          id: problemSnap.id,
          companyId: companyId,
          companySlug: company?.slug || slugify(company?.name || "unknown"),
          slug: problemSnap.id,
          ...data,
          ...companySpecificData,
        } as LeetCodeProblem;
      }
      return undefined;
    } catch (error) {
       console.error(`Error fetching problem details for company ${companyId}, problem ${problemId}:`, error);
       return undefined;
    }
  }

  async getProblemByCompanySlugAndProblemSlug(
    companySlug: string,
    problemSlug: string,
  ): Promise<{ company: Company | undefined; problem: LeetCodeProblem | undefined }> {
    try {
      const company = await companyRepository.getCompanyBySlug(companySlug);
      if (!company) return { company: undefined, problem: undefined };

      const problemDocRef = doc(getFirestore(), "problems", problemSlug);
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
    } catch (error) {
      console.error(
        `Error fetching problem by company slug ${companySlug} and problem slug ${problemSlug}:`,
        error,
      );
      return { company: undefined, problem: undefined };
    }
  }

  async getAllProblemCompanyAndProblemSlugs(): Promise<
    Array<{ companySlug: string; problemSlug: string }>
  > {
    try {
        const allProbs = await this.getAllProblems();
        return allProbs
            .map((p) => ({ companySlug: p.companySlug, problemSlug: p.slug }))
            .filter((s) => s.companySlug && s.problemSlug);
    } catch (error) {
        console.error("Error fetching all problem company and problem slugs:", error);
        return [];
    }
  }

  private async fetchProblemsByCompanyCore(
    companyId: string,
    params: {
      cursor?: string;
      pageSize?: number;
      difficultyFilter?: DifficultyFilter[];
      lastAskedFilter?: LastAskedFilter[];
      searchTerm?: string;
      sortKey?: SortKey;
      companySlug?: string;
      totalProblemCount?: number;
      difficultyCounts?: { Easy: number; Medium: number; Hard: number };
      recencyCounts?: {
        last_30_days: number;
        within_3_months: number;
        within_6_months: number;
        older_than_6_months: number;
      };
    },
  ) {
    const {
      cursor,
      pageSize = 10,
      difficultyFilter = [],
      lastAskedFilter = [],
      searchTerm = "",
      sortKey = "title",
      companySlug,
      totalProblemCount,
      difficultyCounts,
      recencyCounts,
    } = params;

    let dbReads = 0;
    const problemsColRef = collection(getFirestore(), "problems");

    // Base constraints
    const constraints: any[] = [
      where("companyIds", "array-contains", companyId),
    ];

    let usedInOperator = false;
    let residualDifficultyFilter: DifficultyFilter[] = [];
    let residualLastAskedFilter: LastAskedFilter[] = [];

    // Apply Difficulty Filter
    if (difficultyFilter.length > 0) {
      if (difficultyFilter.length === 1) {
        constraints.push(where("difficulty", "==", difficultyFilter[0]));
      } else if (!usedInOperator) {
        constraints.push(where("difficulty", "in", difficultyFilter));
        usedInOperator = true;
      } else {
        residualDifficultyFilter = difficultyFilter;
      }
    }

    // Apply LastAsked Filter
    if (lastAskedFilter.length > 0) {
      const fieldPath = `companies.${companyId}.lastAskedPeriod`;
      if (lastAskedFilter.length === 1) {
        constraints.push(where(fieldPath, "==", lastAskedFilter[0]));
      } else if (!usedInOperator) {
        constraints.push(where(fieldPath, "in", lastAskedFilter));
        usedInOperator = true;
      } else {
        residualLastAskedFilter = lastAskedFilter;
      }
    }

    const hasResidualFilters =
      residualDifficultyFilter.length > 0 ||
      residualLastAskedFilter.length > 0 ||
      searchTerm.trim() !== "";

    const isSupportedSort = sortKey === "title" || sortKey === "difficulty";

    if (!hasResidualFilters && isSupportedSort) {
      try {
        // Fully Optimized Path
        let totalProblems = 0;

        if (constraints.length === 1 && totalProblemCount !== undefined) {
          totalProblems = totalProblemCount;
        } else if (
          difficultyCounts &&
          lastAskedFilter.length === 0 &&
          difficultyFilter.length > 0 &&
          residualDifficultyFilter.length === 0
        ) {
          totalProblems = difficultyFilter.reduce(
            (acc, diff) => acc + (difficultyCounts[diff] || 0),
            0,
          );
        } else if (
          recencyCounts &&
          difficultyFilter.length === 0 &&
          lastAskedFilter.length > 0 &&
          residualLastAskedFilter.length === 0
        ) {
          totalProblems = lastAskedFilter.reduce(
            (acc, period) => acc + (recencyCounts[period] || 0),
            0,
          );
        } else {
          const countQuery = query(problemsColRef, ...constraints);
          const countSnapshot = await getCountFromServer(countQuery);
          totalProblems = countSnapshot.data().count;
        }

        const sortField =
          sortKey === "difficulty" ? "difficulty" : "normalizedTitle";

        let queryConstraints = [...constraints, orderBy(sortField, "asc")];

        if (sortKey === "difficulty") {
          queryConstraints.push(orderBy("normalizedTitle", "asc"));
        }

        queryConstraints.push(limit(pageSize));

        let q = query(problemsColRef, ...queryConstraints);

        if (cursor) {
          const cursorDocRef = doc(getFirestore(), "problems", cursor);
          const cursorDocSnap = await getDoc(cursorDocRef);
          if (cursorDocSnap.exists()) {
            q = query(
              problemsColRef,
              ...constraints,
              orderBy(sortField, "asc"),
              ...(sortKey === "difficulty"
                ? [orderBy("normalizedTitle", "asc")]
                : []),
              startAfter(cursorDocSnap),
              limit(pageSize),
            );
          }
        }

        const problemSnapshot = await getDocs(q);
        const docs = problemSnapshot.docs;
        const hasMore = docs.length === pageSize;

        let finalCompanySlug = companySlug;
        if (!finalCompanySlug) {
          const company = await companyRepository.getCompanyById(companyId);
          finalCompanySlug =
            company?.slug || slugify(company?.name || "unknown");
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

        return {
          problems,
          totalProblems,
          hasMore,
          nextCursor: hasMore ? problems[problems.length - 1].id : undefined,
        };
      } catch (error: any) {
        if (
          error.code === "failed-precondition" ||
          error.message?.includes("index")
        ) {
          // Fall through
        } else {
          throw error;
        }
      }
    }

    // Semi-Optimized Path
    const q = query(problemsColRef, ...constraints);
    const problemSnapshot = await getDocs(q);

    let processedProblems = problemSnapshot.docs.map((docSnap) => {
      const data = docSnap.data();
      const companySpecificData = data.companies?.[companyId] || {};
      return {
        id: docSnap.id,
        companyId: companyId,
        companySlug: companySlug || "unknown",
        slug: docSnap.id,
        ...data,
        ...companySpecificData,
      } as LeetCodeProblem;
    });

    if (!companySlug) {
      const company = await companyRepository.getCompanyById(companyId);
      const slug = company?.slug || slugify(company?.name || "unknown");
      processedProblems.forEach((p) => (p.companySlug = slug));
    }

    if (residualDifficultyFilter.length > 0) {
      processedProblems = processedProblems.filter((p) =>
        residualDifficultyFilter.includes(p.difficulty),
      );
    }
    if (residualLastAskedFilter.length > 0) {
      processedProblems = processedProblems.filter(
        (p) =>
          p.lastAskedPeriod &&
          residualLastAskedFilter.includes(p.lastAskedPeriod),
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
  }
  
  private async fetchAllProblemsCore(params: {
    cursor?: string;
    pageSize?: number;
    difficultyFilter?: DifficultyFilter[];
    lastAskedFilter?: LastAskedFilter[];
    searchTerm?: string;
    sortKey?: SortKey;
  }) {
    const {
      cursor,
      pageSize = 10,
      difficultyFilter = [],
      lastAskedFilter = [],
      searchTerm = "",
      sortKey = "title",
    } = params;

    const problemsColRef = collection(getFirestore(), "problems");
    const constraints: any[] = [];

    let usedInOperator = false;
    let residualDifficultyFilter: DifficultyFilter[] = [];

    if (difficultyFilter.length > 0) {
      if (difficultyFilter.length === 1) {
        constraints.push(where("difficulty", "==", difficultyFilter[0]));
      } else if (!usedInOperator) {
        constraints.push(where("difficulty", "in", difficultyFilter));
        usedInOperator = true;
      } else {
        residualDifficultyFilter = difficultyFilter;
      }
    }

    const residualLastAskedFilter = lastAskedFilter;

    const hasResidualFilters =
      residualDifficultyFilter.length > 0 ||
      residualLastAskedFilter.length > 0 ||
      searchTerm.trim() !== "";

    const isDefaultSort = sortKey === "title";

    if (!hasResidualFilters && isDefaultSort) {
      try {
        const countQuery = query(problemsColRef, ...constraints);
        const countSnapshot = await getCountFromServer(countQuery);
        const totalProblems = countSnapshot.data().count;

        let q = query(
          problemsColRef,
          ...constraints,
          orderBy("normalizedTitle", "asc"),
          limit(pageSize),
        );

        if (cursor) {
          const cursorDocRef = doc(getFirestore(), "problems", cursor);
          const cursorDocSnap = await getDoc(cursorDocRef);
          if (cursorDocSnap.exists()) {
            q = query(
              problemsColRef,
              ...constraints,
              orderBy("normalizedTitle", "asc"),
              startAfter(cursorDocSnap),
              limit(pageSize),
            );
          }
        }

        const snap = await getDocs(q);
        const docs = snap.docs;
        const hasMore = docs.length === pageSize;

        let problems = docs.map((docSnap) => {
          const data = docSnap.data();
          return {
            id: docSnap.id,
            companyId: data.companyIds?.[0] || "unknown",
            companySlug: "unknown",
            slug: docSnap.id,
            ...data,
          } as LeetCodeProblem;
        });

        return {
          problems,
          totalProblems,
          hasMore,
          nextCursor: hasMore ? problems[problems.length - 1].id : undefined,
        };
      } catch (error: any) {
        if (
          error.code === "failed-precondition" ||
          error.message?.includes("index")
        ) {
          // Fall through
        } else {
          throw error;
        }
      }
    }

    // Semi-Optimized Path
    const q = query(problemsColRef, ...constraints);
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

    if (residualDifficultyFilter.length > 0) {
      processedProblems = processedProblems.filter((p) =>
        residualDifficultyFilter.includes(p.difficulty),
      );
    }
    if (residualLastAskedFilter.length > 0) {
      processedProblems = processedProblems.filter(
        (p) =>
          p.lastAskedPeriod && residualLastAskedFilter.includes(p.lastAskedPeriod),
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
  }

  async addProblem(
    companyId: string,
    problemData: Omit<
      LeetCodeProblem,
      "id" | "companyId" | "companySlug" | "slug"
    > & { normalizedTitle: string },
  ): Promise<{ id: string | null; updated: boolean; error?: string }> {
    try {
      const problemSlug = slugify(problemData.title);
      const problemDocRef = doc(getFirestore(), "problems", problemSlug);
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
          ...problemData,
          slug: problemSlug,
          companyIds: Array.from(companyIds),
          companies: companiesMap,
        });
        return { id: problemSlug, updated: true };
      } else {
        const companiesMap = {
          [companyId]: {
            lastAskedPeriod: problemData.lastAskedPeriod,
          },
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
      console.error("Error in addProblem:", message, error);
      return { id: null, updated: false, error: message };
    }
  }
}

export const problemRepository = new ProblemRepository();
