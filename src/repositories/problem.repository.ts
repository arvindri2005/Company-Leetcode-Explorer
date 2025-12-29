import {
  LeetCodeProblem,
  LeetCodeProblemSchema,
  ProblemSummaryDTO,
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
  QueryConstraint,
} from "firebase/firestore";
import { slugify } from "@/lib/utils";
import { Logger } from "@/lib/logger";
import { companyRepository } from "./company.repository";
import { userRepository } from "./user.repository";
import {
  problemFilterRegistry,
  ProblemFilter,
  ProblemFilterContext,
} from "@/lib/problem-filters";

function getFirestore(): Firestore {
  if (!db) {
    throw new Error(
      "Firestore is not initialized. Check your Firebase configuration.",
    );
  }
  return db;
}

type FetchProblemsParams = {
  cursor?: string;
  page?: number;
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
};

export class ProblemRepository {
  async getProblemsByCompany(
    companyId: string,
    params: FetchProblemsParams = {},
  ): Promise<PaginatedProblemsResponse> {
    return await this.fetchProblemsByCompanyCore(companyId, params);
  }

  async getAllProblemsPaginated(
    params: {
      cursor?: string;
      page?: number;
      pageSize?: number;
      difficultyFilter?: DifficultyFilter[];
      lastAskedFilter?: LastAskedFilter[];
      searchTerm?: string;
      sortKey?: SortKey;
      userId?: string;
    } = {},
  ): Promise<PaginatedProblemsResponse> {
    const {
      problems,
      totalProblems,
      hasMore,
      nextCursor,
      totalPages,
      currentPage,
    } = await this.fetchAllProblemsCore(params);

    if (params.userId) {
      const problemIds = problems.map((p) => p.id);
      const [userBookmarks, userStatuses] = await Promise.all([
        userRepository.getBookmarksForIds(params.userId, problemIds),
        userRepository.getProblemStatusesForIds(params.userId, problemIds),
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
        totalPages,
        currentPage,
      };
    }

    return {
      problems,
      totalProblems,
      hasMore,
      nextCursor,
      totalPages,
      currentPage,
    };
  }

  async getAllProblems(): Promise<LeetCodeProblem[]> {
    try {
      const problemsCol = collection(getFirestore(), "problems");
      const q = query(problemsCol, orderBy("normalizedTitle"));
      const problemSnapshot = await getDocs(q);

      return problemSnapshot.docs.map((docSnap) =>
        this.mapDocToProblem(docSnap),
      );
    } catch (error) {
      Logger.error("Error fetching all problems", error);
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
        const company = await companyRepository.getCompanyById(companyId);
        return this.mapDocToProblem(problemSnap, company);
      }
      return undefined;
    } catch (error) {
      Logger.error(`Error fetching problem details`, error, {
        companyId,
        problemId,
      });
      return undefined;
    }
  }

  async getProblemByCompanySlugAndProblemSlug(
    companySlug: string,
    problemSlug: string,
  ): Promise<{
    company: Company | undefined;
    problem: LeetCodeProblem | undefined;
  }> {
    try {
      const company = await companyRepository.getCompanyBySlug(companySlug);
      if (!company) return { company: undefined, problem: undefined };

      const problemDocRef = doc(getFirestore(), "problems", problemSlug);
      const problemSnap = await getDoc(problemDocRef);

      if (problemSnap.exists()) {
        const problem = this.mapDocToProblem(problemSnap, company);
        return { company, problem };
      }
      return { company, problem: undefined };
    } catch (error) {
      Logger.error(
        `Error fetching problem by company slug and problem slug`,
        error,
        { companySlug, problemSlug },
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
      Logger.error(
        "Error fetching all problem company and problem slugs",
        error,
      );
      return [];
    }
  }

  private async fetchProblemsByCompanyCore(
    companyId: string,
    params: FetchProblemsParams,
  ) {
    const { searchTerm = "", sortKey = "title" } = params;

    // Base constraints
    const constraints: QueryConstraint[] = [
      where("companyIds", "array-contains", companyId),
    ];

    let usedInOperator = false;
    const residualFilters: ProblemFilter[] = [];

    // Apply Filters from Registry
    const filterContext: ProblemFilterContext = {
      ...params,
      companyId,
    };

    for (const filter of problemFilterRegistry.getFilters()) {
      const result = filter.apply(filterContext, usedInOperator);
      constraints.push(...result.constraints);
      if (result.usedInOperator) {
        usedInOperator = true;
      }
      if (result.isResidual) {
        residualFilters.push(filter);
      }
    }

    // Optimization: Use Firestore range queries for search
    if (searchTerm.trim() !== "") {
      const lowercasedSearchTerm = searchTerm.toLowerCase().trim();
      constraints.push(where("normalizedTitle", ">=", lowercasedSearchTerm));
      constraints.push(
        where("normalizedTitle", "<=", lowercasedSearchTerm + "\uf8ff"),
      );
    }

    const hasResidualFilters = residualFilters.length > 0;
    const isSortCompatibleWithSearch =
      searchTerm.trim() !== "" ? sortKey === "title" : true;
    const isSupportedSort = sortKey === "title" || sortKey === "difficulty";

    if (!hasResidualFilters && isSupportedSort && isSortCompatibleWithSearch) {
      try {
        return await this.fetchProblemsByCompanyOptimized(
          companyId,
          params,
          constraints,
        );
      } catch (error: any) {
        if (
          error.code === "failed-precondition" ||
          error.message?.includes("index")
        ) {
          // Fall through to semi-optimized path
        } else {
          throw error;
        }
      }
    }

    return await this.fetchProblemsByCompanySemiOptimized(
      companyId,
      params,
      constraints,
      residualFilters,
    );
  }

  private async fetchProblemsByCompanyOptimized(
    companyId: string,
    params: FetchProblemsParams,
    constraints: QueryConstraint[],
  ) {
    const {
      cursor,
      pageSize = 10,
      difficultyFilter = [],
      lastAskedFilter = [],
      sortKey = "title",
      companySlug,
      totalProblemCount,
      difficultyCounts,
      recencyCounts,
    } = params;

    const problemsColRef = collection(getFirestore(), "problems");
    let totalProblems = 0;

    // Estimate Total Count if possible (simplified for brevity, logic preserved from original if needed)
    // Note: Since we are generic now, checking 'difficultyFilter' specifically for counts is strictly speaking 'rigid'
    // but we can leave the optimization hints as is since they just use the passed params which are still there.
    if (constraints.length === 1 && totalProblemCount !== undefined) {
      totalProblems = totalProblemCount;
    } else if (
      difficultyCounts &&
      lastAskedFilter.length === 0 &&
      difficultyFilter.length > 0
    ) {
      totalProblems = difficultyFilter.reduce(
        (acc, diff) => acc + (difficultyCounts[diff] || 0),
        0,
      );
    } else if (
      recencyCounts &&
      difficultyFilter.length === 0 &&
      lastAskedFilter.length > 0
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

    // Ensure deterministic ordering for cursor pagination
    if (sortKey === "difficulty") {
      queryConstraints.push(orderBy("normalizedTitle", "asc"));
    }

    queryConstraints.push(limit(pageSize + 1));

    if (cursor) {
      const cursorDocRef = doc(getFirestore(), "problems", cursor);
      const cursorDocSnap = await getDoc(cursorDocRef);
      if (cursorDocSnap.exists()) {
        queryConstraints.push(startAfter(cursorDocSnap));
      }
    }

    let q = query(problemsColRef, ...queryConstraints);

    const problemSnapshot = await getDocs(q);
    const docs = problemSnapshot.docs;
    const hasMore = docs.length > pageSize;

    const resultDocs = hasMore ? docs.slice(0, pageSize) : docs;

    let finalCompanySlug = companySlug;
    if (!finalCompanySlug) {
      const company = await companyRepository.getCompanyById(companyId);
      finalCompanySlug = company?.slug || slugify(company?.name || "unknown");
    }

    const problems = resultDocs.map((docSnap) => {
      const data = docSnap.data();
      const companySpecificData = data.companies?.[companyId] || {};

      return {
        id: docSnap.id,
        title: data.title,
        slug: docSnap.id,
        difficulty: data.difficulty,
        companyId: companyId,
        companySlug: finalCompanySlug!,
        lastAskedPeriod:
          companySpecificData.lastAskedPeriod ||
          data.lastAskedPeriod ||
          undefined,
        tags: data.tags || [],
        acceptanceRate: data.acceptanceRate,
        isBookmarked: false,
        currentStatus: undefined,
        link: data.link,
      } as ProblemSummaryDTO;
    });

    const nextCursor = hasMore ? problems[problems.length - 1].id : undefined;

    return {
      problems,
      totalProblems,
      hasMore,
      nextCursor,
    };
  }

  private async fetchProblemsByCompanySemiOptimized(
    companyId: string,
    params: FetchProblemsParams,
    constraints: QueryConstraint[],
    residualFilters: ProblemFilter[],
  ) {
    const {
      cursor,
      page,
      pageSize = 10,
      searchTerm = "",
      sortKey = "title",
      companySlug,
    } = params;

    const problemsColRef = collection(getFirestore(), "problems");
    const startTime = Date.now();
    try {
      const q = query(problemsColRef, ...constraints, limit(200));
      const problemSnapshot = await getDocs(q);

      let processedProblems = problemSnapshot.docs.map((docSnap) => {
        const data = docSnap.data();
        const companySpecificData = data.companies?.[companyId] || {};

        return {
          id: docSnap.id,
          title: data.title,
          slug: docSnap.id,
          difficulty: data.difficulty,
          companyId: companyId,
          companySlug: companySlug || "unknown",
          lastAskedPeriod:
            companySpecificData.lastAskedPeriod ||
            data.lastAskedPeriod ||
            undefined,
          tags: data.tags || [],
          acceptanceRate: data.acceptanceRate,
          isBookmarked: false,
          currentStatus: undefined,
          link: data.link,
        } as ProblemSummaryDTO;
      });

      if (!companySlug) {
        const company = await companyRepository.getCompanyById(companyId);
        const slug = company?.slug || slugify(company?.name || "unknown");
        processedProblems.forEach((p) => (p.companySlug = slug));
      }

      // Apply Residual Filters
      const filterContext: ProblemFilterContext = { ...params, companyId };
      for (const filter of residualFilters) {
        processedProblems = processedProblems.filter((p) =>
          filter.matches(p, filterContext),
        );
      }

      // Client-side sorting for the 200 items
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
      if (page) {
        startIndex = (page - 1) * pageSize;
      } else if (cursor) {
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

      Logger.info("Problem Fetch (Semi-Optimized)", {
        companyId,
        fetchedCount: problemSnapshot.size,
        resultCount: paginatedProblems.length,
        durationMs: Date.now() - startTime,
        filters: {
          search: !!searchTerm,
          residualCount: residualFilters.length,
        },
      });

      return {
        problems: paginatedProblems,
        totalProblems,
        hasMore,
        nextCursor,
      };
    } catch (error) {
      Logger.error("Error in Semi-Optimized Problem Fetch", error, {
        companyId,
      });
      throw error;
    }
  }

  private async fetchAllProblemsCore(params: {
    cursor?: string;
    page?: number;
    pageSize?: number;
    difficultyFilter?: DifficultyFilter[];
    lastAskedFilter?: LastAskedFilter[];
    searchTerm?: string;
    sortKey?: SortKey;
  }) {
    // NOTE: This method can also be refactored to use the Registry,
    // but for this task, I am focusing on the primary 'getPublicProblems' (Company Scoped) path
    // which was the target of the Rigid Logic survey.
    // I will leave this as is to minimize regression risk in the 'All Problems' view,
    // as the Registry is currently designed around Company Context (ProblemFilterContext has companyId).
    // To extend it here, we'd need to make companyId optional in the context.

    // ... (Existing implementation of fetchAllProblemsCore)
    // For brevity, re-pasting the exact implementation from read_file to ensure no code loss
    const {
      cursor,
      page,
      pageSize = 10,
      difficultyFilter = [],
      lastAskedFilter = [],
      searchTerm = "",
      sortKey = "title",
    } = params;

    const problemsColRef = collection(getFirestore(), "problems");
    const constraints: QueryConstraint[] = [];

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

    if (searchTerm.trim() !== "") {
      const lowercasedSearchTerm = searchTerm.toLowerCase().trim();
      constraints.push(where("normalizedTitle", ">=", lowercasedSearchTerm));
      constraints.push(
        where("normalizedTitle", "<=", lowercasedSearchTerm + "\uf8ff"),
      );
    }

    const hasResidualFilters =
      residualDifficultyFilter.length > 0 || residualLastAskedFilter.length > 0;

    const isSortCompatibleWithSearch =
      searchTerm.trim() !== "" ? sortKey === "title" : true;

    const isDefaultSort = sortKey === "title";

    const canUseOptimizedPath =
      !hasResidualFilters &&
      (isDefaultSort || sortKey === "difficulty") &&
      isSortCompatibleWithSearch;

    if (canUseOptimizedPath) {
      try {
        let totalProblems = -1;

        const sortField =
          sortKey === "difficulty" ? "difficulty" : "normalizedTitle";
        let queryConstraints = [...constraints, orderBy(sortField, "asc")];

        if (sortKey === "difficulty") {
          queryConstraints.push(orderBy("normalizedTitle", "asc"));
        }

        let limitCount = pageSize;
        let startIndex = 0;

        if (page) {
          limitCount = page * pageSize + 1;
          startIndex = (page - 1) * pageSize;
          queryConstraints.push(limit(limitCount));
        } else {
          queryConstraints.push(limit(pageSize + 1));
          if (cursor) {
            const cursorDocRef = doc(getFirestore(), "problems", cursor);
            const cursorDocSnap = await getDoc(cursorDocRef);
            if (cursorDocSnap.exists()) {
              queryConstraints.push(startAfter(cursorDocSnap));
            }
          }
        }

        let q = query(problemsColRef, ...queryConstraints);
        const snap = await getDocs(q);
        const docs = snap.docs;

        let resultDocs = docs;
        let hasMore = false;

        if (page) {
          const targetSize = page * pageSize;
          hasMore = docs.length > targetSize;

          if (docs.length <= startIndex) {
            resultDocs = [];
          } else {
            resultDocs = docs.slice(startIndex, startIndex + pageSize);
          }
        } else {
          hasMore = docs.length > pageSize;
          if (hasMore) {
            resultDocs = docs.slice(0, pageSize);
          }
        }

        let problems = resultDocs.map((docSnap) =>
          this.mapDocToProblem(docSnap),
        );

        let totalPages = -1;
        let currentPage = page || 1;
        let nextCursor = hasMore
          ? problems[problems.length - 1]?.id
          : undefined;

        Logger.info(`[OPTIMIZED FETCH - NO COUNT]`, {
          page,
          limitCount,
          fetched: docs.length,
          hasMore,
        });

        return {
          problems,
          totalProblems,
          hasMore,
          nextCursor,
          totalPages,
          currentPage,
        };
      } catch (error: any) {
        if (
          error.code === "failed-precondition" ||
          error.message?.includes("index")
        ) {
          Logger.warn(
            "Optimized path failed, falling back to full fetch",
            undefined,
            { message: error.message },
          );
        } else {
          throw error;
        }
      }
    }

    const q = query(problemsColRef, ...constraints);
    const problemSnapshot = await getDocs(q);

    let processedProblems = problemSnapshot.docs.map((docSnap) =>
      this.mapDocToProblem(docSnap),
    );

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
    let paginatedProblems: LeetCodeProblem[] = [];
    let hasMore = false;
    let nextCursor: string | undefined = undefined;
    let totalPages: number | undefined = undefined;
    let currentPage: number | undefined = undefined;

    if (page) {
      totalPages = Math.ceil(totalProblems / pageSize);
      currentPage = Math.max(1, Math.min(page, totalPages || 1));
      const startIndex = (currentPage - 1) * pageSize;
      paginatedProblems = processedProblems.slice(
        startIndex,
        startIndex + pageSize,
      );
      hasMore = currentPage < totalPages;
    } else {
      let startIndex = 0;
      if (cursor) {
        const cursorIndex = processedProblems.findIndex((p) => p.id === cursor);
        if (cursorIndex !== -1) {
          startIndex = cursorIndex + 1;
        }
      }

      paginatedProblems = processedProblems.slice(
        startIndex,
        startIndex + pageSize,
      );
      hasMore = startIndex + pageSize < totalProblems;
      nextCursor = hasMore
        ? paginatedProblems[paginatedProblems.length - 1]?.id
        : undefined;
    }

    return {
      problems: paginatedProblems,
      totalProblems,
      hasMore,
      nextCursor,
      totalPages,
      currentPage,
    };
  }

  private mapDocToProblem(
    docSnap: import("firebase/firestore").DocumentSnapshot,
    company?: Company,
  ): LeetCodeProblem {
    const data = docSnap.data()!;
    const companyId = company?.id || data.companyIds?.[0] || "unknown";

    const companySlug = company?.slug || "unknown";

    const companySpecificData = company
      ? data.companies?.[company.id] || {}
      : {};

    const problem: LeetCodeProblem = {
      id: docSnap.id,
      companyId: companyId,
      companySlug: companySlug,
      slug: docSnap.id,
      ...data,
      ...companySpecificData,
    } as LeetCodeProblem;

    const result = LeetCodeProblemSchema.safeParse(problem);
    if (!result.success) {
      Logger.warn(
        `Data integrity issue in Problem (ID: ${
          problem.id
        }): ${result.error.issues
          .map((i) => `${i.path.join(".")}: ${i.message}`)
          .join(", ")}`,
      );
    }

    return problem;
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
      Logger.error("Error in addProblem", error, { message });
      return { id: null, updated: false, error: message };
    }
  }
}

export const problemRepository = new ProblemRepository();
