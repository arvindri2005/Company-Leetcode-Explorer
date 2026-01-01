import { userRepository } from "@/repositories/user.repository";
import {
  BookmarkedProblemInfo,
  UserProblemStatusInfo,
  ProblemStatus,
  SavedStrategyTodoList,
  EducationExperience,
  WorkExperience,
  GenerateCompanyStrategyOutput,
} from "@/types";
import { appEvents, AppEventKey, AppEventHandler } from "@/services/event-bus";

interface CachedGlobalStats {
  data: {
    solvedProblemIds: string[];
    attemptedProblemIds: string[];
    bookmarkedProblemIds: string[];
  };
  timestamp: number;
}

export class UserService {
  private globalStatsCache: Map<string, CachedGlobalStats> = new Map();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes
  private readonly MAX_CACHE_SIZE = 1000; // Max number of users in cache

  /**
   * Subscribe to user-related events.
   */
  subscribe<K extends AppEventKey>(event: K, handler: AppEventHandler<K>) {
    return appEvents.subscribe(event, handler);
  }

  async getBookmarkedProblemsInfo(userId: string): Promise<BookmarkedProblemInfo[]> {
    return await userRepository.getBookmarkedProblemsInfo(userId);
  }

  async getUserGlobalProblemStats(userId: string): Promise<{ solvedProblemIds: string[], attemptedProblemIds: string[], bookmarkedProblemIds: string[] }> {
    const now = Date.now();
    const cached = this.globalStatsCache.get(userId);

    if (cached && now - cached.timestamp < this.CACHE_TTL) {
      // Refresh LRU position by deleting and re-setting
      this.globalStatsCache.delete(userId);
      this.globalStatsCache.set(userId, cached);

      // Return a copy to prevent mutation of the cache by consumers
      return {
        solvedProblemIds: [...cached.data.solvedProblemIds],
        attemptedProblemIds: [...cached.data.attemptedProblemIds],
        bookmarkedProblemIds: [...cached.data.bookmarkedProblemIds],
      };
    }

    const data = await userRepository.getUserGlobalProblemStats(userId);
    
    // Memory management: LRU Eviction
    if (this.globalStatsCache.size >= this.MAX_CACHE_SIZE) {
      // Remove the oldest item (first key in the iterator)
      const oldestKey = this.globalStatsCache.keys().next().value;
      if (oldestKey) {
        this.globalStatsCache.delete(oldestKey);
      }
    }
    
    this.globalStatsCache.set(userId, { data, timestamp: now });
    
    // Return a copy even on fresh fetch to be consistent
    return {
        solvedProblemIds: [...data.solvedProblemIds],
        attemptedProblemIds: [...data.attemptedProblemIds],
        bookmarkedProblemIds: [...data.bookmarkedProblemIds],
    };
  }


  async getAllUserProblemStatuses(userId: string): Promise<Record<string, UserProblemStatusInfo>> {
    return await userRepository.getAllUserProblemStatuses(userId);
  }

  async getProblemStatusesForIds(
    userId: string,
    problemIds: string[],
  ): Promise<Record<string, UserProblemStatusInfo>> {
    return await userRepository.getProblemStatusesForIds(userId, problemIds);
  }

  async getBookmarksForIds(
    userId: string,
    problemIds: string[],
  ): Promise<Set<string>> {
    return await userRepository.getBookmarksForIds(userId, problemIds);
  }

  async getUserEducation(userId: string): Promise<EducationExperience[]> {
    return await userRepository.getUserEducation(userId);
  }

  async getUserWorkExperience(userId: string): Promise<WorkExperience[]> {
    return await userRepository.getUserWorkExperience(userId);
  }

  async getUserStrategyTodoLists(
    userId: string,
  ): Promise<SavedStrategyTodoList[]> {
    return await userRepository.getUserStrategyTodoLists(userId);
  }

  async getStrategyTodoListForCompany(
    userId: string,
    companyId: string,
  ): Promise<SavedStrategyTodoList | null> {
    return await userRepository.getStrategyTodoListForCompany(userId, companyId);
  }

  async toggleBookmarkProblem(
    userId: string,
    problemId: string,
    companySlug: string,
    problemSlug: string,
  ): Promise<{ isBookmarked: boolean; error?: string }> {
    const result = await userRepository.toggleBookmarkProblem(
      userId,
      problemId,
      companySlug,
      problemSlug,
    );

    if (!result.error) {
      // Update cache
      const cached = this.globalStatsCache.get(userId);
      if (cached) {
        const { bookmarkedProblemIds } = cached.data;
        let newBookmarked = [...bookmarkedProblemIds];
        
        if (result.isBookmarked) {
          if (!newBookmarked.includes(problemId)) {
            newBookmarked.push(problemId);
          }
        } else {
          newBookmarked = newBookmarked.filter(id => id !== problemId);
        }
        
        this.globalStatsCache.set(userId, {
          ...cached,
          data: { ...cached.data, bookmarkedProblemIds: newBookmarked },
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
    }

    return result;
  }

  async setProblemStatus(
    userId: string,
    problemId: string,
    status: ProblemStatus,
    companySlug: string,
    problemSlug: string,
  ): Promise<{ success: boolean; error?: string }> {
    const result = await userRepository.setProblemStatus(
      userId,
      problemId,
      status,
      companySlug,
      problemSlug,
    );

    if (result.success) {
      // Update cache
      const cached = this.globalStatsCache.get(userId);
      if (cached) {
        let { solvedProblemIds, attemptedProblemIds } = cached.data;
        
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
        // No removal logic as per repository spec
        
        this.globalStatsCache.set(userId, {
          ...cached,
          data: { ...cached.data, solvedProblemIds, attemptedProblemIds },
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
    }

    return result;
  }

  async updateUserDisplayName(
    userId: string,
    newDisplayName: string,
  ): Promise<{ success: boolean; error?: string }> {
    return await userRepository.updateUserDisplayName(userId, newDisplayName);
  }

  async addUserEducation(
    userId: string,
    educationData: Omit<EducationExperience, "id">,
  ): Promise<{ id: string | null; error?: string }> {
    return await userRepository.addUserEducation(userId, educationData);
  }

  async addUserWorkExperience(
    userId: string,
    workData: Omit<WorkExperience, "id">,
  ): Promise<{ id: string | null; error?: string }> {
    return await userRepository.addUserWorkExperience(userId, workData);
  }

  async saveStrategyTodoList(
    userId: string,
    companyId: string,
    companyName: string,
    strategyData: Pick<
      GenerateCompanyStrategyOutput,
      "preparationStrategy" | "focusTopics" | "todoItems"
    >,
  ): Promise<{ success: boolean; error?: string }> {
    return await userRepository.saveStrategyTodoList(
      userId,
      companyId,
      companyName,
      strategyData,
    );
  }

  async updateStrategyTodoItemStatus(
    userId: string,
    companyId: string,
    itemIndex: number,
    isCompleted: boolean,
  ): Promise<{ success: boolean; error?: string }> {
    return await userRepository.updateStrategyTodoItemStatus(
      userId,
      companyId,
      itemIndex,
      isCompleted,
    );
  }

  async syncUserProfile(
    email: string | null,
    displayName: string | null,
  ): Promise<{ success: boolean; error?: string }> {
    return await userRepository.syncUserProfile(email, displayName);
  }
}

export const userService = new UserService();
