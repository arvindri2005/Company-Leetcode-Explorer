import { z } from "zod";
import { SlugSchema } from "@/types/common";

/**
 * @description Represents the periods when a LeetCode problem was reportedly last asked.
 */
export type LastAskedPeriod =
  | "last_30_days"
  | "within_3_months" // i.e., >30 days ago, up to 3 months ago
  | "within_6_months" // i.e., >3 months ago, up to 6 months ago
  | "older_than_6_months";

/**
 * @description Represents the status of a user's progress on a problem.
 * 'none' indicates no status has been set or it has been cleared.
 */
export type ProblemStatus = "solved" | "attempted" | "todo" | "none";

/**
 * @description Represents a LeetCode problem stored in the application.
 */
export interface LeetCodeProblem {
  id: string;
  title: string;
  difficulty: "Easy" | "Medium" | "Hard";
  acceptanceRate?: number;
  link: string;
  tags: string[];
  companyId: string; // ID of the company this problem is primarily associated with in *this* app (Legacy/Primary)
  companySlug: string; // Slug of the company this problem is primarily associated with (Legacy/Primary)
  companyIds?: string[]; // List of all company IDs this problem belongs to
  companies?: Record<string, { lastAskedPeriod?: LastAskedPeriod }>; // Map of company ID to company-specific data
  problemCompanyName?: string; // Denormalized company name
  slug: string; // Problem's own slug
  lastAskedPeriod?: LastAskedPeriod;
  normalizedTitle: string;
  // Optional fields for UI, augmented after fetching user-specific data
  isBookmarked?: boolean;
  currentStatus?: ProblemStatus;
}

/**
 * @description Lightweight DTO for listing problems.
 */
export interface ProblemSummaryDTO extends Pick<LeetCodeProblem, "id" | "title" | "slug" | "difficulty" | "companyId" | "companySlug" | "lastAskedPeriod" | "isBookmarked" | "currentStatus" | "tags" | "link" | "normalizedTitle"> {
    acceptanceRate?: number; // Add if available in DB, otherwise optional
}

/**
 * @description Zod schema for problem difficulty.
 */
export const VALID_DIFFICULTIES = ["Easy", "Medium", "Hard"] as const;
export const DifficultySchema = z.enum(VALID_DIFFICULTIES);

/**
 * @description Zod schema for last asked period.
 */
export const VALID_LAST_ASKED_PERIODS = [
  "last_30_days",
  "within_3_months",
  "within_6_months",
  "older_than_6_months",
] as const;
export const LastAskedPeriodSchema = z.enum(VALID_LAST_ASKED_PERIODS);

/**
 * @description Zod schema for problem status.
 */
export const VALID_STATUSES = ["solved", "attempted", "todo", "none"] as const;
export const VALID_STATUS_FILTERS = ["solved", "attempted", "todo"] as const;
export const ProblemStatusSchema = z.enum(VALID_STATUSES);

/**
 * @description Zod schema for a LeetCode problem.
 * @see LeetCodeProblem
 */
export const LeetCodeProblemSchema = z.object({
  id: z.string(),
  title: z.string(),
  difficulty: DifficultySchema,
  link: z.string().url(),
  tags: z.array(z.string()),
  companyId: z.string(),
  companySlug: SlugSchema,
  companyIds: z.array(z.string()).optional(),
  companies: z.record(
    z.string(),
    z.object({
      lastAskedPeriod: LastAskedPeriodSchema.optional(),
    })
  ).optional(),
  problemCompanyName: z.string().optional(),
  slug: SlugSchema,
  lastAskedPeriod: LastAskedPeriodSchema.optional(),
  normalizedTitle: z.string(),
  acceptanceRate: z.number().optional(),
  isBookmarked: z.boolean().optional(),
  currentStatus: ProblemStatusSchema.optional(),
});

// --- Types for Problem List Pagination & Filtering ---
/**
 * @description Represents the difficulty filter options for a problem list.
 */
export type DifficultyFilter = LeetCodeProblem["difficulty"];
/**
 * @description Represents the sorting options for a problem list.
 */
export type SortKey = "title" | "difficulty" | "lastAsked";
/**
 * @description Represents the last asked filter options for a problem list.
 */
export type LastAskedFilter = LastAskedPeriod;
/**
 * @description Represents the status filter options for a problem list.
 */
export type StatusFilter = ProblemStatus;

/**
 * @description Represents the combined filter and sort state for a problem list.
 */
export interface ProblemListFilters {
  difficultyFilter: DifficultyFilter[];
  lastAskedFilter: LastAskedFilter[];
  statusFilter: StatusFilter[];
  searchTerm: string;
  sortKey: SortKey;
}

/**
 * @description Represents the response structure for a paginated list of problems.
 */
export interface PaginatedProblemsResponse {
  problems: LeetCodeProblem[] | ProblemSummaryDTO[];
  totalProblems: number;
  hasMore?: boolean;
  nextCursor?: string;
  totalPages?: number;
  currentPage?: number;
}






