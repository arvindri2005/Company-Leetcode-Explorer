
import type { User as FirebaseUser } from 'firebase/auth';
import { z } from 'zod'; // Import Zod

/**
 * Represents the periods when a LeetCode problem was reportedly last asked.
 */
export type LastAskedPeriod =
  | 'last_30_days'
  | 'within_3_months' // i.e., >30 days ago, up to 3 months ago
  | 'within_6_months' // i.e., >3 months ago, up to 6 months ago
  | 'older_than_6_months';

/**
 * Options for selecting the last asked period in UI elements, with user-friendly labels.
 */
export const lastAskedPeriodOptions: ReadonlyArray<{ value: LastAskedPeriod; label: string }> = [
  { value: 'last_30_days', label: 'In the last 30 days' },
  { value: 'within_3_months', label: 'Within 1-3 months' },
  { value: 'within_6_months', label: 'Within 3-6 months' },
  { value: 'older_than_6_months', label: 'Older than 6 months' },
] as const;

/**
 * Mapping from LastAskedPeriod values to display-friendly strings.
 */
export const lastAskedPeriodDisplayMap: Record<LastAskedPeriod, string> = {
  'last_30_days': 'Last 30 days',
  'within_3_months': '1-3 months ago',
  'within_6_months': '3-6 months ago',
  'older_than_6_months': 'Over 6 months ago',
};

/**
 * Represents a LeetCode problem stored in the application.
 */
export interface LeetCodeProblem {
  id: string;
  title: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
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
 * Represents a company entity in the application.
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
  difficultyCounts?: { Easy: number; Medium: number; Hard: number; };
  recencyCounts?: { last_30_days: number; within_3_months: number; within_6_months: number; older_than_6_months: number; };
  commonTags?: Array<{ tag: string; count: number; }>;
  statsLastUpdatedAt?: Date; // Timestamp of when these stats were last updated
}

/**
 * Input structure for AI flows that process LeetCode problem details.
 */
export interface AIProblemInput {
  title: string;
  slug: string; // Slug for the problem
  difficulty: 'Easy' | 'Medium' | 'Hard';
  link: string;
  tags: string[];
}

// --- Types for Find Similar Questions Flow ---
/**
 * Represents the current problem's details for the similar questions AI flow.
 * This type might be more aligned with the AI flow's internal Zod schema now.
 */
export interface CurrentProblemInput { // This might be less used if flow exports its Zod type
  title: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  tags: string[];
  slug?: string;
}

/**
 * Detailed information about a problem identified as similar by the AI.
 * This is used by components like SimilarProblemsDialog.
 */
export interface SimilarProblemDetail {
  title: string;
  difficulty?: 'Easy' | 'Medium' | 'Hard'; // Optional as AI might not always know
  platform: string; // e.g., "LeetCode", "CodingNinjas"
  link: string;
  tags?: string[]; // Optional as AI might not always know
  similarityReason: string;
}

/**
 * Output structure for the "Find Similar Questions" AI flow, used by components.
 */
export interface FindSimilarQuestionsOutput { // This might be less used if flow exports its Zod type
  similarProblems: SimilarProblemDetail[];
}

// --- Types for Mock Interview Flow ---
/**
 * Represents a message in a chat conversation.
 */
export interface ChatMessage {
  role: 'user' | 'model';
  content: string;
}

/**
 * Input structure for the "Mock Interview" AI flow.
 */
export interface MockInterviewInput {
  problemTitle: string;
  problemDifficulty: 'Easy' | 'Medium' | 'Hard';
  problemDescription: string;
  problemTags: string[];
  conversationHistory: ChatMessage[];
  currentUserMessage: string;
  // Optional user background
  educationHistory?: EducationExperience[];
  workHistory?: WorkExperience[];
}

/**
 * Output structure for the "Mock Interview" AI flow.
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
 * Represents a single flashcard with a front and back.
 */
export interface Flashcard {
  front: string;
  back: string;
}

/**
 * Input structure for problem details used in flashcard generation.
 */
export interface FlashcardProblemInput {
  title: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  tags: string[];
  lastAskedPeriod?: LastAskedPeriod;
}

/**
 * Input structure for the "Generate Flashcards" AI flow.
 */
export interface GenerateFlashcardsInput {
  companyName: string;
  problems: FlashcardProblemInput[];
}

/**
 * Output structure for the "Generate Flashcards" AI flow.
 */
export interface GenerateFlashcardsOutput {
  flashcards: Flashcard[];
}

// --- User Experience Types ---
export const EducationExperienceSchema = z.object({
  id: z.string().optional(), // Firestore document ID, optional for new entries
  degree: z.string().min(2, "Degree is required."),
  major: z.string().min(2, "Major is required."),
  school: z.string().min(2, "School name is required."),
  graduationYear: z.string().regex(/^\d{4}$/, "Invalid year format (YYYY).").optional().or(z.literal('')),
  gpa: z.string().optional().or(z.literal('')), // Keep as string to allow various formats or N/A
});
export type EducationExperience = z.infer<typeof EducationExperienceSchema>;

export const WorkExperienceSchema = z.object({
  id: z.string().optional(), // Firestore document ID
  jobTitle: z.string().min(2, "Job title is required."),
  companyName: z.string().min(2, "Company name is required."),
  startDate: z.string().min(4, "Start date is required (e.g., YYYY or MM/YYYY)."), // Keep as string for flexibility
  endDate: z.string().optional().or(z.literal('')), // Optional, string for flexibility (e.g., "Present", YYYY, MM/YYYY)
  responsibilities: z.string().min(10, "Please describe some responsibilities.").optional().or(z.literal('')),
});
export type WorkExperience = z.infer<typeof WorkExperienceSchema>;


// --- Types for Company Strategy Generation Flow ---
/**
 * Represents the target role level for company-specific strategy generation.
 */
export type TargetRoleLevel = 'internship' | 'new_grad' | 'experienced' | 'general';

/**
 * Options for selecting the target role level in UI elements.
 */
export const targetRoleLevelOptions: ReadonlyArray<{ value: TargetRoleLevel; label: string }> = [
  { value: 'general', label: 'General Advice' },
  { value: 'internship', label: 'Internship' },
  { value: 'new_grad', label: 'New Grad' },
  { value: 'experienced', label: 'Experienced Professional' },
] as const;

/**
 * Input structure for problem details used in company strategy generation.
 */
export interface CompanyStrategyProblemInput {
  title: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  tags: string[];
  lastAskedPeriod?: LastAskedPeriod;
}

/**
 * Input structure for the "Generate Company Strategy" AI flow.
 */
export interface GenerateCompanyStrategyInput {
  companyName: string;
  problems: CompanyStrategyProblemInput[];
  targetRoleLevel?: TargetRoleLevel;
  educationHistory?: EducationExperience[];
  workHistory?: WorkExperience[];
}

/**
 * Zod schema for a key topic to focus on.
 */
export const FocusTopicSchema = z.object({
  topic: z.string().describe("A key topic or concept to focus on (e.g., 'Dynamic Programming', 'Graph Traversal', 'System Design Fundamentals for Scalability')."),
  reason: z.string().describe("A brief explanation (1-2 sentences) of why this topic is particularly relevant for interviews at this company, based on the provided problem data and target role level if specified."),
});
export type FocusTopic = z.infer<typeof FocusTopicSchema>;


/**
 * Zod schema for a single actionable item in a strategy todo list.
 */
export const StrategyTodoItemSchema = z.object({
  text: z.string().describe("A single, concise, actionable task for the user to complete."),
  isCompleted: z.boolean().default(false).describe("Whether the task is completed. Defaults to false."),
});
export type StrategyTodoItem = z.infer<typeof StrategyTodoItemSchema>;

/**
 * Output structure for the "Generate Company Strategy" AI flow.
 */
export interface GenerateCompanyStrategyOutput {
  preparationStrategy: string;
  focusTopics: FocusTopic[];
  todoItems: StrategyTodoItem[];
}

// --- User Authentication and Profile Types ---
/**
 * Represents a user's profile information stored in Firestore.
 */
export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  createdAt: Date; // Or Firestore Timestamp if directly from DB
  // educationHistory and workHistory will be fetched from subcollections
}

/**
 * Defines the shape of the authentication context.
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


/** Information stored for each bookmarked problem, including slugs for link generation. */
export interface BookmarkedProblemInfo {
  problemId: string;
  companySlug: string;
  problemSlug: string;
  bookmarkedAt?: Date; // Or Firestore Timestamp
}

// --- Types for Personalized Progress Tracking ---
/**
 * Represents the status of a user's progress on a problem.
 * 'none' indicates no status has been set or it has been cleared.
 */
export type ProblemStatus = 'solved' | 'attempted' | 'todo' | 'none';

/**
 * Options for selecting problem status in UI elements.
 */
export const PROBLEM_STATUS_OPTIONS: ReadonlyArray<{ value: ProblemStatus; label: string; description: string }> = [
  { value: 'none', label: 'No Status', description: 'Clear current status.' },
  { value: 'todo', label: 'To-Do', description: 'Mark as planned to solve.' },
  { value: 'attempted', label: 'Attempted', description: 'Mark as attempted but not fully solved.' },
  { value: 'solved', label: 'Solved', description: 'Mark as successfully solved.' },
] as const;

/**
 * Display properties (label, icon, color) for each problem status (excluding 'none').
 */
export const PROBLEM_STATUS_DISPLAY: Record<Exclude<ProblemStatus, 'none'>, { label: string; iconName?: string; colorClass?: string }> = {
  solved: { label: 'Solved', iconName: 'CheckCircle2', colorClass: 'text-green-500' },
  attempted: { label: 'Attempted', iconName: 'Pencil', colorClass: 'text-yellow-500' },
  todo: { label: 'To-Do', iconName: 'ListTodo', colorClass: 'text-blue-500' },
};

/**
 * Information stored for each problem a user has marked with a status.
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
 * Input structure for the "Generate Problem Insights" AI flow.
 */
export interface GenerateProblemInsightsInput {
  title: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  tags: string[];
  problemDescription: string;
}

/**
 * Output structure for the "Generate Problem Insights" AI flow.
 */
export interface GenerateProblemInsightsOutput {
  keyConcepts: string[];
  commonDataStructures: string[];
  commonAlgorithms: string[];
  highLevelHint: string;
}

/**
 * Represents a saved strategy todo list for a user and a company.
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
export type DifficultyFilter = 'all' | LeetCodeProblem['difficulty'];
export type SortKey = 'title' | 'difficulty' | 'lastAsked';
export type LastAskedFilter = 'all' | LastAskedPeriod;
export type StatusFilter = ProblemStatus | 'all';

export interface ProblemListFilters {
  difficultyFilter: DifficultyFilter;
  lastAskedFilter: LastAskedFilter;
  statusFilter: StatusFilter;
  searchTerm: string;
  sortKey: SortKey;
}

export interface PaginatedProblemsResponse {
  problems: LeetCodeProblem[];
  totalProblems: number;
  totalPages: number;
  currentPage: number;
}

    