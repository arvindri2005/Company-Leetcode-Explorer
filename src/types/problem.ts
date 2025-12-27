import { z } from "zod";

/**
 * @description Represents the periods when a LeetCode problem was reportedly last asked.
 */
export type LastAskedPeriod =
  | "last_30_days"
  | "within_3_months" // i.e., >30 days ago, up to 3 months ago
  | "within_6_months" // i.e., >3 months ago, up to 6 months ago
  | "older_than_6_months";

/**
 * @description Options for selecting the last asked period in UI elements, with user-friendly labels.
 */
export const lastAskedPeriodOptions: ReadonlyArray<{
  value: LastAskedPeriod;
  label: string;
}> = [
  { value: "last_30_days", label: "In the last 30 days" },
  { value: "within_3_months", label: "Within 1-3 months" },
  { value: "within_6_months", label: "Within 3-6 months" },
  { value: "older_than_6_months", label: "Older than 6 months" },
] as const;

/**
 * @description Mapping from LastAskedPeriod values to display-friendly strings.
 */
export const lastAskedPeriodDisplayMap: Record<LastAskedPeriod, string> = {
  last_30_days: "Last 30 days",
  within_3_months: "1-3 months ago",
  within_6_months: "3-6 months ago",
  older_than_6_months: "Over 6 months ago",
};

/**
 * @description Represents the status of a user's progress on a problem.
 * 'none' indicates no status has been set or it has been cleared.
 */
export type ProblemStatus = "solved" | "attempted" | "todo" | "none";

/**
 * @description Options for selecting problem status in UI elements.
 */
export const PROBLEM_STATUS_OPTIONS: ReadonlyArray<{
  value: ProblemStatus;
  label: string;
  description: string;
}> = [
  { value: "none", label: "No Status", description: "Clear current status." },
  { value: "todo", label: "To-Do", description: "Mark as planned to solve." },
  {
    value: "attempted",
    label: "Attempted",
    description: "Mark as attempted but not fully solved.",
  },
  {
    value: "solved",
    label: "Solved",
    description: "Mark as successfully solved.",
  },
] as const;

/**
 * @description Display properties (label, icon, color) for each problem status (excluding 'none').
 */
export const PROBLEM_STATUS_DISPLAY: Record<
  Exclude<ProblemStatus, "none">,
  { label: string; iconName?: string; colorClass?: string }
> = {
  solved: {
    label: "Solved",
    iconName: "CheckCircle2",
    colorClass: "text-green-500",
  },
  attempted: {
    label: "Attempted",
    iconName: "Pencil",
    colorClass: "text-yellow-500",
  },
  todo: { label: "To-Do", iconName: "ListTodo", colorClass: "text-blue-500" },
};

/**
 * @description Represents a LeetCode problem stored in the application.
 */
export interface LeetCodeProblem {
  id: string;
  title: string;
  difficulty: "Easy" | "Medium" | "Hard";
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
export const DifficultySchema = z.enum(["Easy", "Medium", "Hard"]);

/**
 * @description Zod schema for last asked period.
 */
export const LastAskedPeriodSchema = z.enum([
  "last_30_days",
  "within_3_months",
  "within_6_months",
  "older_than_6_months",
]);

/**
 * @description Zod schema for problem status.
 */
export const ProblemStatusSchema = z.enum(["solved", "attempted", "todo", "none"]);

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
  companySlug: z.string(),
  companyIds: z.array(z.string()).optional(),
  companies: z.record(
    z.string(),
    z.object({
      lastAskedPeriod: LastAskedPeriodSchema.optional(),
    })
  ).optional(),
  problemCompanyName: z.string().optional(),
  slug: z.string(),
  lastAskedPeriod: LastAskedPeriodSchema.optional(),
  normalizedTitle: z.string(),
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
