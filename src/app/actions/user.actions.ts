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
  UserProblemStatusInfo,
  ProblemStatus,
} from "@/types";
import { userService } from "@/services/user.service";
import { revalidateTag } from "next/cache";

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
  return await userService.syncUserProfile(userData.uid, userData.email, userData.displayName);
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
    const result = await userService.toggleBookmarkProblem(
      userId,
      problemId,
      companySlug,
      problemSlug,
    );
    if (result.error) return { success: false, error: result.error };

    revalidateTag(`user-bookmarks-${userId}`, "max");
    revalidateTag(`user-profile-${userId}`, "max");
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
    const result = await userService.setProblemStatus(
      userId,
      problemId,
      status,
      companySlug,
      problemSlug,
    );
    if (result.success) {
      revalidateTag(`user-problem-statuses-${userId}`, "max");
      revalidateTag(`user-profile-${userId}`, "max");
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
 * Fetches status and bookmark info for a specific list of problem IDs.
 *
 * This action is optimized for client-side hydration where we only want to fetch
 * user data for the problems currently visible on the screen, rather than re-fetching
 * the entire problem list or all user statuses.
 *
 * @param {string} userId - The ID of the authenticated user.
 * @param {string[]} problemIds - The list of problem IDs to fetch status for.
 * @returns {Promise<Record<string, { isBookmarked: boolean; status?: ProblemStatus }> | { error: string }>}
 */
export async function getUserProblemStatusesForIdsAction(
  userId: string,
  problemIds: string[],
): Promise<
  | Record<string, { isBookmarked: boolean; status?: ProblemStatus }>
  | { error: string }
> {
  if (!userId)
    return { error: "User not authenticated." };
  if (!problemIds || problemIds.length === 0) return {};

  try {
    const [bookmarks, statuses] = await Promise.all([
      userService.getBookmarksForIds(userId, problemIds),
      userService.getProblemStatusesForIds(userId, problemIds),
    ]);

    const result: Record<
      string,
      { isBookmarked: boolean; status?: ProblemStatus }
    > = {};

    problemIds.forEach((id) => {
      result[id] = {
        isBookmarked: bookmarks.has(id),
        status: statuses[id]?.status,
      };
    });

    return result;
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to fetch user problem statuses.";
    console.error("Error in getUserProblemStatusesForIdsAction:", error);
    return { error: message };
  }
}
