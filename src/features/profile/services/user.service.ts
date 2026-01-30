import { cache } from "react";

import { Logger } from "@/shared/lib/utils/logger";
import { SimpleLRUCache } from "@/shared/lib/utils/lru-cache";
import { type AppEventHandler, type AppEventKey, appEvents } from "@/shared/services/event-bus";
import {
  type BookmarkedProblemInfo,
  type EducationExperience,
  type GenerateCompanyStrategyOutput,
  type ProblemStatus,
  type SavedStrategyTodoList,
  type UserProblemStatusInfo,
  type WorkExperience,
} from "@/shared/types";
import { failure, type Result, success } from "@/shared/types/result";
import type { ServiceError } from "@/shared/types/service-error";

import type { IUserRepository, UserGlobalProblemStats } from "../interfaces/user.repository.interface";
import type { IUserService } from "../interfaces/user.service.interface";
import { userRepository } from "../repositories/user.repository";

interface CachedGlobalStats {
  solvedProblemIds: string[];
  attemptedProblemIds: string[];
  bookmarkedProblemIds: string[];
}

/**
 * User Service Implementation
 * Implements IUserService interface for dependency injection
 */
export class UserService implements IUserService {
  private globalStatsCache = new SimpleLRUCache<CachedGlobalStats>(1000, 5 * 60 * 1000); // 1000 items, 5 mins TTL

  constructor(
    private readonly repository: IUserRepository = userRepository
  ) {}

  /**
   * Subscribe to user-related events.
   */
  subscribe<K extends AppEventKey>(event: K, handler: AppEventHandler<K>) {
    return appEvents.subscribe(event, handler);
  }

  async getBookmarkedProblemsInfo(
    userId: string
  ): Promise<Result<BookmarkedProblemInfo[], ServiceError>> {
    try {
      const bookmarks = await this.repository.getBookmarkedProblemsInfo(userId);
      return success(bookmarks);
    } catch (error) {
      Logger.error("Failed to fetch bookmarked problems", error, { userId });
      return failure({
        code: "INTERNAL_ERROR",
        message: "Failed to fetch bookmarked problems",
        cause: error instanceof Error ? error : undefined,
      });
    }
  }

  async getUserGlobalProblemStats(
    userId: string
  ): Promise<Result<UserGlobalProblemStats, ServiceError>> {
    try {
      const cached = this.globalStatsCache.get(userId);

      if (cached) {
        // Return a copy to prevent mutation of the cache by consumers
        return success({
          solvedProblemIds: [...cached.solvedProblemIds],
          attemptedProblemIds: [...cached.attemptedProblemIds],
          bookmarkedProblemIds: [...cached.bookmarkedProblemIds],
        });
      }

      const data = await this.repository.getUserGlobalProblemStats(userId);
      
      this.globalStatsCache.set(userId, data);
      
      // Return a copy even on fresh fetch to be consistent
      return success({
        solvedProblemIds: [...data.solvedProblemIds],
        attemptedProblemIds: [...data.attemptedProblemIds],
        bookmarkedProblemIds: [...data.bookmarkedProblemIds],
      });
    } catch (error) {
      Logger.error("Failed to fetch user global problem stats", error, { userId });
      return failure({
        code: "INTERNAL_ERROR",
        message: "Failed to fetch user global problem stats",
        cause: error instanceof Error ? error : undefined,
      });
    }
  }

  async getAllUserProblemStatuses(
    userId: string
  ): Promise<Result<Record<string, UserProblemStatusInfo>, ServiceError>> {
    try {
      const statuses = await this.repository.getAllUserProblemStatuses(userId);
      return success(statuses);
    } catch (error) {
      Logger.error("Failed to fetch all user problem statuses", error, { userId });
      return failure({
        code: "INTERNAL_ERROR",
        message: "Failed to fetch all user problem statuses",
        cause: error instanceof Error ? error : undefined,
      });
    }
  }

  async getProblemStatusesForIds(
    userId: string,
    problemIds: string[]
  ): Promise<Result<Record<string, UserProblemStatusInfo>, ServiceError>> {
    try {
      const statuses = await this.repository.getProblemStatusesForIds(userId, problemIds);
      return success(statuses);
    } catch (error) {
      Logger.error("Failed to fetch problem statuses for IDs", error, { userId, count: problemIds.length });
      return failure({
        code: "INTERNAL_ERROR",
        message: "Failed to fetch problem statuses for IDs",
        cause: error instanceof Error ? error : undefined,
      });
    }
  }

  async getBookmarksForIds(
    userId: string,
    problemIds: string[]
  ): Promise<Result<Set<string>, ServiceError>> {
    try {
      const bookmarks = await this.repository.getBookmarksForIds(userId, problemIds);
      return success(bookmarks);
    } catch (error) {
      Logger.error("Failed to fetch bookmarks for IDs", error, { userId, count: problemIds.length });
      return failure({
        code: "INTERNAL_ERROR",
        message: "Failed to fetch bookmarks for IDs",
        cause: error instanceof Error ? error : undefined,
      });
    }
  }

  async getUserEducation(
    userId: string
  ): Promise<Result<EducationExperience[], ServiceError>> {
    try {
      const education = await this.repository.getUserEducation(userId);
      return success(education);
    } catch (error) {
      Logger.error("Failed to fetch user education", error, { userId });
      return failure({
        code: "INTERNAL_ERROR",
        message: "Failed to fetch user education",
        cause: error instanceof Error ? error : undefined,
      });
    }
  }

  async getUserWorkExperience(
    userId: string
  ): Promise<Result<WorkExperience[], ServiceError>> {
    try {
      const workExperience = await this.repository.getUserWorkExperience(userId);
      return success(workExperience);
    } catch (error) {
      Logger.error("Failed to fetch user work experience", error, { userId });
      return failure({
        code: "INTERNAL_ERROR",
        message: "Failed to fetch user work experience",
        cause: error instanceof Error ? error : undefined,
      });
    }
  }

  async getUserStrategyTodoLists(
    userId: string
  ): Promise<Result<SavedStrategyTodoList[], ServiceError>> {
    try {
      const todoLists = await this.repository.getUserStrategyTodoLists(userId);
      return success(todoLists);
    } catch (error) {
      Logger.error("Failed to fetch user strategy todo lists", error, { userId });
      return failure({
        code: "INTERNAL_ERROR",
        message: "Failed to fetch user strategy todo lists",
        cause: error instanceof Error ? error : undefined,
      });
    }
  }

  async getStrategyTodoListForCompany(
    userId: string,
    companyId: string
  ): Promise<Result<SavedStrategyTodoList | null, ServiceError>> {
    try {
      const todoList = await this.repository.getStrategyTodoListForCompany(userId, companyId);
      return success(todoList);
    } catch (error) {
      Logger.error("Failed to fetch strategy todo list for company", error, { userId, companyId });
      return failure({
        code: "INTERNAL_ERROR",
        message: "Failed to fetch strategy todo list for company",
        details: { companyId },
        cause: error instanceof Error ? error : undefined,
      });
    }
  }

  async toggleBookmarkProblem(
    userId: string,
    problemId: string,
    companySlug: string,
    problemSlug: string
  ): Promise<Result<{ isBookmarked: boolean }, ServiceError>> {
    try {
      const result = await this.repository.toggleBookmarkProblem(
        userId,
        problemId,
        companySlug,
        problemSlug
      );

      if (result.error) {
        return failure({
          code: "INTERNAL_ERROR",
          message: result.error,
          details: { problemId },
        });
      }

      // Update cache
      const cached = this.globalStatsCache.get(userId);
      if (cached) {
        let { bookmarkedProblemIds } = cached;
        bookmarkedProblemIds = [...bookmarkedProblemIds];
        
        if (result.isBookmarked) {
          if (!bookmarkedProblemIds.includes(problemId)) {
            bookmarkedProblemIds.push(problemId);
          }
        } else {
          bookmarkedProblemIds = bookmarkedProblemIds.filter(id => id !== problemId);
        }
        
        this.globalStatsCache.set(userId, {
          ...cached,
          bookmarkedProblemIds,
        });
      }

      await appEvents.emit("user:bookmark_toggled", {
        userId,
        problemId,
        isBookmarked: result.isBookmarked,
        companySlug,
        problemSlug,
        timestamp: new Date(),
      });

      return success({ isBookmarked: result.isBookmarked });
    } catch (error) {
      Logger.error("Failed to toggle bookmark", error, { userId, problemId });
      return failure({
        code: "INTERNAL_ERROR",
        message: "Failed to toggle bookmark",
        details: { problemId },
        cause: error instanceof Error ? error : undefined,
      });
    }
  }

  async setProblemStatus(
    userId: string,
    problemId: string,
    status: ProblemStatus,
    companySlug: string,
    problemSlug: string
  ): Promise<Result<void, ServiceError>> {
    try {
      const result = await this.repository.setProblemStatus(
        userId,
        problemId,
        status,
        companySlug,
        problemSlug
      );

      if (!result.success) {
        return failure({
          code: "INTERNAL_ERROR",
          message: result.error || "Failed to set problem status",
          details: { problemId, status },
        });
      }

      // Update cache
      const cached = this.globalStatsCache.get(userId);
      if (cached) {
        let { solvedProblemIds, attemptedProblemIds } = cached;
        
        // Clone arrays to ensure immutability
        solvedProblemIds = [...solvedProblemIds];
        attemptedProblemIds = [...attemptedProblemIds];

        if (status === 'solved') {
          if (!solvedProblemIds.includes(problemId)) {
            solvedProblemIds.push(problemId);
          }
        } else if (status === 'attempted') {
          if (!attemptedProblemIds.includes(problemId)) {
            attemptedProblemIds.push(problemId);
          }
        }
        
        this.globalStatsCache.set(userId, {
          ...cached,
          solvedProblemIds,
          attemptedProblemIds,
        });
      }

      await appEvents.emit("user:problem_status_changed", {
        userId,
        problemId,
        status,
        companySlug,
        problemSlug,
        timestamp: new Date(),
      });

      return success();
    } catch (error) {
      Logger.error("Failed to set problem status", error, { userId, problemId, status });
      return failure({
        code: "INTERNAL_ERROR",
        message: "Failed to set problem status",
        details: { problemId, status },
        cause: error instanceof Error ? error : undefined,
      });
    }
  }

  async updateUserDisplayName(
    userId: string,
    newDisplayName: string
  ): Promise<Result<void, ServiceError>> {
    try {
      const result = await this.repository.updateUserDisplayName(userId, newDisplayName);
      
      if (!result.success) {
        return failure({
          code: "VALIDATION_ERROR",
          message: result.error || "Failed to update display name",
        });
      }
      
      return success();
    } catch (error) {
      Logger.error("Failed to update display name", error, { userId });
      return failure({
        code: "INTERNAL_ERROR",
        message: "Failed to update display name",
        cause: error instanceof Error ? error : undefined,
      });
    }
  }

  async addUserEducation(
    userId: string,
    educationData: Omit<EducationExperience, "id">
  ): Promise<Result<{ id: string }, ServiceError>> {
    try {
      const result = await this.repository.addUserEducation(userId, educationData);
      
      if (!result.id) {
        return failure({
          code: "VALIDATION_ERROR",
          message: result.error || "Failed to add education",
        });
      }
      
      return success({ id: result.id });
    } catch (error) {
      Logger.error("Failed to add education", error, { userId });
      return failure({
        code: "INTERNAL_ERROR",
        message: "Failed to add education",
        cause: error instanceof Error ? error : undefined,
      });
    }
  }

  async addUserWorkExperience(
    userId: string,
    workData: Omit<WorkExperience, "id">
  ): Promise<Result<{ id: string }, ServiceError>> {
    try {
      const result = await this.repository.addUserWorkExperience(userId, workData);
      
      if (!result.id) {
        return failure({
          code: "VALIDATION_ERROR",
          message: result.error || "Failed to add work experience",
        });
      }
      
      return success({ id: result.id });
    } catch (error) {
      Logger.error("Failed to add work experience", error, { userId });
      return failure({
        code: "INTERNAL_ERROR",
        message: "Failed to add work experience",
        cause: error instanceof Error ? error : undefined,
      });
    }
  }

  async saveStrategyTodoList(
    userId: string,
    companyId: string,
    companyName: string,
    strategyData: Pick<
      GenerateCompanyStrategyOutput,
      "preparationStrategy" | "focusTopics" | "todoItems"
    >
  ): Promise<Result<void, ServiceError>> {
    try {
      const result = await this.repository.saveStrategyTodoList(
        userId,
        companyId,
        companyName,
        strategyData
      );
      
      if (!result.success) {
        return failure({
          code: "INTERNAL_ERROR",
          message: result.error || "Failed to save strategy todo list",
          details: { companyId },
        });
      }
      
      return success();
    } catch (error) {
      Logger.error("Failed to save strategy todo list", error, { userId, companyId });
      return failure({
        code: "INTERNAL_ERROR",
        message: "Failed to save strategy todo list",
        details: { companyId },
        cause: error instanceof Error ? error : undefined,
      });
    }
  }

  async updateStrategyTodoItemStatus(
    userId: string,
    companyId: string,
    itemIndex: number,
    isCompleted: boolean
  ): Promise<Result<void, ServiceError>> {
    try {
      const result = await this.repository.updateStrategyTodoItemStatus(
        userId,
        companyId,
        itemIndex,
        isCompleted
      );
      
      if (!result.success) {
        return failure({
          code: "INTERNAL_ERROR",
          message: result.error || "Failed to update todo item status",
          details: { companyId, itemIndex },
        });
      }
      
      return success();
    } catch (error) {
      Logger.error("Failed to update todo item status", error, { userId, companyId, itemIndex });
      return failure({
        code: "INTERNAL_ERROR",
        message: "Failed to update todo item status",
        details: { companyId, itemIndex },
        cause: error instanceof Error ? error : undefined,
      });
    }
  }

  async syncUserProfile(
    email: string | null,
    displayName: string | null
  ): Promise<Result<void, ServiceError>> {
    try {
      const result = await this.repository.syncUserProfile(email, displayName);
      
      if (!result.success) {
        return failure({
          code: "INTERNAL_ERROR",
          message: result.error || "Failed to sync user profile",
        });
      }
      
      return success();
    } catch (error) {
      Logger.error("Failed to sync user profile", error, { email });
      return failure({
        code: "INTERNAL_ERROR",
        message: "Failed to sync user profile",
        cause: error instanceof Error ? error : undefined,
      });
    }
  }
}

export const userService = new UserService();

// React cache() wrappers for Server Components deduplication
// These ensure that multiple Server Components requesting the same data
// will only trigger one database query per request

export const getUserGlobalProblemStats = cache((userId: string) => 
  userService.getUserGlobalProblemStats(userId)
);

export const getBookmarkedProblemsInfo = cache((userId: string) => 
  userService.getBookmarkedProblemsInfo(userId)
);

export const getAllUserProblemStatuses = cache((userId: string) => 
  userService.getAllUserProblemStatuses(userId)
);

export const getUserEducation = cache((userId: string) => 
  userService.getUserEducation(userId)
);

export const getUserWorkExperience = cache((userId: string) => 
  userService.getUserWorkExperience(userId)
);

export const getUserStrategyTodoLists = cache((userId: string) => 
  userService.getUserStrategyTodoLists(userId)
);
