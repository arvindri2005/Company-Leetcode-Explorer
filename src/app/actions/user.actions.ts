/**
 * @fileoverview Server-side actions related to user profile and interaction data.
 *
 * This module contains Next.js server actions for managing user-specific data,
 * such as profile information, problem bookmarks, problem statuses, saved AI-generated
 * strategies, and educational/work history. These actions interface with the
 * database layer (`@/lib/data`) and handle tasks like creating or updating user
 * profiles, toggling bookmarks, setting problem progress, and managing saved
 * content. They also ensure proper cache revalidation for user-specific data.
 */
"use server";

import type {
  UserProfile,
  BookmarkedProblemInfo,
  UserProblemStatusInfo,
  ProblemStatus,
  GenerateCompanyStrategyOutput,
  SavedStrategyTodoList,
  EducationExperience,
  WorkExperience,
} from "@/types";
import {
  dbToggleBookmarkProblem,
  dbGetUserBookmarkedProblemsInfo,
  dbSetProblemStatus,
  dbGetAllUserProblemStatuses,
  dbUpdateUserDisplayName,
  dbSaveStrategyTodoList,
  dbGetUserStrategyTodoLists,
  dbUpdateStrategyTodoItemStatus,
  dbGetStrategyTodoListForCompany,
  dbAddUserEducation,
  dbGetUserEducation,
  dbAddUserWorkExperience,
  dbGetUserWorkExperience,
} from "@/lib/data";
import { revalidateTag } from "next/cache";
import {
  doc as firestoreDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
  getDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

interface SyncUserProfileInput {
  uid: string;
  email: string | null;
  displayName: string | null;
}
/**
 * Synchronizes Firebase Auth user data with a user profile document in Firestore.
 *
 * This action is typically called upon user sign-in or when their auth profile changes.
 * It checks if a user profile document exists in the `users` collection. If not, it creates one.
 * If it exists, it updates the `displayName` and `email` fields if they have changed.
 *
 * @param {SyncUserProfileInput} userData - An object containing the user's UID, email, and display name from Firebase Auth.
 * @returns {Promise<{ success: boolean; error?: string }>} A promise that resolves to an object
 * indicating the success or failure of the synchronization operation.
 */
export async function syncUserProfile(
  userData: SyncUserProfileInput,
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!userData.uid)
      return { success: false, error: "User ID is required for profile sync." };

    const userDocRef = firestoreDoc(db, "users", userData.uid);
    const userDocSnap = await getDoc(userDocRef);

    if (!userDocSnap.exists()) {
      await setDoc(userDocRef, {
        uid: userData.uid,
        email: userData.email,
        displayName: userData.displayName,
        createdAt: serverTimestamp(),
      });
    } else {
      const existingData = userDocSnap.data() as UserProfile;
      const updates: Partial<UserProfile> = {};
      if (userData.displayName !== existingData.displayName) {
        updates.displayName = userData.displayName;
      }
      if (userData.email !== existingData.email) {
        updates.email = userData.email;
      }

      if (Object.keys(updates).length > 0) {
        await updateDoc(userDocRef, updates);
      }
    }
    return { success: true };
  } catch (error) {
    console.error("Error syncing user profile to Firestore:", error);
    if (error instanceof Error) return { success: false, error: error.message };
    return {
      success: false,
      error: "An unknown error occurred while syncing user profile.",
    };
  }
}

/**
 * Toggles the bookmark status of a coding problem for a given user.
 *
 * This action adds or removes a problem from a user's bookmarked list. It requires
 * the user's ID, the problem's ID, and the slugs for both the company and the problem
 * to store all necessary information for later retrieval. It triggers cache revalidation
 * for user-specific bookmark data upon completion.
 *
 * @param {string} userId - The ID of the authenticated user.
 * @param {string} problemId - The ID of the problem to bookmark or unbookmark.
 * @param {string} companySlug - The slug of the company associated with the problem.
 * @param {string} problemSlug - The slug of the problem itself.
 * @returns {Promise<{ success: boolean; isBookmarked?: boolean; error?: string }>} A promise
 * that resolves to an object indicating the outcome. On success, `isBookmarked` reflects
 * the new bookmark status (true if bookmarked, false if removed).
 */
export async function toggleBookmarkProblemAction(
  userId: string,
  problemId: string,
  companySlug: string,
  problemSlug: string,
): Promise<{ success: boolean; isBookmarked?: boolean; error?: string }> {
  if (!userId)
    return {
      success: false,
      error: "User not authenticated. Cannot toggle bookmark.",
    };
  if (!problemId)
    return {
      success: false,
      error: "Problem ID is required to toggle bookmark.",
    };
  if (!companySlug)
    return { success: false, error: "Company slug is required." };
  if (!problemSlug)
    return { success: false, error: "Problem slug is required." };

  try {
    const result = await dbToggleBookmarkProblem(
      userId,
      problemId,
      companySlug,
      problemSlug,
    );
    if (result.error) return { success: false, error: result.error };

    revalidateTag(`user-bookmarks-${userId}`);
    revalidateTag(`user-profile-${userId}`);
    return { success: true, isBookmarked: result.isBookmarked };
  } catch (error) {
    console.error("Error in toggleBookmarkProblemAction:", error);
    if (error instanceof Error) return { success: false, error: error.message };
    return {
      success: false,
      error: "An unknown error occurred while toggling bookmark.",
    };
  }
}

/**
 * Fetches identifying information for all problems bookmarked by a specific user.
 *
 * This action retrieves a list of lightweight objects, each containing the problem ID,
 * company slug, and problem slug for a bookmarked item. This data is sufficient
 to
 * construct links or fetch full problem details in a subsequent batch operation.
 *
 * @param {string} userId - The ID of the authenticated user whose bookmarks are to be fetched.
 * @returns {Promise<BookmarkedProblemInfo[] | { error: string }>} A promise that resolves to an
 * array of bookmarked problem information objects, or an error object on failure.
 */
export async function getUsersBookmarkedProblemsInfoAction(
  userId: string,
): Promise<BookmarkedProblemInfo[] | { error: string }> {
  if (!userId)
    return { error: "User not authenticated. Cannot fetch bookmarks." };
  try {
    return await dbGetUserBookmarkedProblemsInfo(userId);
  } catch (error) {
    console.error("Error in getUsersBookmarkedProblemsInfoAction:", error);
    if (error instanceof Error) return { error: error.message };
    return { error: "An unknown error occurred while fetching bookmarks." };
  }
}

/**
 * Sets or updates the progress status of a coding problem for a user.
 *
 * This action allows a user to mark a problem as 'solved', 'in_progress', 'not_started',
 * or to clear the status. This information is stored per user and problem. The action
 * triggers cache revalidation for the user's problem status data.
 *
 * @param {string} userId - The ID of the authenticated user.
 * @param {string} problemId - The ID of the problem whose status is being set.
 * @param {ProblemStatus} status - The new status for the problem.
 * @param {string} companySlug - The slug of the company associated with the problem.
 * @param {string} problemSlug - The slug of the problem itself.
 * @returns {Promise<{ success: boolean; error?: string }>} A promise that resolves to an object
 * indicating the success or failure of the operation.
 */
export async function setProblemStatusAction(
  userId: string,
  problemId: string,
  status: ProblemStatus,
  companySlug: string,
  problemSlug: string,
): Promise<{ success: boolean; error?: string }> {
  if (!userId)
    return {
      success: false,
      error: "User not authenticated. Cannot set problem status.",
    };
  if (!problemId)
    return { success: false, error: "Problem ID is required to set status." };
  if (!companySlug)
    return { success: false, error: "Company slug is required." };
  if (!problemSlug)
    return { success: false, error: "Problem slug is required." };

  try {
    const result = await dbSetProblemStatus(
      userId,
      problemId,
      status,
      companySlug,
      problemSlug,
    );
    if (result.success) {
      revalidateTag(`user-problem-statuses-${userId}`);
      revalidateTag(`user-profile-${userId}`);
    }
    return result;
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to set problem status due to an unknown error.";
    console.error("Error in setProblemStatusAction:", error);
    return { success: false, error: message };
  }
}

/**
 * Fetches all problem progress statuses for a specific user.
 *
 * This action retrieves a comprehensive map of all problems for which the user has
 * set a status. The result is an object where keys are problem IDs and values are
 * objects containing the status and relevant slugs.
 *
 * @param {string} userId - The ID of the authenticated user.
 * @returns {Promise<Record<string, UserProblemStatusInfo> | { error: string }>} A promise that
 * resolves to a map of problem IDs to their status information, or an error object on failure.
 */
export async function getAllUserProblemStatusesAction(
  userId: string,
): Promise<Record<string, UserProblemStatusInfo> | { error: string }> {
  if (!userId)
    return { error: "User not authenticated. Cannot fetch problem statuses." };
  try {
    return await dbGetAllUserProblemStatuses(userId);
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to fetch problem statuses due to an unknown error.";
    console.error("Error in getAllUserProblemStatusesAction:", error);
    return { error: message };
  }
}

/**
 * Updates a user's display name in their Firestore user profile.
 *
 * This action validates the new display name and then updates the `displayName`
 * field in the corresponding user document in Firestore. It triggers cache
 * revalidation for the user's profile data.
 *
 * @param {string} userId - The ID of the authenticated user.
 * @param {string} newDisplayName - The new display name to set for the user.
 * @returns {Promise<{ success: boolean; error?: string }>} A promise that resolves to an
 * object indicating the success or failure of the update operation.
 */
export async function updateUserDisplayNameInFirestore(
  userId: string,
  newDisplayName: string,
): Promise<{ success: boolean; error?: string }> {
  if (!userId)
    return {
      success: false,
      error: "User not authenticated. Cannot update display name.",
    };
  if (!newDisplayName || newDisplayName.trim().length < 2) {
    return {
      success: false,
      error: "Display name must be at least 2 characters.",
    };
  }

  try {
    const result = await dbUpdateUserDisplayName(userId, newDisplayName.trim());
    if (result.success) {
      revalidateTag(`user-profile-${userId}`);
    }
    return result;
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to update display name in Firestore due to an unknown error.";
    console.error("Error in updateUserDisplayNameInFirestore action:", error);
    return { success: false, error: message };
  }
}

/**
 * Adds a new education entry to a user's profile.
 * @param {string} userId - The ID of the user.
 * @param {Omit<EducationExperience, 'id'>} educationData - The education details to add.
 * @returns {Promise<{ id: string | null; error?: string }>} The ID of the new entry or an error.
 */
export async function addUserEducationAction(
  userId: string,
  educationData: Omit<EducationExperience, "id">,
): Promise<{ id: string | null; error?: string }> {
  if (!userId) return { id: null, error: "User not authenticated." };
  const result = await dbAddUserEducation(userId, educationData);
  if (result.id) {
    revalidateTag(`user-profile-${userId}`);
    revalidateTag(`user-education-${userId}`);
  }
  return result;
}

/**
 * Fetches all education entries for a user.
 * @param {string} userId - The ID of the user.
 * @returns {Promise<EducationExperience[] | { error: string }>} An array of education entries or an error.
 */
export async function getUserEducationAction(
  userId: string,
): Promise<EducationExperience[] | { error: string }> {
  if (!userId) return { error: "User not authenticated." };
  try {
    return await dbGetUserEducation(userId);
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to fetch education history.";
    return { error: message };
  }
}

/**
 * Adds a new work experience entry to a user's profile.
 * @param {string} userId - The ID of the user.
 * @param {Omit<WorkExperience, 'id'>} workData - The work experience details to add.
 * @returns {Promise<{ id: string | null; error?: string }>} The ID of the new entry or an error.
 */
export async function addUserWorkExperienceAction(
  userId: string,
  workData: Omit<WorkExperience, "id">,
): Promise<{ id: string | null; error?: string }> {
  if (!userId) return { id: null, error: "User not authenticated." };
  const result = await dbAddUserWorkExperience(userId, workData);
  if (result.id) {
    revalidateTag(`user-profile-${userId}`);
    revalidateTag(`user-work-experience-${userId}`);
  }
  return result;
}

/**
 * Fetches all work experience entries for a user.
 * @param {string} userId - The ID of the user.
 * @returns {Promise<WorkExperience[] | { error: string }>} An array of work experience entries or an error.
 */
export async function getUserWorkExperienceAction(
  userId: string,
): Promise<WorkExperience[] | { error: string }> {
  if (!userId) return { error: "User not authenticated." };
  try {
    return await dbGetUserWorkExperience(userId);
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to fetch work experience.";
    return { error: message };
  }
}

/**
 * Saves or overwrites an AI-generated preparation strategy for a user and a specific company.
 *
 * This action stores the complete strategy, including the markdown text, focus topics,
 * and the initial to-do list, in a subcollection within the user's profile.
 * It's used to persist the results of an AI generation so the user can refer to it later.
 *
 * @param {string} userId - The ID of the user saving the strategy.
 * @param {string} companyId - The ID of the company to which the strategy applies.
 * @param {string} companyName - The name of the company.
 * @param {Pick<GenerateCompanyStrategyOutput, 'preparationStrategy' | 'focusTopics' | 'todoItems'>} strategy -
 * An object containing the core components of the generated strategy.
 * @returns {Promise<{ success: boolean; error?: string }>} A promise indicating the outcome of the save operation.
 */
export async function saveStrategyTodoListAction(
  userId: string,
  companyId: string,
  companyName: string,
  strategy: Pick<
    GenerateCompanyStrategyOutput,
    "preparationStrategy" | "focusTopics" | "todoItems"
  >,
): Promise<{ success: boolean; error?: string }> {
  if (!userId)
    return {
      success: false,
      error: "User not authenticated. Cannot save strategy.",
    };
  if (!companyId) return { success: false, error: "Company ID is required." };
  if (
    !strategy ||
    !strategy.todoItems ||
    !strategy.preparationStrategy ||
    !strategy.focusTopics
  ) {
    return {
      success: false,
      error:
        "Complete strategy data (strategy, topics, and todo list) is required.",
    };
  }

  try {
    const result = await dbSaveStrategyTodoList(
      userId,
      companyId,
      companyName,
      strategy,
    );
    if (result.success) {
      revalidateTag(`user-profile-${userId}`);
      revalidateTag(`user-strategy-todo-lists-${userId}`);
      revalidateTag(`user-strategy-for-company-${companyId}-${userId}`);
    }
    return result;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to save strategy.";
    console.error("Error in saveStrategyTodoListAction:", error);
    return { success: false, error: message };
  }
}

/**
 * Fetches all saved preparation strategies for a specific user.
 *
 * This action retrieves all documents from the user's `savedStrategies` subcollection,
 * providing a list of all company-specific strategies they have generated and saved.
 *
 * @param {string} userId - The ID of the user whose strategies are to be fetched.
 * @returns {Promise<SavedStrategyTodoList[] | { error: string }>} A promise that resolves to an
 * array of saved strategy objects, or an error object on failure.
 */
export async function getUserStrategyTodoListsAction(
  userId: string,
): Promise<SavedStrategyTodoList[] | { error: string }> {
  if (!userId)
    return { error: "User not authenticated. Cannot fetch saved strategies." };
  try {
    return await dbGetUserStrategyTodoLists(userId);
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to fetch saved strategies due to an unknown error.";
    console.error("Error in getUserStrategyTodoListsAction:", error);
    return { error: message };
  }
}

/**
 * Fetches a specific, saved preparation strategy for a user and company.
 *
 * This action retrieves a single strategy document corresponding to the given
 * user and company ID. It's used to display a previously saved strategy.
 *
 * @param {string} userId - The ID of the user.
 * @param {string} companyId - The ID of the company for which the strategy was saved.
 * @returns {Promise<SavedStrategyTodoList | null | { error: string }>} A promise that resolves to the
 * saved strategy object, `null` if no strategy is found for that company, or an error object on failure.
 */
export async function getStrategyTodoListForCompanyAction(
  userId: string,
  companyId: string,
): Promise<SavedStrategyTodoList | null | { error: string }> {
  if (!userId) return { error: "User not authenticated." };
  if (!companyId) return { error: "Company ID is required." };
  try {
    const result = await dbGetStrategyTodoListForCompany(userId, companyId);
    return result;
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to fetch strategy for company.";
    console.error("Error in getStrategyTodoListForCompanyAction:", error);
    return { error: message };
  }
}

/**
 * Updates the completion status of a single to-do item within a saved strategy.
 *
 * This action allows a user to check or uncheck an item in their to-do list for a
 * specific company's preparation strategy. It performs a targeted update on the
 * array of to-do items in the saved strategy document.
 *
 * @param {string} userId - The ID of the user.
 * @param {string} companyId - The ID of the company associated with the to-do list.
 * @param {number} itemIndex - The zero-based index of the to-do item to update.
 * @param {boolean} isCompleted - The new completion status for the item.
 * @returns {Promise<{ success: boolean; error?: string }>} A promise indicating the outcome of the update.
 */
export async function updateStrategyTodoItemStatusAction(
  userId: string,
  companyId: string,
  itemIndex: number,
  isCompleted: boolean,
): Promise<{ success: boolean; error?: string }> {
  if (!userId) return { success: false, error: "User not authenticated." };
  if (!companyId) return { success: false, error: "Company ID is required." };
  if (itemIndex < 0) return { success: false, error: "Invalid item index." };

  try {
    const result = await dbUpdateStrategyTodoItemStatus(
      userId,
      companyId,
      itemIndex,
      isCompleted,
    );
    if (result.success) {
      revalidateTag(`user-profile-${userId}`);
      revalidateTag(`user-strategy-todo-lists-${userId}`);
      revalidateTag(`user-strategy-for-company-${companyId}-${userId}`);
    }
    return result;
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to update todo item status.";
    console.error("Error in updateStrategyTodoItemStatusAction:", error);
    return { success: false, error: message };
  }
}
