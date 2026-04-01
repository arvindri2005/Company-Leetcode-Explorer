/**
 * User Repository
 * Main repository that orchestrates user-related data access operations
 * Implements IUserRepository interface for dependency injection
 */

import { type User as UserEntity } from "@/core/domain/entities/user.entity";
import type { PaginatedResult, PaginationParams } from "@/shared/interfaces";
import type {
  BookmarkedProblemInfo,
  EducationExperience,
  GenerateCompanyStrategyOutput,
  ProblemStatus,
  SavedStrategyTodoList,
  UserProblemStatusInfo,
  WorkExperience,
} from "@/shared/types";

import type {
  CreateUserDTO,
  IUserRepository,
  UpdateUserDTO,
  UserGlobalProblemStats,
} from "../interfaces/user.repository.interface";

// Import extracted modules
import { BookmarkOperationsImpl } from "./bookmarks/bookmark-operations";
import { BookmarkQueriesImpl } from "./bookmarks/bookmark-queries";
import { EducationOperationsImpl } from "./education/education-operations";
import { EducationValidatorsImpl } from "./education/education-validators";
import { StatusOperationsImpl } from "./problem-statuses/status-operations";
import { StatusQueriesImpl } from "./problem-statuses/status-queries";
import { SharedValidatorsImpl } from "./shared/validators";
import { StrategyOperationsImpl } from "./strategies/strategy-operations";
import { StrategyQueriesImpl } from "./strategies/strategy-queries";
import { UserOperationsImpl } from "./user/user-operations";
import { UserQueriesImpl } from "./user/user-queries";
import { UserValidatorsImpl } from "./user/user-validators";
import { ExperienceOperationsImpl } from "./work-experience/experience-operations";
import { ExperienceValidatorsImpl } from "./work-experience/experience-validators";

/**
 * Repository for User-related data access.
 * Implements IUserRepository interface for dependency injection
 */
export class UserRepository implements IUserRepository {
  // Injected dependencies
  private userOperations: UserOperationsImpl;
  private userQueries: UserQueriesImpl;
  private userValidators: UserValidatorsImpl;
  private bookmarkOperations: BookmarkOperationsImpl;
  private bookmarkQueries: BookmarkQueriesImpl;
  private statusOperations: StatusOperationsImpl;
  private statusQueries: StatusQueriesImpl;
  private educationOperations: EducationOperationsImpl;
  private educationValidators: EducationValidatorsImpl;
  private experienceOperations: ExperienceOperationsImpl;
  private experienceValidators: ExperienceValidatorsImpl;
  private strategyOperations: StrategyOperationsImpl;
  private strategyQueries: StrategyQueriesImpl;
  private sharedValidators: SharedValidatorsImpl;

  constructor() {
    // Initialize all module dependencies
    this.userValidators = new UserValidatorsImpl();
    this.userOperations = new UserOperationsImpl(this.userValidators);
    this.userQueries = new UserQueriesImpl();
    this.bookmarkOperations = new BookmarkOperationsImpl();
    this.bookmarkQueries = new BookmarkQueriesImpl();
    this.statusOperations = new StatusOperationsImpl();
    this.statusQueries = new StatusQueriesImpl();
    this.educationOperations = new EducationOperationsImpl();
    this.educationValidators = new EducationValidatorsImpl();
    this.experienceOperations = new ExperienceOperationsImpl();
    this.experienceValidators = new ExperienceValidatorsImpl();
    this.strategyOperations = new StrategyOperationsImpl();
    this.strategyQueries = new StrategyQueriesImpl();
    this.sharedValidators = new SharedValidatorsImpl();
  }

  /**
   * Find a user by their unique identifier
   * @param id - The user's unique identifier (uid)
   * @returns The User entity if found, null otherwise
   */
  async findById(id: string): Promise<UserEntity | null> {
    return this.userOperations.findById(id);
  }

  /**
   * Find all users with optional pagination
   * @param params - Optional pagination parameters
   * @returns Paginated result containing User entities
   */
  async findAll(params?: PaginationParams): Promise<PaginatedResult<UserEntity>> {
    return this.userQueries.findAll(params);
  }

  /**
   * Save a new user
   * @param data - The data to create the user with
   * @returns The created User entity
   */
  async save(data: CreateUserDTO): Promise<UserEntity> {
    return this.userOperations.save(data);
  }

  /**
   * Update an existing user
   * @param id - The user's unique identifier
   * @param data - The data to update
   * @returns The updated User entity
   */
  async update(id: string, data: UpdateUserDTO): Promise<UserEntity> {
    if (!this.userValidators.isAuthorized(id)) {
      throw new Error("Unauthorized access to user profile.");
    }
    return this.userOperations.update(id, data);
  }

  /**
   * Delete a user by their unique identifier
   * @param id - The user's unique identifier
   */
  async delete(id: string): Promise<void> {
    if (!this.userValidators.isAuthorized(id)) {
      throw new Error("Unauthorized access to user profile.");
    }
    return this.userOperations.delete(id);
  }

  /**
   * Check if a user exists by their unique identifier
   * @param id - The user's unique identifier
   * @returns True if the user exists, false otherwise
   */
  async exists(id: string): Promise<boolean> {
    return this.userOperations.exists(id);
  }

  /**
   * Get bookmarked problems info for a user
   * @param userId - The user's unique identifier
   * @returns Array of bookmarked problem info
   */
  async getBookmarkedProblemsInfo(userId: string): Promise<BookmarkedProblemInfo[]> {
    if (!this.userValidators.isAuthorized(userId)) {
      return [];
    }
    return this.bookmarkOperations.getBookmarkedProblemsInfo(userId);
  }

  /**
   * Get user's global problem stats
   * @param userId - The user's unique identifier
   * @returns User's global problem stats
   */
  async getUserGlobalProblemStats(userId: string): Promise<UserGlobalProblemStats> {
    if (!this.userValidators.isAuthorized(userId)) {
      return { solvedProblemIds: [], attemptedProblemIds: [], bookmarkedProblemIds: [] };
    }
    return this.statusOperations.getUserGlobalProblemStats(userId);
  }

  /**
   * Get all problem statuses for a user
   * @param userId - The user's unique identifier
   * @returns Record of problem ID to status info
   */
  async getAllUserProblemStatuses(
    userId: string
  ): Promise<Record<string, UserProblemStatusInfo>> {
    if (!this.userValidators.isAuthorized(userId)) {
      return {};
    }
    return this.statusOperations.getAllUserProblemStatuses(userId);
  }

  /**
   * Get problem statuses for specific problem IDs
   * @param userId - The user's unique identifier
   * @param problemIds - Array of problem IDs to fetch statuses for
   * @returns Record of problem ID to status info
   */
  async getProblemStatusesForIds(
    userId: string,
    problemIds: string[]
  ): Promise<Record<string, UserProblemStatusInfo>> {
    if (!this.userValidators.isAuthorized(userId)) {
      return {};
    }
    return this.statusQueries.getProblemStatusesForIds(userId, problemIds);
  }

  /**
   * Get bookmarks for specific problem IDs
   * @param userId - The user's unique identifier
   * @param problemIds - Array of problem IDs to check bookmarks for
   * @returns Set of bookmarked problem IDs
   */
  async getBookmarksForIds(userId: string, problemIds: string[]): Promise<Set<string>> {
    if (!this.userValidators.isAuthorized(userId)) {
      return new Set();
    }
    return this.bookmarkQueries.getBookmarksForIds(userId, problemIds);
  }

  /**
   * Get user's education history
   * @param userId - The user's unique identifier
   * @returns Array of education experiences
   */
  async getUserEducation(userId: string): Promise<EducationExperience[]> {
    if (!this.userValidators.isAuthorized(userId)) {
      return [];
    }
    return this.educationOperations.getUserEducation(userId);
  }

  /**
   * Get user's work experience
   * @param userId - The user's unique identifier
   * @returns Array of work experiences
   */
  async getUserWorkExperience(userId: string): Promise<WorkExperience[]> {
    if (!this.userValidators.isAuthorized(userId)) {
      return [];
    }
    return this.experienceOperations.getUserWorkExperience(userId);
  }

  /**
   * Get user's strategy todo lists
   * @param userId - The user's unique identifier
   * @returns Array of saved strategy todo lists
   */
  async getUserStrategyTodoLists(userId: string): Promise<SavedStrategyTodoList[]> {
    if (!this.userValidators.isAuthorized(userId)) {
      return [];
    }
    return this.strategyQueries.getUserStrategyTodoLists(userId);
  }

  /**
   * Get strategy todo list for a specific company
   * @param userId - The user's unique identifier
   * @param companyId - The company's unique identifier
   * @returns The strategy todo list if found, null otherwise
   */
  async getStrategyTodoListForCompany(
    userId: string,
    companyId: string
  ): Promise<SavedStrategyTodoList | null> {
    if (!this.userValidators.isAuthorized(userId)) {
      return null;
    }
    return this.strategyOperations.getStrategyTodoListForCompany(userId, companyId);
  }

  /**
   * Toggle bookmark status for a problem
   * @param userId - The user's unique identifier
   * @param problemId - The problem's unique identifier
   * @param companySlug - The company's slug
   * @param problemSlug - The problem's slug
   * @returns Result with bookmark status or error
   */
  async toggleBookmarkProblem(
    userId: string,
    problemId: string,
    companySlug: string,
    problemSlug: string
  ): Promise<{ isBookmarked: boolean; error?: string }> {
    if (!this.userValidators.isAuthorized(userId)) {
      return { isBookmarked: false, error: "Unauthorized access to user profile." };
    }
    return this.bookmarkOperations.toggleBookmarkProblem(
      userId,
      problemId,
      companySlug,
      problemSlug
    );
  }

  /**
   * Set problem status for a user
   * @param userId - The user's unique identifier
   * @param problemId - The problem's unique identifier
   * @param status - The new status
   * @param companySlug - The company's slug
   * @param problemSlug - The problem's slug
   * @returns Result indicating success or error
   */
  async setProblemStatus(
    userId: string,
    problemId: string,
    status: ProblemStatus,
    companySlug: string,
    problemSlug: string
  ): Promise<{ success: boolean; error?: string }> {
    if (!this.userValidators.isAuthorized(userId)) {
      return { success: false, error: "Unauthorized access to user profile." };
    }
    return this.statusOperations.setProblemStatus(
      userId,
      problemId,
      status,
      companySlug,
      problemSlug
    );
  }

  /**
   * Update user's display name
   * @param userId - The user's unique identifier
   * @param newDisplayName - The new display name
   * @returns Result indicating success or error
   */
  async updateUserDisplayName(
    userId: string,
    newDisplayName: string
  ): Promise<{ success: boolean; error?: string }> {
    if (!this.userValidators.isAuthorized(userId)) {
      return { success: false, error: "Unauthorized access to user profile." };
    }
    return this.userOperations.updateUserDisplayName(userId, newDisplayName);
  }

  /**
   * Add education experience for a user
   * @param userId - The user's unique identifier
   * @param educationData - The education data to add
   * @returns Result with ID if created, or error
   */
  async addUserEducation(
    userId: string,
    educationData: Omit<EducationExperience, "id">
  ): Promise<{ id: string | null; error?: string }> {
    if (!this.userValidators.isAuthorized(userId)) {
      return { id: null, error: "Unauthorized access to user profile." };
    }

    // Validate data
    const validation = this.educationValidators.validateEducationData(educationData, userId);
    if (!validation.isValid) {
      return { id: null, error: validation.error };
    }

    return this.educationOperations.addUserEducation(userId, educationData);
  }

  /**
   * Add work experience for a user
   * @param userId - The user's unique identifier
   * @param workData - The work experience data to add
   * @returns Result with ID if created, or error
   */
  async addUserWorkExperience(
    userId: string,
    workData: Omit<WorkExperience, "id">
  ): Promise<{ id: string | null; error?: string }> {
    if (!this.userValidators.isAuthorized(userId)) {
      return { id: null, error: "Unauthorized access to user profile." };
    }

    // Validate data
    const validation = this.experienceValidators.validateWorkExperienceData(workData, userId);
    if (!validation.isValid) {
      return { id: null, error: validation.error };
    }

    return this.experienceOperations.addUserWorkExperience(userId, workData);
  }

  /**
   * Save strategy todo list for a company
   * @param userId - The user's unique identifier
   * @param companyId - The company's unique identifier
   * @param companyName - The company's name
   * @param strategyData - The strategy data to save
   * @returns Result indicating success or error
   */
  async saveStrategyTodoList(
    userId: string,
    companyId: string,
    companyName: string,
    strategyData: Pick<
      GenerateCompanyStrategyOutput,
      "preparationStrategy" | "focusTopics" | "todoItems"
    >
  ): Promise<{ success: boolean; error?: string }> {
    if (!this.userValidators.isAuthorized(userId)) {
      return { success: false, error: "Unauthorized access to user profile." };
    }

    const rawData = {
      companyId: companyId,
      companyName: companyName,
      savedAt: new Date(),
      preparationStrategy: strategyData.preparationStrategy,
      focusTopics: strategyData.focusTopics,
      items: strategyData.todoItems,
    };

    // Validate data
    const validation = this.sharedValidators.validateStrategyData(rawData, userId);
    if (!validation.isValid) {
      return { success: false, error: validation.error };
    }

    return this.strategyOperations.saveStrategyTodoList(
      userId,
      companyId,
      companyName,
      strategyData
    );
  }

  /**
   * Update status of a todo item in a strategy list
   * @param userId - The user's unique identifier
   * @param companyId - The company's unique identifier
   * @param itemIndex - The index of the item to update
   * @param isCompleted - The new completion status
   * @returns Result indicating success or error
   */
  async updateStrategyTodoItemStatus(
    userId: string,
    companyId: string,
    itemIndex: number,
    isCompleted: boolean
  ): Promise<{ success: boolean; error?: string }> {
    if (!this.userValidators.isAuthorized(userId)) {
      return { success: false, error: "Unauthorized access to user profile." };
    }
    return this.strategyOperations.updateStrategyTodoItemStatus(
      userId,
      companyId,
      itemIndex,
      isCompleted
    );
  }

  /**
   * Sync user profile from authentication provider
   * @param email - The user's email
   * @param displayName - The user's display name
   * @returns Result indicating success or error
   */
  async syncUserProfile(
    email: string | null,
    displayName: string | null
  ): Promise<{ success: boolean; error?: string }> {
    return this.userOperations.syncUserProfile(email, displayName);
  }
}

export const userRepository = new UserRepository();
