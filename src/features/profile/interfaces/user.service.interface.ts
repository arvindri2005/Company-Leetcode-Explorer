/**
 * User Service Interface
 * Defines business operations for User entities
 */

import type { AppEventHandler,AppEventKey } from "@/services/event-bus";
import type { Result } from "@/shared/types/result";
import type { ServiceError } from "@/shared/types/service-error";
import type {
  BookmarkedProblemInfo,
  EducationExperience,
  GenerateCompanyStrategyOutput,
  ProblemStatus,
  SavedStrategyTodoList,
  UserProblemStatusInfo,
  WorkExperience,
} from "@/types";

import type { UserGlobalProblemStats } from "./user.repository.interface";

/**
 * User Service Interface
 * Defines all business operations for users
 */
export interface IUserService {
  /**
   * Subscribe to user-related events
   * @param event - The event key to subscribe to
   * @param handler - The event handler
   * @returns Unsubscribe function
   */
  subscribe<K extends AppEventKey>(
    event: K,
    handler: AppEventHandler<K>
  ): () => void;

  /**
   * Get bookmarked problems info for a user
   * @param userId - The user's unique identifier
   * @returns Result containing bookmarked problems info or error
   */
  getBookmarkedProblemsInfo(
    userId: string
  ): Promise<Result<BookmarkedProblemInfo[], ServiceError>>;

  /**
   * Get global problem stats for a user
   * @param userId - The user's unique identifier
   * @returns Result containing global problem stats or error
   */
  getUserGlobalProblemStats(
    userId: string
  ): Promise<Result<UserGlobalProblemStats, ServiceError>>;

  /**
   * Get all problem statuses for a user
   * @param userId - The user's unique identifier
   * @returns Result containing problem statuses or error
   */
  getAllUserProblemStatuses(
    userId: string
  ): Promise<Result<Record<string, UserProblemStatusInfo>, ServiceError>>;

  /**
   * Get problem statuses for specific problem IDs
   * @param userId - The user's unique identifier
   * @param problemIds - Array of problem IDs to fetch statuses for
   * @returns Result containing problem statuses or error
   */
  getProblemStatusesForIds(
    userId: string,
    problemIds: string[]
  ): Promise<Result<Record<string, UserProblemStatusInfo>, ServiceError>>;

  /**
   * Get bookmarks for specific problem IDs
   * @param userId - The user's unique identifier
   * @param problemIds - Array of problem IDs to check bookmarks for
   * @returns Result containing set of bookmarked problem IDs or error
   */
  getBookmarksForIds(
    userId: string,
    problemIds: string[]
  ): Promise<Result<Set<string>, ServiceError>>;

  /**
   * Get user's education history
   * @param userId - The user's unique identifier
   * @returns Result containing education experiences or error
   */
  getUserEducation(
    userId: string
  ): Promise<Result<EducationExperience[], ServiceError>>;

  /**
   * Get user's work experience
   * @param userId - The user's unique identifier
   * @returns Result containing work experiences or error
   */
  getUserWorkExperience(
    userId: string
  ): Promise<Result<WorkExperience[], ServiceError>>;

  /**
   * Get user's strategy todo lists
   * @param userId - The user's unique identifier
   * @returns Result containing strategy todo lists or error
   */
  getUserStrategyTodoLists(
    userId: string
  ): Promise<Result<SavedStrategyTodoList[], ServiceError>>;

  /**
   * Get strategy todo list for a specific company
   * @param userId - The user's unique identifier
   * @param companyId - The company's unique identifier
   * @returns Result containing the strategy todo list or error
   */
  getStrategyTodoListForCompany(
    userId: string,
    companyId: string
  ): Promise<Result<SavedStrategyTodoList | null, ServiceError>>;

  /**
   * Toggle bookmark status for a problem
   * @param userId - The user's unique identifier
   * @param problemId - The problem's unique identifier
   * @param companySlug - The company's slug
   * @param problemSlug - The problem's slug
   * @returns Result containing bookmark status or error
   */
  toggleBookmarkProblem(
    userId: string,
    problemId: string,
    companySlug: string,
    problemSlug: string
  ): Promise<Result<{ isBookmarked: boolean }, ServiceError>>;

  /**
   * Set problem status for a user
   * @param userId - The user's unique identifier
   * @param problemId - The problem's unique identifier
   * @param status - The new status
   * @param companySlug - The company's slug
   * @param problemSlug - The problem's slug
   * @returns Result indicating success or error
   */
  setProblemStatus(
    userId: string,
    problemId: string,
    status: ProblemStatus,
    companySlug: string,
    problemSlug: string
  ): Promise<Result<void, ServiceError>>;

  /**
   * Update user's display name
   * @param userId - The user's unique identifier
   * @param newDisplayName - The new display name
   * @returns Result indicating success or error
   */
  updateUserDisplayName(
    userId: string,
    newDisplayName: string
  ): Promise<Result<void, ServiceError>>;

  /**
   * Add education experience for a user
   * @param userId - The user's unique identifier
   * @param educationData - The education data to add
   * @returns Result containing the created ID or error
   */
  addUserEducation(
    userId: string,
    educationData: Omit<EducationExperience, "id">
  ): Promise<Result<{ id: string }, ServiceError>>;

  /**
   * Add work experience for a user
   * @param userId - The user's unique identifier
   * @param workData - The work experience data to add
   * @returns Result containing the created ID or error
   */
  addUserWorkExperience(
    userId: string,
    workData: Omit<WorkExperience, "id">
  ): Promise<Result<{ id: string }, ServiceError>>;

  /**
   * Save strategy todo list for a company
   * @param userId - The user's unique identifier
   * @param companyId - The company's unique identifier
   * @param companyName - The company's name
   * @param strategyData - The strategy data to save
   * @returns Result indicating success or error
   */
  saveStrategyTodoList(
    userId: string,
    companyId: string,
    companyName: string,
    strategyData: Pick<
      GenerateCompanyStrategyOutput,
      "preparationStrategy" | "focusTopics" | "todoItems"
    >
  ): Promise<Result<void, ServiceError>>;

  /**
   * Update status of a todo item in a strategy list
   * @param userId - The user's unique identifier
   * @param companyId - The company's unique identifier
   * @param itemIndex - The index of the item to update
   * @param isCompleted - The new completion status
   * @returns Result indicating success or error
   */
  updateStrategyTodoItemStatus(
    userId: string,
    companyId: string,
    itemIndex: number,
    isCompleted: boolean
  ): Promise<Result<void, ServiceError>>;

  /**
   * Sync user profile from authentication provider
   * @param email - The user's email
   * @param displayName - The user's display name
   * @returns Result indicating success or error
   */
  syncUserProfile(
    email: string | null,
    displayName: string | null
  ): Promise<Result<void, ServiceError>>;
}
