import {
  collection,
  doc,
  type DocumentSnapshot,
  type Firestore,
  getCountFromServer,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  type QueryConstraint,
  setDoc,
  startAfter,
  updateDoc,
  where,
} from "firebase/firestore";

import type { Problem } from "@/domain/entities/problem.entity";
import { companyRepository } from "@/features/companies/repositories/company.repository";
import {
  DifficultyFilterImplementation,
  LastAskedFilterImplementation,
} from "@/features/problems/utils/problem-filters/implementations";
import { problemFilterRegistry } from "@/features/problems/utils/problem-filters/registry";
import { userRepository } from "@/features/profile/repositories/user.repository";
import { db } from "@/lib/api/firebase";
import { slugify } from "@/lib/utils";
import { Logger } from "@/lib/utils/logger";
import type { PaginatedResult } from "@/shared/interfaces";
import {
  type Company,
  CreateProblemSchema,
  type DifficultyFilter,
  type LastAskedFilter,
  type LastAskedPeriod,
  type LeetCodeProblem,
  LeetCodeProblemSchema,
  type PaginatedProblemsResponse,
  type ProblemSummaryDTO,
  type SortKey,
  UpdateProblemSchema,
} from "@/types";

import type {
  CreateProblemDTO,
  IProblemRepository,
  ProblemFilterParams,
  UpdateProblemDTO,
} from "../interfaces/problem.repository.interface";
import { ProblemMapper } from "../mappers/problem.mapper";

// Register Core Filters
problemFilterRegistry.register(new DifficultyFilterImplementation());
problemFilterRegistry.register(new LastAskedFilterImplementation());

const MAX_PAGE_SIZE = 50;
const MAX_OFFSET_LIMIT = 2000;

function getFirestore(): Firestore {
  if (!db) {
    throw new Error(
      "Firestore is not initialized. Check your Firebase configuration.",
    );
  }
  return db;
}

function isFirestoreIndexError(error: unknown): boolean {
  if (typeof error !== "object" || error === null) {return false;}
  const err = error as Record<string, unknown>;
  return (
    err.code === "failed-precondition" ||
    (typeof err.message === "string" && err.message.includes("index"))
  );
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

export class ProblemRepository implements IProblemRepository {
  /**
   * Find a problem by its unique identifier
   * Implements IBaseRepository.findById
   */
  async findById(id: string): Promise<Problem | null> {
    try {
      const problemDocRef = doc(getFirestore(), "problems", id);
      const problemSnap = await getDoc(problemDocRef);

      if (!problemSnap.exists()) {
        return null;
      }

      const data = problemSnap.data();
      return ProblemMapper.toDomain({
        id: problemSnap.id,
        title: data.title,
        description: data.description,
        difficulty: data.difficulty,
        link: data.link,
        tags: data.tags || [],
        normalizedTitle: data.normalizedTitle,
        acceptanceRate: data.acceptanceRate,
        lastAskedPeriod: data.lastAskedPeriod,
        companyId: data.companyIds?.[0] || "unknown",
        companySlug: data.companySlug || "unknown",
        companyIds: data.companyIds,
        companies: data.companies,
        problemCompanyName: data.problemCompanyName,
        slug: problemSnap.id,
      });
    } catch (error: unknown) {
      Logger.error("Error finding problem by ID", error, { id });
      return null;
    }
  }

  /**
   * Find all problems with pagination
   * Implements IBaseRepository.findAll
   */
  async findAll(params?: ProblemFilterParams): Promise<PaginatedResult<Problem>> {
    const result = await this.getAllProblemsPaginated(params);
    const problems = result.problems.map((p) => ProblemMapper.fromDTO(p as LeetCodeProblem));
    
    return {
      items: problems,
      totalItems: result.totalProblems,
      hasMore: result.hasMore || false,
      nextCursor: result.nextCursor,
      totalPages: result.totalPages,
      currentPage: result.currentPage,
    };
  }

  /**
   * Save a new problem
   * Implements IBaseRepository.save
   */
  async save(data: CreateProblemDTO): Promise<Problem> {
    // Validate input using Zod schema
    const validatedData = CreateProblemSchema.parse(data);

    const problemSlug = slugify(validatedData.title);
    const problemDocRef = doc(getFirestore(), "problems", problemSlug);

    const dataToSave = {
      ...validatedData,
      slug: problemSlug,
      companyIds: [],
      companies: {},
    };

    await setDoc(problemDocRef, dataToSave);

    return ProblemMapper.toDomain({
      id: problemSlug,
      title: validatedData.title,
      description: validatedData.description,
      difficulty: validatedData.difficulty,
      link: validatedData.link,
      tags: validatedData.tags,
      normalizedTitle: validatedData.normalizedTitle,
      acceptanceRate: validatedData.acceptanceRate,
      lastAskedPeriod: validatedData.lastAskedPeriod,
      companyId: "",
      companySlug: "",
      slug: problemSlug,
    });
  }

  /**
   * Update an existing problem
   * Implements IBaseRepository.update
   */
  async update(id: string, data: UpdateProblemDTO): Promise<Problem> {
    // Validate input using Zod schema
    const validatedData = UpdateProblemSchema.parse(data);

    const problemDocRef = doc(getFirestore(), "problems", id);
    const problemSnap = await getDoc(problemDocRef);

    if (!problemSnap.exists()) {
      throw new Error(`Problem not found: ${id}`);
    }

    await updateDoc(problemDocRef, validatedData as { [x: string]: unknown });

    const updatedSnap = await getDoc(problemDocRef);
    const updatedData = updatedSnap.data()!;

    return ProblemMapper.toDomain({
      id: updatedSnap.id,
      title: updatedData.title,
      description: updatedData.description,
      difficulty: updatedData.difficulty,
      link: updatedData.link,
      tags: updatedData.tags || [],
      normalizedTitle: updatedData.normalizedTitle,
      acceptanceRate: updatedData.acceptanceRate,
      lastAskedPeriod: updatedData.lastAskedPeriod,
      companyId: updatedData.companyIds?.[0] || "unknown",
      companySlug: updatedData.companySlug || "unknown",
      companyIds: updatedData.companyIds,
      companies: updatedData.companies,
      problemCompanyName: updatedData.problemCompanyName,
      slug: updatedSnap.id,
    });
  }

  /**
   * Delete a problem by ID
   * Implements IBaseRepository.delete
   */
  async delete(id: string): Promise<void> {
    const problemDocRef = doc(getFirestore(), "problems", id);
    const { deleteDoc } = await import("firebase/firestore");
    await deleteDoc(problemDocRef);
  }

  /**
   * Check if a problem exists
   * Implements IBaseRepository.exists
   */
  async exists(id: string): Promise<boolean> {
    const problemDocRef = doc(getFirestore(), "problems", id);
    const problemSnap = await getDoc(problemDocRef);
    return problemSnap.exists();
  }

  async getProblemsByCompany(
    companyId: string,
    params: FetchProblemsParams = {},
  ): Promise<PaginatedProblemsResponse> {
    const {
      cursor,
      page,
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

    this.validatePaginationParams(page, pageSize);

    return await this.fetchProblemsByCompanyCore(companyId, {
      cursor,
      page,
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
      cursor,
      page,
      pageSize = 10,
      difficultyFilter = [],
      lastAskedFilter = [],
      searchTerm = "",
      sortKey = "title",
      userId,
    } = params;

    this.validatePaginationParams(page, pageSize);

    const {
      problems,
      totalProblems,
      hasMore,
      nextCursor,
      totalPages,
      currentPage,
    } = await this.fetchAllProblemsCore({
      cursor,
      page,
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
    } catch (error: unknown) {
      Logger.error("Error fetching all problems", error);
      return [];
    }
  }

  async getProblemDetails(
    companyId: string,
    problemId: string,
  ): Promise<LeetCodeProblem | undefined> {
    try {
      if (!companyId || !problemId) {return undefined;}
      const problemDocRef = doc(getFirestore(), "problems", problemId); // problemId is the slug
      const problemSnap = await getDoc(problemDocRef);

      if (problemSnap.exists()) {
        const company = await companyRepository.getCompanyById(companyId);
        return this.mapDocToProblem(problemSnap, company);
      }
      return undefined;
    } catch (error: unknown) {
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
      if (!company) {return { company: undefined, problem: undefined };}

      const problemDocRef = doc(getFirestore(), "problems", problemSlug);
      const problemSnap = await getDoc(problemDocRef);

      if (problemSnap.exists()) {
        const problem = this.mapDocToProblem(problemSnap, company);
        return { company, problem };
      }
      return { company, problem: undefined };
    } catch (error: unknown) {
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
    } catch (error: unknown) {
      Logger.error(
        "Error fetching all problem company and problem slugs",
        error,
      );
      return [];
    }
  }

  private validatePaginationParams(page: number | undefined, pageSize: number) {
    if (pageSize > MAX_PAGE_SIZE) {
      throw new Error(
        `Page size exceeds limit of ${MAX_PAGE_SIZE}. Requested: ${pageSize}`,
      );
    }

    if (page && page * pageSize > MAX_OFFSET_LIMIT) {
      throw new Error(
        `Deep pagination limit exceeded. Maximum offset is ${MAX_OFFSET_LIMIT}. Please use cursor-based pagination or refine your filters.`,
      );
    }
  }

  private async fetchProblemsByCompanyCore(
    companyId: string,
    params: FetchProblemsParams,
  ) {
    const {
      searchTerm = "",
      sortKey = "title",
    } = params;

    const baseConstraints: QueryConstraint[] = [
      where("companyIds", "array-contains", companyId),
    ];

    const {
      constraints,
      residualDifficultyFilter,
      residualLastAskedFilter,
    } = this.buildQueryConstraints(params, baseConstraints, companyId);

    const canUseOptimizedPath = this.canUseOptimizedPath(
      residualDifficultyFilter,
      residualLastAskedFilter,
      searchTerm,
      sortKey,
    );

    if (canUseOptimizedPath) {
      try {
        return await this.fetchProblemsByCompanyOptimized(
          companyId,
          params,
          constraints,
          residualDifficultyFilter,
          residualLastAskedFilter,
        );
      } catch (error: unknown) {
        if (isFirestoreIndexError(error)) {
          Logger.warn(
            "Optimized path failed, falling back to semi-optimized",
            undefined,
            { message: error instanceof Error ? error.message : String(error) },
          );
        } else {
          throw error;
        }
      }
    }

    return await this.fetchProblemsByCompanySemiOptimized(
      companyId,
      params,
      constraints,
      residualDifficultyFilter,
      residualLastAskedFilter,
    );
  }

  private buildQueryConstraints(
    params: FetchProblemsParams,
    baseConstraints: QueryConstraint[] = [],
    companyId?: string,
  ) {
    const {
      difficultyFilter = [],
      lastAskedFilter = [],
      searchTerm = "",
    } = params;

    const constraints = [...baseConstraints];
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
      // If companyId is provided, we filter by company-specific period
      // Otherwise we filter by global period (for generic lists)
      // Note: The original 'fetchAllProblemsCore' logic treated lastAsked as fully residual.
      // We preserve that behavior if companyId is missing for now, or adapt as needed.
      if (companyId) {
        const fieldPath = `companies.${companyId}.lastAskedPeriod`;
        if (lastAskedFilter.length === 1) {
          constraints.push(where(fieldPath, "==", lastAskedFilter[0]));
        } else if (!usedInOperator) {
          constraints.push(where(fieldPath, "in", lastAskedFilter));
          usedInOperator = true;
        } else {
          residualLastAskedFilter = lastAskedFilter;
        }
      } else {
        // For global lists, we currently treat lastAsked as residual
        // (matching original fetchAllProblemsCore implementation)
        residualLastAskedFilter = lastAskedFilter;
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

    return {
      constraints,
      residualDifficultyFilter,
      residualLastAskedFilter,
    };
  }

  private canUseOptimizedPath(
    residualDifficultyFilter: DifficultyFilter[],
    residualLastAskedFilter: LastAskedFilter[],
    searchTerm: string,
    sortKey: SortKey = "title",
  ): boolean {
    const hasResidualFilters =
      residualDifficultyFilter.length > 0 || residualLastAskedFilter.length > 0;

    const isSortCompatibleWithSearch =
      searchTerm.trim() !== "" ? sortKey === "title" : true;

    const isSupportedSort = sortKey === "title" || sortKey === "difficulty";

    return (
      !hasResidualFilters && isSupportedSort && isSortCompatibleWithSearch
    );
  }

  private async fetchProblemsByCompanyOptimized(
    companyId: string,
    params: FetchProblemsParams,
    constraints: QueryConstraint[],
    residualDifficultyFilter: DifficultyFilter[],
    residualLastAskedFilter: LastAskedFilter[],
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

    const queryConstraints = [...constraints, orderBy(sortField, "asc")];

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

    const q = query(problemsColRef, ...queryConstraints);

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
        isBookmarked: false, // Will be filled by UI layer
        currentStatus: undefined, // Will be filled by UI layer
        link: data.link,
      } as ProblemSummaryDTO;
    });

    // Use cursor from the LAST item
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
    residualDifficultyFilter: DifficultyFilter[],
    residualLastAskedFilter: LastAskedFilter[],
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

      // Extensibility Point: Apply generic filters via Registry
      // This replaces the hardcoded difficulty/lastAsked logic
      const filtersToApply: Record<string, unknown> = {};
      if (residualDifficultyFilter.length > 0) {
        filtersToApply["difficulty"] = residualDifficultyFilter;
      }
      if (residualLastAskedFilter.length > 0) {
        filtersToApply["lastAsked"] = residualLastAskedFilter;
      }

      // Note: We can also pass other arbitrary filters here if 'params' was extended
      processedProblems = problemFilterRegistry.filterInMemory(
        processedProblems,
        filtersToApply,
        companyId,
      );

      // Search is now handled by Firestore constraints (Starts With logic on Title).
      // This optimization prioritizes read efficiency over full-text/tag search capabilities.

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
        if (sortKey === "title") {return a.title.localeCompare(b.title);}
        if (sortKey === "difficulty")
          {return difficultyOrder[a.difficulty] - difficultyOrder[b.difficulty];}
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
          difficulty: residualDifficultyFilter.length > 0,
          lastAsked: residualLastAskedFilter.length > 0,
          search: !!searchTerm,
        },
      });

      return {
        problems: paginatedProblems,
        totalProblems,
        hasMore,
        nextCursor,
      };
    } catch (error: unknown) {
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
    const {
      searchTerm = "",
      sortKey = "title",
    } = params;

    const {
      constraints,
      residualDifficultyFilter,
      residualLastAskedFilter,
    } = this.buildQueryConstraints(params);

    const canUseOptimizedPath = this.canUseOptimizedPath(
      residualDifficultyFilter,
      residualLastAskedFilter,
      searchTerm,
      sortKey,
    );

    if (canUseOptimizedPath) {
      try {
        return await this.fetchProblemsOptimized(params, constraints);
      } catch (error: unknown) {
        if (isFirestoreIndexError(error)) {
          Logger.warn(
            "Optimized path failed, falling back to full fetch",
            undefined,
            { message: error instanceof Error ? error.message : String(error) },
          );
        } else {
          throw error;
        }
      }
    }

    return await this.fetchProblemsSemiOptimized(
      params,
      constraints,
      residualDifficultyFilter,
      residualLastAskedFilter,
    );
  }

  private async fetchProblemsOptimized(
    params: {
      cursor?: string;
      page?: number;
      pageSize?: number;
      sortKey?: SortKey;
    },
    constraints: QueryConstraint[],
  ) {
    const {
      cursor,
      page,
      pageSize = 10,
      sortKey = "title",
    } = params;

    const problemsColRef = collection(getFirestore(), "problems");
    const totalProblems = -1; // -1 indicates unknown

    // 2. Prepare Query for Data
    const sortField =
      sortKey === "difficulty" ? "difficulty" : "normalizedTitle";
    const queryConstraints = [...constraints, orderBy(sortField, "asc")];

    if (sortKey === "difficulty") {
      queryConstraints.push(orderBy("normalizedTitle", "asc"));
    }

    let limitCount = pageSize;
    let startIndex = 0;

    // PAGINATION STRATEGY
    if (page) {
      // Fetch limit = (page * pageSize) + 1 to detect hasMore
      limitCount = page * pageSize + 1;
      startIndex = (page - 1) * pageSize;
      queryConstraints.push(limit(limitCount));
    } else {
      // Cursor based (existing logic)
      queryConstraints.push(limit(pageSize + 1));
      if (cursor) {
        const cursorDocRef = doc(getFirestore(), "problems", cursor);
        const cursorDocSnap = await getDoc(cursorDocRef);
        if (cursorDocSnap.exists()) {
          queryConstraints.push(startAfter(cursorDocSnap));
        }
      }
    }

    const q = query(problemsColRef, ...queryConstraints);
    const snap = await getDocs(q);
    const docs = snap.docs;

    // Process results
    let resultDocs = docs;
    let hasMore = false;

    if (page) {
      const targetSize = page * pageSize;
      hasMore = docs.length > targetSize;

      resultDocs = docs.length <= startIndex ? [] : docs.slice(startIndex, startIndex + pageSize);
    } else {
      // Cursor logic
      hasMore = docs.length > pageSize;
      if (hasMore) {
        resultDocs = docs.slice(0, pageSize);
      }
    }

    const problems = resultDocs.map((docSnap) =>
      this.mapDocToProblem(docSnap),
    );

    // Calculate pagination metadata
    const totalPages = -1;
    const currentPage = page || 1;
    const nextCursor = hasMore
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
  }

  private async fetchProblemsSemiOptimized(
    params: {
      cursor?: string;
      page?: number;
      pageSize?: number;
      sortKey?: SortKey;
    },
    constraints: QueryConstraint[],
    residualDifficultyFilter: DifficultyFilter[],
    residualLastAskedFilter: LastAskedFilter[],
  ) {
    const {
      cursor,
      page,
      pageSize = 10,
      sortKey = "title",
    } = params;

    const problemsColRef = collection(getFirestore(), "problems");
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
      if (sortKey === "title") {return a.title.localeCompare(b.title);}
      if (sortKey === "difficulty")
        {return difficultyOrder[a.difficulty] - difficultyOrder[b.difficulty];}
      return 0;
    });

    const totalProblems = processedProblems.length;
    let paginatedProblems: LeetCodeProblem[] = [];
    let hasMore = false;
    let nextCursor: string | undefined;
    let totalPages: number | undefined;
    let currentPage: number | undefined;

    if (page) {
      // Page-Based Pagination Logic
      totalPages = Math.ceil(totalProblems / pageSize);
      currentPage = Math.max(1, Math.min(page, totalPages || 1));
      const startIndex = (currentPage - 1) * pageSize;
      paginatedProblems = processedProblems.slice(
        startIndex,
        startIndex + pageSize,
      );
      hasMore = currentPage < totalPages;
    } else {
      // Cursor-Based or Default Logic (Fallback)
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
    docSnap: DocumentSnapshot,
    company?: Company,
  ): LeetCodeProblem {
    const data = docSnap.data()!;
    const companyId = company?.id || data.companyIds?.[0] || "unknown";

    // Determine companySlug:
    // 1. If company object is passed, use its slug.
    // 2. Else use "unknown" or try to infer (not possible without company lookup)
    const companySlug = company?.slug || "unknown";

    // Overlay company-specific data if available
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

    // Validate at the edge
    const result = LeetCodeProblemSchema.safeParse(problem);
    if (!result.success) {
      // We log but still return the object to avoid crashing UI for partial data issues
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
      // Validate input (mostly CreateProblemSchema but some fields might vary slightly)
      // Since addProblem input signature is slightly looser than CreateProblemDTO, we construct a partial validation or rely on runtime checks.
      // However, for security, we should enforce the critical parts.
      // Mapping input to something we can validate against CreateProblemSchema.
      // Note: problemData lacks 'description', but CreateProblemSchema makes it optional.

      // We explicitly cast to unknown then CreateProblemDTO for validation purpose
      // This ensures title, link, difficulty, etc are valid.
      // If problemData is missing required fields, parsing will fail.
      const dataToValidate = {
        description: "", // Provide default if missing
        ...problemData,
      };
      // We use safeParse here to not break existing flexible signature if strict schema mismatch
      // But we WANT to catch bad URLs.
      const parseResult = CreateProblemSchema.safeParse(dataToValidate);

      if (!parseResult.success) {
        const errorMessage = parseResult.error.issues
          .map((i) => `${i.path.join(".")}: ${i.message}`)
          .join(", ");
        throw new Error(`Validation failed: ${errorMessage}`);
      }

      const validatedData = parseResult.data;

      const problemSlug = slugify(validatedData.title);
      const problemDocRef = doc(getFirestore(), "problems", problemSlug);
      const problemSnap = await getDoc(problemDocRef);

      if (problemSnap.exists()) {
        const existingData = problemSnap.data();
        const companyIds = new Set(existingData.companyIds || []);
        companyIds.add(companyId);

        const companiesMap = existingData.companies || {};
        companiesMap[companyId] = {
          lastAskedPeriod: validatedData.lastAskedPeriod,
        };

        await updateDoc(problemDocRef, {
          ...validatedData,
          slug: problemSlug,
          companyIds: Array.from(companyIds),
          companies: companiesMap,
        });
        return { id: problemSlug, updated: true };
      } else {
        const companiesMap = {
          [companyId]: {
            lastAskedPeriod: validatedData.lastAskedPeriod,
          },
        };

        const dataToSave = {
          ...validatedData,
          slug: problemSlug,
          companyIds: [companyId],
          companies: companiesMap,
        };

        await setDoc(problemDocRef, dataToSave);
        return { id: problemSlug, updated: false };
      }
    } catch (error: unknown) {
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






