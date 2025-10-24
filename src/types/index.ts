import type { User as FirebaseUser } from "firebase/auth";
import { z } from "zod"; // Import Zod

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
 * @description Represents a LeetCode problem stored in the application.
 */
export interface LeetCodeProblem {
    id: string;
    title: string;
    difficulty: "Easy" | "Medium" | "Hard";
    link: string;
    tags: string[];
    companyId: string; // ID of the company this problem is primarily associated with in *this* app
    companySlug: string; // Slug of the company this problem is primarily associated with
    problemCompanyName?: string; // Denormalized company name
    slug: string; // Problem's own slug
    lastAskedPeriod?: LastAskedPeriod;
    normalizedTitle: string;
    // Optional fields for UI, augmented after fetching user-specific data
    isBookmarked?: boolean;
    currentStatus?: ProblemStatus;
}

/**
 * @description Represents a company entity in the application.
 */
export interface Company {
    id: string;
    name: string;
    normalizedName?: string;
    slug: string;
    logo?: string;
    description?: string;
    website?: string;
    problemCount?: number; // Denormalized count of problems
    // Denormalized problem statistics
    difficultyCounts?: { Easy: number; Medium: number; Hard: number };
    recencyCounts?: {
        last_30_days: number;
        within_3_months: number;
        within_6_months: number;
        older_than_6_months: number;
    };
    commonTags?: Array<{ tag: string; count: number }>;
    statsLastUpdatedAt?: Date; // Timestamp of when these stats were last updated
}

/**
 * @description Input structure for AI flows that process LeetCode problem details.
 */
export interface AIProblemInput {
    title: string;
    slug: string; // Slug for the problem
    difficulty: "Easy" | "Medium" | "Hard";
    link: string;
    tags: string[];
}

// --- Types for Find Similar Questions Flow ---
/**
 * @description Represents the current problem's details for the similar questions AI flow.
 */
export interface CurrentProblemInput {
    // This might be less used if flow exports its Zod type
    title: string;
    difficulty: "Easy" | "Medium" | "Hard";
    tags: string[];
    slug?: string;
}

/**
 * @description Detailed information about a problem identified as similar by the AI.
 * This is used by components like SimilarProblemsDialog.
 */
export interface SimilarProblemDetail {
    title: string;
    difficulty?: "Easy" | "Medium" | "Hard"; // Optional as AI might not always know
    platform: string; // e.g., "LeetCode", "CodingNinjas"
    link: string;
    tags?: string[]; // Optional as AI might not always know
    similarityReason: string;
}

/**
 * @description Output structure for the "Find Similar Questions" AI flow, used by components.
 */
export interface FindSimilarQuestionsOutput {
    similarProblems: SimilarProblemDetail[];
}

// --- Types for Mock Interview Flow ---
/**
 * @description Represents a message in a chat conversation.
 */
export interface ChatMessage {
    role: "user" | "model";
    content: string;
}

/**
 * @description Input structure for the "Mock Interview" AI flow.
 */
export interface MockInterviewInput {
    problemTitle: string;
    problemDifficulty: "Easy" | "Medium" | "Hard";
    problemDescription: string;
    problemTags: string[];
    conversationHistory: ChatMessage[];
    currentUserMessage: string;
    // Optional user background
    educationHistory?: EducationExperience[];
    workHistory?: WorkExperience[];
}

/**
 * @description Output structure for the "Mock Interview" AI flow.
 */
export interface MockInterviewOutput {
    interviewerResponse: string;
    feedback?: {
        solutionAssessment?: string;
        correctnessDetails?: string;
        timeComplexity?: string;
        spaceComplexity?: string;
        alternativeApproaches?: string[];
        codeQualitySuggestions?: string;
    };
    suggestedFollowUps?: string[];
}

// --- Types for Flashcard Generation Flow ---
/**
 * @description Represents a single flashcard with a front and back.
 */
export interface Flashcard {
    front: string;
    back: string;
}

/**
 * @description Input structure for problem details used in flashcard generation.
 */
export interface FlashcardProblemInput {
    title: string;
    difficulty: "Easy" | "Medium" | "Hard";
    tags: string[];
    lastAskedPeriod?: LastAskedPeriod;
}

/**
 * @description Input structure for the "Generate Flashcards" AI flow.
 */
export interface GenerateFlashcardsInput {
    companyName: string;
    problems: FlashcardProblemInput[];
}

/**
 * @description Output structure for the "Generate Flashcards" AI flow.
 */
export interface GenerateFlashcardsOutput {
    flashcards: Flashcard[];
}

// --- User Experience Types ---
/**
 * @description Zod schema for validating education experience data.
 */
export const EducationExperienceSchema = z.object({
    id: z.string().optional(), // Firestore document ID, optional for new entries
    degree: z.string().min(2, "Degree is required."),
    major: z.string().min(2, "Major is required."),
    school: z.string().min(2, "School name is required."),
    graduationYear: z
        .string()
        .regex(/^\d{4}$/, "Invalid year format (YYYY).")
        .optional()
        .or(z.literal("")),
    gpa: z.string().optional().or(z.literal("")), // Keep as string to allow various formats or N/A
});
/**
 * @description Represents a user's educational experience.
 */
export type EducationExperience = z.infer<typeof EducationExperienceSchema>;

/**
 * @description Zod schema for validating work experience data.
 */
export const WorkExperienceSchema = z.object({
    id: z.string().optional(), // Firestore document ID
    jobTitle: z.string().min(2, "Job title is required."),
    companyName: z.string().min(2, "Company name is required."),
    startDate: z
        .string()
        .min(4, "Start date is required (e.g., YYYY or MM/YYYY)."), // Keep as string for flexibility
    endDate: z.string().optional().or(z.literal("")), // Optional, string for flexibility (e.g., "Present", YYYY, MM/YYYY)
    responsibilities: z
        .string()
        .min(10, "Please describe some responsibilities.")
        .optional()
        .or(z.literal("")),
});
/**
 * @description Represents a user's work experience.
 */
export type WorkExperience = z.infer<typeof WorkExperienceSchema>;

// --- Types for Company Strategy Generation Flow ---
/**
 * @description Represents the target role level for company-specific strategy generation.
 */
export type TargetRoleLevel =
    | "internship"
    | "new_grad"
    | "experienced"
    | "general";

/**
 * @description Options for selecting the target role level in UI elements.
 */
export const targetRoleLevelOptions: ReadonlyArray<{
    value: TargetRoleLevel;
    label: string;
}> = [
    { value: "general", label: "General Advice" },
    { value: "internship", label: "Internship" },
    { value: "new_grad", label: "New Grad" },
    { value: "experienced", label: "Experienced Professional" },
] as const;

/**
 * @description Input structure for problem details used in company strategy generation.
 */
export interface CompanyStrategyProblemInput {
    title: string;
    difficulty: "Easy" | "Medium" | "Hard";
    tags: string[];
    lastAskedPeriod?: LastAskedPeriod;
}

/**
 * @description Input structure for the "Generate Company Strategy" AI flow.
 */
export interface GenerateCompanyStrategyInput {
    companyName: string;
    problems: CompanyStrategyProblemInput[];
    targetRoleLevel?: TargetRoleLevel;
    educationHistory?: EducationExperience[];
    workHistory?: WorkExperience[];
}

/**
 * @description Zod schema for a key topic to focus on.
 */
export const FocusTopicSchema = z.object({
    topic: z
        .string()
        .describe(
            "A key topic or concept to focus on (e.g., 'Dynamic Programming', 'Graph Traversal', 'System Design Fundamentals for Scalability')."
        ),
    reason: z
        .string()
        .describe(
            "A brief explanation (1-2 sentences) of why this topic is particularly relevant for interviews at this company, based on the provided problem data and target role level if specified."
        ),
});
/**
 * @description Represents a key topic to focus on for interview preparation.
 */
export type FocusTopic = z.infer<typeof FocusTopicSchema>;

/**
 * @description Zod schema for a single actionable item in a strategy todo list.
 */
export const StrategyTodoItemSchema = z.object({
    text: z
        .string()
        .describe(
            "A single, concise, actionable task for the user to complete."
        ),
    isCompleted: z
        .boolean()
        .default(false)
        .describe("Whether the task is completed. Defaults to false."),
});
/**
 * @description Represents a single actionable item in a strategy to-do list.
 */
export type StrategyTodoItem = z.infer<typeof StrategyTodoItemSchema>;

/**
 * @description Output structure for the "Generate Company Strategy" AI flow.
 */
export interface GenerateCompanyStrategyOutput {
    preparationStrategy: string;
    focusTopics: FocusTopic[];
    todoItems: StrategyTodoItem[];
}

// --- User Authentication and Profile Types ---
/**
 * @description Represents a user's profile information stored in Firestore.
 */
export interface UserProfile {
    uid: string;
    email: string | null;
    displayName: string | null;
    createdAt: Date; // Or Firestore Timestamp if directly from DB
    // educationHistory and workHistory will be fetched from subcollections
}

/**
 * @description Defines the shape of the authentication context.
 */
export interface AuthContextType {
    /** The currently authenticated Firebase user object, or null if not logged in. */
    user: FirebaseUser | null;
    /** Boolean indicating if the authentication state is still being loaded. */
    loading: boolean;
    /** Boolean indicating if the user's profile has been synced with Firestore during the current session. */
    isUserProfileSynced: boolean;
    /** Function to trigger a profile sync with Firestore if needed. */
    syncUserProfileIfNeeded: (firebaseUser: FirebaseUser) => Promise<void>;
}

/**
 * @description Information stored for each bookmarked problem, including slugs for link generation.
 */
export interface BookmarkedProblemInfo {
    problemId: string;
    companySlug: string;
    problemSlug: string;
    bookmarkedAt?: Date; // Or Firestore Timestamp
}

// --- Types for Personalized Progress Tracking ---
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
 * @description Information stored for each problem a user has marked with a status.
 */
export interface UserProblemStatusInfo {
    problemId: string; // Not explicitly stored as key is problemId, but useful for type clarity
    status: ProblemStatus;
    companySlug: string;
    problemSlug: string;
    updatedAt?: Date; // Or Firestore Timestamp
}

// --- Types for AI Problem Insights Flow ---
/**
 * @description Input structure for the "Generate Problem Insights" AI flow.
 */
export interface GenerateProblemInsightsInput {
    title: string;
    difficulty: "Easy" | "Medium" | "Hard";
    tags: string[];
    problemDescription: string;
}

/**
 * @description Output structure for the "Generate Problem Insights" AI flow.
 */
export interface GenerateProblemInsightsOutput {
    keyConcepts: string[];
    commonDataStructures: string[];
    commonAlgorithms: string[];
    highLevelHint: string;
}

/**
 * @description Represents a saved strategy todo list for a user and a company.
 * This now also includes the preparation strategy and focus topics.
 */
export interface SavedStrategyTodoList {
    companyId: string; // The ID of the company this list is for
    companyName: string;
    savedAt: Date; // Or Firestore Timestamp
    preparationStrategy: string;
    focusTopics: FocusTopic[];
    items: StrategyTodoItem[]; // 'items' is used for the todo list for consistency with previous naming
}

// --- Types for Problem List Pagination & Filtering ---
/**
 * @description Represents the difficulty filter options for a problem list.
 */
export type DifficultyFilter = "all" | LeetCodeProblem["difficulty"];
/**
 * @description Represents the sorting options for a problem list.
 */
export type SortKey = "title" | "difficulty" | "lastAsked";
/**
 * @description Represents the last asked filter options for a problem list.
 */
export type LastAskedFilter = "all" | LastAskedPeriod;
/**
 * @description Represents the status filter options for a problem list.
 */
export type StatusFilter = ProblemStatus | "all";

/**
 * @description Represents the combined filter and sort state for a problem list.
 */
export interface ProblemListFilters {
    difficultyFilter: DifficultyFilter;
    lastAskedFilter: LastAskedFilter;
    statusFilter: StatusFilter;
    searchTerm: string;
    sortKey: SortKey;
}

/**
 * @description Represents the response structure for a paginated list of problems.
 */
export interface PaginatedProblemsResponse {
    problems: LeetCodeProblem[];
    totalProblems: number;
    hasMore?: boolean;
    nextCursor?: string;
}

/**
 * @description Props for the FeatureCard component.
 */
export interface FeatureCardProps {
    icon: any; // Accept any to allow passing icon component type
    title: string;
    description: string;
}

/**
 * @description Props for the StatItem component.
 */
export interface StatItemProps {
    number: string;
    label: string;
}

/**
 * @description Represents a feature of the application.
 */
export interface Feature {
    icon: any; // Accept any to allow passing icon component type
    title: string;
    description: string;
}

/**
 * @description Represents a statistic about the application.
 */
export interface Stat {
    number: string;
    label: string;
}

// --- Types for Job Application Tracking ---
/**
 * @description Zod schema for the status of a job application.
 */
export const JobApplicationStatusSchema = z.enum([
    "Applied",
    "Interviewing",
    "Offer",
    "Rejected",
    "Wishlist",
]);
/**
 * @description Represents the status of a job application.
 */
export type JobApplicationStatus = z.infer<typeof JobApplicationStatusSchema>;

/**
 * @description Zod schema for a job application.
 */
export const JobApplicationSchema = z.object({
    id: z.string().optional(), // Firestore document ID
    userId: z.string(),
    companyName: z.string().min(1, "Company name is required."),
    jobTitle: z.string().min(1, "Job title is required."),
    location: z.string().optional(),
    salary: z.string().optional(),
    status: JobApplicationStatusSchema,
    appliedDate: z.date().optional(),
    url: z.string().url("Please enter a valid URL.").optional().or(z.literal("")),
    notes: z.string().optional(),
    createdAt: z.date().optional(),
    updatedAt: z.date().optional(),
});

/**
 * @description Represents a job application.
 */
export type JobApplication = z.infer<typeof JobApplicationSchema>;

/**
 * @description Options for selecting the job application status in UI elements.
 */
export const JOB_APPLICATION_STATUS_OPTIONS: ReadonlyArray<{
    value: JobApplicationStatus;
    label: string;
}> = [
    { value: "Wishlist", label: "Wishlist" },
    { value: "Applied", label: "Applied" },
    { value: "Interviewing", label: "Interviewing" },
    { value: "Offer", label: "Offer" },
    { value: "Rejected", label: "Rejected" },
] as const;
