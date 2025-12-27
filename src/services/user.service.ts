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

export class UserService {
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
    return await userRepository.getUserGlobalProblemStats(userId);
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
