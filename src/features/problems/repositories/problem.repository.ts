/**
 * Problem Repository (Supabase)
 *
 * Handles all data access for problems using Supabase PostgreSQL.
 * Uses the `problems` table with a `company_problems` junction table
 * for the many-to-many company-problem relationship.
 */

import type { Problem } from "@/core/domain/entities/problem.entity";
import { companyRepository } from "@/features/companies/repositories/company.repository";
import {
  MAX_COMPANIES_PER_PROBLEM,
  MAX_SEARCH_TERM_LENGTH,
} from "@/features/problems/constants/problem-constants";
import type { PaginatedResult } from "@/shared/interfaces";
import { supabase } from "@/shared/lib/api/supabase";
import { slugify } from "@/shared/lib/utils";
import { Logger } from "@/shared/lib/utils/logger";
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
} from "@/shared/types";

import type {
  CreateProblemDTO,
  IProblemRepository,
  ProblemFilterParams,
  UpdateProblemDTO,
} from "../interfaces/problem.repository.interface";
import { ProblemMapper } from "../mappers/problem.mapper";

const MAX_PAGE_SIZE = 50;
const MAX_OFFSET_LIMIT = 2000;

// ============================================
// Supabase Row Types
// ============================================

interface SupabaseProblemRow {
  id: string;
  title: string;
  normalized_title: string | null;
  slug: string | null;
  url: string | null;
  difficulty: "Easy" | "Medium" | "Hard" | null;
  tags: string[] | null;
  created_at: number | null;
  updated_at: number | null;
}

interface SupabaseCompanyProblemRow {
  company_id: string;
  problem_id: string;
  last_asked_period: string | null;
  created_at: string | null;
}

// Combined row when joining problems with company_problems
interface SupabaseProblemWithCompanyRow extends SupabaseProblemRow {
  company_problems: SupabaseCompanyProblemRow[] | SupabaseCompanyProblemRow | null;
}

// ============================================
// Mapper Functions
// ============================================

/**
 * Map a Supabase problem row to LeetCodeProblem type
 */
function mapRowToLeetCodeProblem(
  row: SupabaseProblemRow,
  companyId: string = "unknown",
  companySlug: string = "unknown",
  lastAskedPeriod?: LastAskedPeriod,
): LeetCodeProblem {
  const problem: LeetCodeProblem = {
    id: row.id,
    title: row.title,
    difficulty: (row.difficulty || "Medium") as "Easy" | "Medium" | "Hard",
    link: row.url || "",
    tags: row.tags || [],
    companyId,
    companySlug,
    slug: row.slug || row.id,
    normalizedTitle: row.normalized_title || row.title.toLowerCase(),
    lastAskedPeriod: lastAskedPeriod as LastAskedPeriod | undefined,
    isBookmarked: false,
    currentStatus: undefined,
  };

  // Security: Defense-in-depth sanitization for links
  if (
    problem.link &&
    typeof problem.link === "string" &&
    !problem.link.startsWith("http://") &&
    !problem.link.startsWith("https://")
  ) {
    problem.link = "";
  }

  // Validate at the edge in dev
  if (process.env.NODE_ENV === "development") {
    const result = LeetCodeProblemSchema.safeParse(problem);
    if (!result.success) {
      Logger.warn(
        `Data integrity issue in Problem (ID: ${problem.id}): ${result.error.issues
          .map((i) => `${i.path.join(".")}: ${i.message}`)
          .join(", ")}`,
      );
    }
  }

  return problem;
}

/**
 * Map a Supabase problem row to ProblemSummaryDTO
 */
function mapRowToSummaryDTO(
  row: SupabaseProblemRow,
  companyId: string,
  companySlug: string,
  lastAskedPeriod?: LastAskedPeriod,
): ProblemSummaryDTO {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug || row.id,
    difficulty: (row.difficulty || "Medium") as "Easy" | "Medium" | "Hard",
    companyId,
    companySlug,
    lastAskedPeriod: lastAskedPeriod as LastAskedPeriod | undefined,
    tags: row.tags || [],
    link: row.url || "",
    normalizedTitle: row.normalized_title || row.title.toLowerCase(),
    acceptanceRate: undefined,
    isBookmarked: false,
    currentStatus: undefined,
  };
}

// ============================================
// Sort field mapping
// ============================================

function getSortColumn(sortKey: SortKey): string {
  switch (sortKey) {
    case "difficulty": return "difficulty";
    case "lastAsked": return "normalized_title"; // lastAsked requires post-processing
    case "title":
    default: return "normalized_title";
  }
}

// ============================================
// Repository Implementation
// ============================================

export class ProblemRepository implements IProblemRepository {
  // --- IBaseRepository implementation ---

  async findById(id: string): Promise<Problem | null> {
    try {
      const { data, error } = await supabase
        .from("problems")
        .select("*")
        .eq("id", id)
        .single();

      if (error || !data) {
        if (error?.code !== "PGRST116") {
          Logger.error("Error finding problem by ID", error, { id });
        }
        return null;
      }

      const row = data as SupabaseProblemRow;

      // Fetch company associations
      const { data: companyProblems } = await supabase
        .from("company_problems")
        .select("company_id, last_asked_period")
        .eq("problem_id", id)
        .limit(1);

      const cp = companyProblems?.[0];

      return ProblemMapper.toDomain({
        id: row.id,
        title: row.title,
        description: "",
        difficulty: (row.difficulty || "Medium") as "Easy" | "Medium" | "Hard",
        link: row.url || "",
        tags: row.tags || [],
        normalizedTitle: row.normalized_title || row.title.toLowerCase(),
        companyId: cp?.company_id || "unknown",
        companySlug: "unknown",
        slug: row.slug || row.id,
        lastAskedPeriod: cp?.last_asked_period as LastAskedPeriod | undefined,
      });
    } catch (error: unknown) {
      Logger.error("Error finding problem by ID", error, { id });
      return null;
    }
  }

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

  async save(data: CreateProblemDTO): Promise<Problem> {
    const validatedData = CreateProblemSchema.parse(data);
    const safeNormalizedTitle = validatedData.title
      .toLowerCase()
      .replace(/[^a-z0-9\s\-\.\+\#]/g, "")
      .trim();

    const problemSlug = slugify(validatedData.title);
    if (!problemSlug) {
      throw new Error("Title results in an empty slug. Please include alphanumeric characters.");
    }

    const { error } = await supabase.from("problems").insert({
      id: problemSlug,
      title: validatedData.title,
      normalized_title: safeNormalizedTitle,
      slug: problemSlug,
      url: validatedData.link,
      difficulty: validatedData.difficulty,
      tags: validatedData.tags,
    });

    if (error) {
      throw error;
    }

    return ProblemMapper.toDomain({
      id: problemSlug,
      title: validatedData.title,
      description: validatedData.description,
      difficulty: validatedData.difficulty,
      link: validatedData.link,
      tags: validatedData.tags,
      normalizedTitle: safeNormalizedTitle,
      companyId: "",
      companySlug: "",
      slug: problemSlug,
    });
  }

  async update(id: string, data: UpdateProblemDTO): Promise<Problem> {
    const validatedData = { ...data };

    if (validatedData.title) {
      validatedData.normalizedTitle = validatedData.title
        .toLowerCase()
        .replace(/[^a-z0-9\s\-\.\+\#]/g, "")
        .trim();
    } else {
      delete validatedData.normalizedTitle;
    }

    // Map to Supabase snake_case
    const updates: Record<string, unknown> = {};
    if (validatedData.title !== undefined) updates.title = validatedData.title;
    if (validatedData.normalizedTitle !== undefined) updates.normalized_title = validatedData.normalizedTitle;
    if (validatedData.difficulty !== undefined) updates.difficulty = validatedData.difficulty;
    if (validatedData.link !== undefined) updates.url = validatedData.link;
    if (validatedData.tags !== undefined) updates.tags = validatedData.tags;
    if (validatedData.description !== undefined) { /* description not in problems table */ }

    const { error } = await supabase
      .from("problems")
      .update(updates)
      .eq("id", id);

    if (error) {
      throw error;
    }

    const found = await this.findById(id);
    if (!found) {
      throw new Error(`Problem not found after update: ${id}`);
    }

    return found;
  }

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from("problems").delete().eq("id", id);
    if (error) {
      throw error;
    }
  }

  async exists(id: string): Promise<boolean> {
    const { data, error } = await supabase
      .from("problems")
      .select("id")
      .eq("id", id)
      .single();

    return !error && !!data;
  }

  // --- IProblemRepository specific methods ---

  async getProblemsByCompany(
    companyId: string,
    params: ProblemFilterParams = {},
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

    try {
      const safePageSize = Math.min(pageSize, MAX_PAGE_SIZE);
      const normalizedSearchTerm = searchTerm
        ?.trim()
        .slice(0, MAX_SEARCH_TERM_LENGTH)
        .toLowerCase();

      // Step 1: Fetch problem IDs for this company from junction table
      let junctionQuery = supabase
        .from("company_problems")
        .select("problem_id, last_asked_period")
        .eq("company_id", companyId);

      // Apply lastAsked filter at junction level
      if (lastAskedFilter.length > 0) {
        junctionQuery = junctionQuery.in("last_asked_period", lastAskedFilter);
      }

      const { data: junctionRows, error: junctionError } = await junctionQuery;

      if (junctionError) {
        Logger.error("Error fetching company_problems", junctionError, { companyId });
        throw junctionError;
      }

      if (!junctionRows || junctionRows.length === 0) {
        return {
          problems: [],
          totalProblems: 0,
          hasMore: false,
          totalPages: 0,
          currentPage: page || 1,
        };
      }

      // Build a map of problemId → lastAskedPeriod for this company
      const lastAskedMap = new Map<string, LastAskedPeriod | undefined>();
      const problemIds = junctionRows.map((jr) => {
        lastAskedMap.set(jr.problem_id, jr.last_asked_period as LastAskedPeriod | undefined);
        return jr.problem_id;
      });

      // Step 2: Fetch full problem data
      let problemQuery = supabase
        .from("problems")
        .select("*")
        .in("id", problemIds);

      // Apply difficulty filter
      if (difficultyFilter.length > 0) {
        problemQuery = problemQuery.in("difficulty", difficultyFilter);
      }

      // Apply search filter
      if (normalizedSearchTerm && normalizedSearchTerm.trim() !== "") {
        problemQuery = problemQuery.ilike("normalized_title", `${normalizedSearchTerm}%`);
      }

      // Apply sort
      const sortColumn = getSortColumn(sortKey);
      problemQuery = problemQuery
        .order(sortColumn, { ascending: true })
        .order("id", { ascending: true });

      const { data: problemRows, error: problemsError } = await problemQuery;

      if (problemsError) {
        Logger.error("Error fetching problems for company", problemsError, { companyId });
        throw problemsError;
      }

      // Resolve company slug
      let finalCompanySlug = companySlug;
      if (!finalCompanySlug) {
        const company = await companyRepository.getCompanyById(companyId);
        finalCompanySlug = company?.slug || slugify(company?.name || "unknown");
      }

      // Map to DTOs
      let processedProblems: ProblemSummaryDTO[] = (problemRows || []).map((row) => {
        const r = row as SupabaseProblemRow;
        return mapRowToSummaryDTO(
          r,
          companyId,
          finalCompanySlug!,
          lastAskedMap.get(r.id),
        );
      });

      // Sort by lastAsked if needed (requires post-processing since it's from junction)
      if (sortKey === "lastAsked") {
        const lastAskedOrder: Record<LastAskedPeriod, number> = {
          last_30_days: 1,
          within_3_months: 2,
          within_6_months: 3,
          older_than_6_months: 4,
        };
        processedProblems.sort((a, b) => {
          const aPeriod = a.lastAskedPeriod
            ? lastAskedOrder[a.lastAskedPeriod]
            : Number.MAX_SAFE_INTEGER;
          const bPeriod = b.lastAskedPeriod
            ? lastAskedOrder[b.lastAskedPeriod]
            : Number.MAX_SAFE_INTEGER;
          return aPeriod - bPeriod;
        });
      }

      // Calculate totals
      const totalProblems = processedProblems.length;

      // Paginate
      let startIndex = 0;
      if (page) {
        startIndex = (page - 1) * safePageSize;
      } else if (cursor) {
        const cursorIndex = processedProblems.findIndex((p) => p.id === cursor);
        if (cursorIndex !== -1) {
          startIndex = cursorIndex + 1;
        }
      }

      const paginatedProblems = processedProblems.slice(
        startIndex,
        startIndex + safePageSize,
      );

      const hasMore = startIndex + safePageSize < totalProblems;
      const nextCursor = hasMore
        ? paginatedProblems[paginatedProblems.length - 1]?.id
        : undefined;
      const totalPages = Math.ceil(totalProblems / safePageSize);
      const currentPage = page || 1;

      return {
        problems: paginatedProblems,
        totalProblems,
        hasMore,
        nextCursor,
        totalPages,
        currentPage,
      };
    } catch (error: unknown) {
      Logger.error("Error in getProblemsByCompany", error, { companyId });
      throw error;
    }
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
    } = params;

    this.validatePaginationParams(page, pageSize);

    try {
      const safePageSize = Math.min(pageSize, MAX_PAGE_SIZE);
      const normalizedSearchTerm = searchTerm
        ?.trim()
        .slice(0, MAX_SEARCH_TERM_LENGTH)
        .toLowerCase();

      // If we have lastAskedFilter, we need to filter via junction table
      let filteredProblemIds: string[] | null = null;
      if (lastAskedFilter.length > 0) {
        const { data: junctionRows } = await supabase
          .from("company_problems")
          .select("problem_id")
          .in("last_asked_period", lastAskedFilter);

        if (!junctionRows || junctionRows.length === 0) {
          return {
            problems: [],
            totalProblems: 0,
            hasMore: false,
            totalPages: 0,
            currentPage: page || 1,
          };
        }

        filteredProblemIds = [...new Set(junctionRows.map((jr) => jr.problem_id))];
      }

      let query = supabase.from("problems").select("*");

      // Filter by problem IDs if lastAsked was applied
      if (filteredProblemIds !== null) {
        query = query.in("id", filteredProblemIds);
      }

      // Apply difficulty filter
      if (difficultyFilter.length > 0) {
        query = query.in("difficulty", difficultyFilter);
      }

      // Apply search filter
      if (normalizedSearchTerm && normalizedSearchTerm.trim() !== "") {
        query = query.ilike("normalized_title", `${normalizedSearchTerm}%`);
      }

      // Apply sort
      const sortColumn = getSortColumn(sortKey);
      query = query
        .order(sortColumn, { ascending: true })
        .order("id", { ascending: true });

      // For page-based pagination, use offset
      if (page) {
        const startIndex = (page - 1) * safePageSize;
        query = query.range(startIndex, startIndex + safePageSize); // Fetch one extra
      } else {
        // Cursor-based: fetch all and slice (for small datasets)
        // Or use keyset pagination for larger ones
        query = query.limit(safePageSize + 1);

        if (cursor) {
          // Get cursor document to know the sort position
          const { data: cursorDoc } = await supabase
            .from("problems")
            .select("normalized_title, id")
            .eq("id", cursor)
            .single();

          if (cursorDoc) {
            query = supabase
              .from("problems")
              .select("*");

            if (filteredProblemIds !== null) {
              query = query.in("id", filteredProblemIds);
            }
            if (difficultyFilter.length > 0) {
              query = query.in("difficulty", difficultyFilter);
            }
            if (normalizedSearchTerm && normalizedSearchTerm.trim() !== "") {
              query = query.ilike("normalized_title", `${normalizedSearchTerm}%`);
            }

            query = query
              .or(
                `normalized_title.gt.${cursorDoc.normalized_title},and(normalized_title.eq.${cursorDoc.normalized_title},id.gt.${cursorDoc.id})`,
              )
              .order(sortColumn, { ascending: true })
              .order("id", { ascending: true })
              .limit(safePageSize + 1);
          }
        }
      }

      const { data, error } = await query;

      if (error) {
        Logger.error("Error in getAllProblemsPaginated", error);
        throw error;
      }

      const rows = (data || []) as SupabaseProblemRow[];

      let hasMore: boolean;
      let resultRows: SupabaseProblemRow[];

      if (page) {
        hasMore = rows.length > safePageSize;
        resultRows = rows.slice(0, safePageSize);
      } else {
        hasMore = rows.length > safePageSize;
        resultRows = hasMore ? rows.slice(0, safePageSize) : rows;
      }

      const problems = resultRows.map((row) =>
        mapRowToLeetCodeProblem(row, "unknown", "unknown"),
      );

      const nextCursor = hasMore ? problems[problems.length - 1]?.id : undefined;
      const totalPages = -1; // Unknown to save count queries
      const currentPage = page || 1;

      return {
        problems,
        totalProblems: -1,
        hasMore,
        nextCursor,
        totalPages,
        currentPage,
      };
    } catch (error: unknown) {
      Logger.error("Error in getAllProblemsPaginated", error);
      throw error;
    }
  }

  async getAllProblems(): Promise<LeetCodeProblem[]> {
    try {
      const { data, error } = await supabase
        .from("problems")
        .select("*")
        .order("normalized_title", { ascending: true });

      if (error) {
        Logger.error("Error fetching all problems", error);
        return [];
      }

      return (data || []).map((row) =>
        mapRowToLeetCodeProblem(row as SupabaseProblemRow),
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
      if (!companyId || !problemId) return undefined;

      // Fetch problem
      const { data: problemData, error: problemError } = await supabase
        .from("problems")
        .select("*")
        .eq("id", problemId)
        .single();

      if (problemError || !problemData) {
        if (problemError?.code !== "PGRST116") {
          Logger.error("Error fetching problem details", problemError, {
            companyId,
            problemId,
          });
        }
        return undefined;
      }

      // Fetch company for slug info
      const company = await companyRepository.getCompanyById(companyId);

      // Fetch company-specific data from junction
      const { data: cpData } = await supabase
        .from("company_problems")
        .select("last_asked_period")
        .eq("company_id", companyId)
        .eq("problem_id", problemId)
        .single();

      const row = problemData as SupabaseProblemRow;
      return mapRowToLeetCodeProblem(
        row,
        companyId,
        company?.slug || "unknown",
        cpData?.last_asked_period as LastAskedPeriod | undefined,
      );
    } catch (error: unknown) {
      Logger.error("Error fetching problem details", error, {
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

      const { data, error } = await supabase
        .from("problems")
        .select("*")
        .eq("id", problemSlug)
        .single();

      if (error || !data) {
        return { company, problem: undefined };
      }

      // Get company-specific data
      const { data: cpData } = await supabase
        .from("company_problems")
        .select("last_asked_period")
        .eq("company_id", company.id)
        .eq("problem_id", problemSlug)
        .single();

      const row = data as SupabaseProblemRow;
      const problem = mapRowToLeetCodeProblem(
        row,
        company.id,
        company.slug,
        cpData?.last_asked_period as LastAskedPeriod | undefined,
      );

      return { company, problem };
    } catch (error: unknown) {
      Logger.error("Error fetching problem by slugs", error, {
        companySlug,
        problemSlug,
      });
      return { company: undefined, problem: undefined };
    }
  }

  async getAllProblemCompanyAndProblemSlugs(): Promise<
    Array<{ companySlug: string; problemSlug: string }>
  > {
    try {
      // Fetch all company_problems with joins to get slugs
      const { data, error } = await supabase
        .from("company_problems")
        .select(`
          problem_id,
          companies!company_problems_company_id_fkey(slug)
        `);

      if (error) {
        Logger.error("Error fetching problem company slugs", error);
        return [];
      }

      return (data || [])
        .map((row: Record<string, unknown>) => {
          const companies = row.companies as { slug: string | null } | null;
          return {
            companySlug: companies?.slug || "",
            problemSlug: (row.problem_id as string) || "",
          };
        })
        .filter((s) => s.companySlug && s.problemSlug);
    } catch (error: unknown) {
      Logger.error("Error fetching all problem company and problem slugs", error);
      return [];
    }
  }

  async getProblemsByIds(ids: string[]): Promise<LeetCodeProblem[]> {
    if (!ids || ids.length === 0) {
      return [];
    }

    try {
      const uniqueIds = Array.from(new Set(ids));

      const { data, error } = await supabase
        .from("problems")
        .select("*")
        .in("id", uniqueIds);

      if (error) {
        Logger.error("Error fetching problems by IDs", error, { count: ids.length });
        return [];
      }

      return (data || []).map((row) =>
        mapRowToLeetCodeProblem(row as SupabaseProblemRow),
      );
    } catch (error: unknown) {
      Logger.error("Error fetching problems by IDs", error, { count: ids.length });
      return [];
    }
  }

  async addProblem(
    companyId: string,
    problemData: Omit<
      LeetCodeProblem,
      "id" | "companyId" | "companySlug" | "slug"
    > & { normalizedTitle: string },
  ): Promise<{ id: string | null; updated: boolean; error?: string }> {
    try {
      const safeNormalizedTitle = (problemData.title || "")
        .toLowerCase()
        .replace(/[^a-z0-9\s\-\.\+\#]/g, "")
        .trim();

      const dataToValidate = {
        description: "",
        ...problemData,
        normalizedTitle: safeNormalizedTitle,
      };

      const parseResult = CreateProblemSchema.safeParse(dataToValidate);
      if (!parseResult.success) {
        const errorMessage = parseResult.error.issues
          .map((i) => `${i.path.join(".")}: ${i.message}`)
          .join(", ");
        throw new Error(`Validation failed: ${errorMessage}`);
      }

      const validatedData = parseResult.data;
      const problemSlug = slugify(validatedData.title);

      if (!problemSlug) {
        return {
          id: null,
          updated: false,
          error: "Title results in an empty slug. Please include alphanumeric characters.",
        };
      }

      // Check if problem already exists
      const { data: existingProblem } = await supabase
        .from("problems")
        .select("id")
        .eq("id", problemSlug)
        .single();

      if (existingProblem) {
        // Problem exists — check if it's already linked to this company
        const { data: existingLink } = await supabase
          .from("company_problems")
          .select("company_id")
          .eq("company_id", companyId)
          .eq("problem_id", problemSlug)
          .single();

        if (existingLink) {
          // Already linked, update the lastAskedPeriod
          await supabase
            .from("company_problems")
            .update({ last_asked_period: validatedData.lastAskedPeriod || null })
            .eq("company_id", companyId)
            .eq("problem_id", problemSlug);

          return { id: problemSlug, updated: true };
        }

        // Check company count limit
        const { count, error: countError } = await supabase
          .from("company_problems")
          .select("company_id", { count: "exact", head: true })
          .eq("problem_id", problemSlug);

        if (!countError && (count || 0) >= MAX_COMPANIES_PER_PROBLEM) {
          return {
            id: null,
            updated: false,
            error: `Maximum number of companies (${MAX_COMPANIES_PER_PROBLEM}) reached for this problem.`,
          };
        }

        // Link existing problem to this company
        const { error: linkError } = await supabase
          .from("company_problems")
          .insert({
            company_id: companyId,
            problem_id: problemSlug,
            last_asked_period: validatedData.lastAskedPeriod || null,
          });

        if (linkError) {
          throw linkError;
        }

        return { id: problemSlug, updated: true };
      } else {
        // Create new problem
        const { error: insertError } = await supabase
          .from("problems")
          .insert({
            id: problemSlug,
            title: validatedData.title,
            normalized_title: safeNormalizedTitle,
            slug: problemSlug,
            url: validatedData.link,
            difficulty: validatedData.difficulty,
            tags: validatedData.tags,
          });

        if (insertError) {
          // Handle unique constraint violation
          if (insertError.code === "23505") {
            return {
              id: problemSlug,
              updated: false,
              error: `Problem "${validatedData.title}" already exists.`,
            };
          }
          throw insertError;
        }

        // Link to company
        await supabase.from("company_problems").insert({
          company_id: companyId,
          problem_id: problemSlug,
          last_asked_period: validatedData.lastAskedPeriod || null,
        });

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

  // --- Private helpers ---

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
}

export const problemRepository = new ProblemRepository();
