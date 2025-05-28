
import type { User as FirebaseUser } from 'firebase/auth';

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
  companyId: string;
  lastAskedPeriod?: LastAskedPeriod;
  normalizedTitle: string;
}

/**
 * Represents a company entity in the application.
 */
export interface Company {
  id: string;
  name: string;
  normalizedName?: string;
  logo?: string;
  description?: string;
  website?: string;
}

/**
 * Input structure for AI flows that process LeetCode problem details.
 */
export interface AIProblemInput {
  title: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  link: string;
  tags: string[];
}

// --- Types for Find Similar Questions Flow ---
/**
 * Represents the current problem's details for the similar questions AI flow.
 */
export interface CurrentProblemInput {
  title: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  tags: string[];
}

/**
 * Represents a candidate problem's details for the similar questions AI flow.
 */
export interface CandidateProblemInput {
  id: string;
  title: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  tags: string[];
  link: string;
}

/**
 * Detailed information about a problem identified as similar by the AI.
 */
export interface SimilarProblemDetail {
  title: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  link: string;
  tags: string[];
  similarityReason: string;
}

/**
 * Output structure for the "Find Similar Questions" AI flow.
 */
export interface FindSimilarQuestionsOutput {
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
}

/**
 * Represents a key topic to focus on, including a reason for its importance.
 */
export interface FocusTopic {
  topic: string;
  reason: string;
}

/**
 * Output structure for the "Generate Company Strategy" AI flow.
 */
export interface GenerateCompanyStrategyOutput {
  preparationStrategy: string;
  focusTopics: FocusTopic[];
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

/**
 * Represents a bookmarked problem by a user.
 */
export interface BookmarkedProblem {
  problemId: string;
  bookmarkedAt: Date; // Or Firestore Timestamp
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
 * Represents a user's progress status for a specific problem.
 * The 'none' status is typically represented by the absence of a record in the database.
 */
export interface UserProblemStatus {
  problemId: string;
  status: Exclude<ProblemStatus, 'none'>;
  updatedAt: Date; // Or Firestore Timestamp
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
