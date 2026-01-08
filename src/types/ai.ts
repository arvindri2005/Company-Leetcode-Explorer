import { z } from "zod";
import type { EducationExperience, WorkExperience } from "./user";
import type { LastAskedPeriod } from ".";

// --- Types for AI General Inputs ---
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
      "A key topic or concept to focus on (e.g., 'Dynamic Programming', 'Graph Traversal', 'System Design Fundamentals for Scalability').",
    ),
  reason: z
    .string()
    .describe(
      "A brief explanation (1-2 sentences) of why this topic is particularly relevant for interviews at this company, based on the provided problem data and target role level if specified.",
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
    .describe("A single, concise, actionable task for the user to complete."),
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






