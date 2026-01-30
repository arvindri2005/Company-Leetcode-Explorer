/**
 * User Repository Interface
 * Defines data access operations for User entities
 */

import type { User as UserEntity } from "@/core/domain/entities/user.entity";
import type { IBaseRepository } from "@/shared/interfaces";
import type {
  BookmarkedProblemInfo,
  EducationExperience,
  GenerateCompanyStrategyOutput,
  ProblemStatus,
  SavedStrategyTodoList,
  UserProblemStatusInfo,
  WorkExperience,
} from "@/shared/types";

/**
 * Global problem stats for a user
 */
export interface UserGlobalProblemStats {
  solvedProblemIds: string[];
  attemptedProblemIds: string[];
  bookmarkedProblemIds: string[];
}

/**
 * DTO for creating a new user
 */
export interface CreateUserDTO {
  email: string | null;
  displayName: string | null;
  photoUrl?: string;
  preferences?: {
    theme?: "light" | "dark" | "system";
    emailNotifications?: boolean;
    weeklyDigest?: boolean;
  };
}

/**
 * DTO for updating an existing user
 */
export interface UpdateUserDTO {
  email?: string | null;
  displayName?: string | null;
  photoUrl?: string;
  preferences?: {
    theme?: "light" | "dark" | "system";
    emailNotifications?: boolean;
    weeklyDigest?: boolean;
  };
}

/**
 * User Repository Interface
 * Extends base repository with user-specific operations
 */
export interface IUserRepository extends IBaseRepository<UserEntity, CreateUserDTO, UpdateUserDTO> {
  /**
   * Get bookmarked problems info for a user
   * @param userId - The user's unique identifier
   * @returns Array of bookmarked problem info
   */
  getBookmarkedProblemsInfo(userId: string): Promise<BookmarkedProblemInfo[]>;

  /**
   * Get global problem stats for a user
   * @param userId - The user's unique identifier
   * @returns User's global problem stats
   */
  getUserGlobalProblemStats(userId: string): Promise<UserGlobalProblemStats>;

  /**
   * Get all problem statuses for a user
   * @param userId - The user's unique identifier
   * @returns Record of problem ID to status info
   */
  getAllUserProblemStatuses(userId: string): Promise<Record<string, UserProblemStatusInfo>>;

  /**
   * Get problem statuses for specific problem IDs
   * @param userId - The user's unique identifier
   * @param problemIds - Array of problem IDs to fetch statuses for
   * @returns Record of problem ID to status info
   */
  getProblemStatusesForIds(
    userId: string,
    problemIds: string[]
  ): Promise<Record<string, UserProblemStatusInfo>>;

  /**
   * Get bookmarks for specific problem IDs
   * @param userId - The user's unique identifier
   * @param problemIds - Array of problem IDs to check bookmarks for
   * @returns Set of bookmarked problem IDs
   */
  getBookmarksForIds(userId: string, problemIds: string[]): Promise<Set<string>>;

  /**
   * Get user's education history
   * @param userId - The user's unique identifier
   * @returns Array of education experiences
   */
  getUserEducation(userId: string): Promise<EducationExperience[]>;

  /**
   * Get user's work experience
   * @param userId - The user's unique identifier
   * @returns Array of work experiences
   */
  getUserWorkExperience(userId: string): Promise<WorkExperience[]>;

  /**
   * Get user's strategy todo lists
   * @param userId - The user's unique identifier
   * @returns Array of saved strategy todo lists
   */
  getUserStrategyTodoLists(userId: string): Promise<SavedStrategyTodoList[]>;

  /**
   * Get strategy todo list for a specific company
   * @param userId - The user's unique identifier
   * @param companyId - The company's unique identifier
   * @returns The strategy todo list if found, null otherwise
   */
  getStrategyTodoListForCompany(
    userId: string,
    companyId: string
  ): Promise<SavedStrategyTodoList | null>;

  /**
   * Toggle bookmark status for a problem
   * @param userId - The user's unique identifier
   * @param problemId - The problem's unique identifier
   * @param companySlug - The company's slug
   * @param problemSlug - The problem's slug
   * @returns Result with bookmark status or error
   */
  toggleBookmarkProblem(
    userId: string,
    problemId: string,
    companySlug: string,
    problemSlug: string
  ): Promise<{ isBookmarked: boolean; error?: string }>;

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
  ): Promise<{ success: boolean; error?: string }>;

  /**
   * Update user's display name
   * @param userId - The user's unique identifier
   * @param newDisplayName - The new display name
   * @returns Result indicating success or error
   */
  updateUserDisplayName(
    userId: string,
    newDisplayName: string
  ): Promise<{ success: boolean; error?: string }>;

  /**
   * Add education experience for a user
   * @param userId - The user's unique identifier
   * @param educationData - The education data to add
   * @returns Result with ID if created, or error
   */
  addUserEducation(
    userId: string,
    educationData: Omit<EducationExperience, "id">
  ): Promise<{ id: string | null; error?: string }>;

  /**
   * Add work experience for a user
   * @param userId - The user's unique identifier
   * @param workData - The work experience data to add
   * @returns Result with ID if created, or error
   */
  addUserWorkExperience(
    userId: string,
    workData: Omit<WorkExperience, "id">
  ): Promise<{ id: string | null; error?: string }>;

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
  ): Promise<{ success: boolean; error?: string }>;

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
  ): Promise<{ success: boolean; error?: string }>;

  /**
   * Sync user profile from authentication provider
   * @param email - The user's email
   * @param displayName - The user's display name
   * @returns Result indicating success or error
   */
  syncUserProfile(
    email: string | null,
    displayName: string | null
  ): Promise<{ success: boolean; error?: string }>;
}
