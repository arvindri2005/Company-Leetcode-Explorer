/**
 * @fileoverview Server-side actions related to user profile and interaction data.
 *
 * This module contains Next.js server actions for managing user-specific data,
 * such as profile information, problem bookmarks, problem statuses, saved AI-generated
 * strategies, and educational/work history. These actions interface with the
 * database layer (`@/lib/data`) and handle tasks like creating or updating user
 * profiles, toggling bookmarks, setting problem progress, and managing saved
 * content. They also ensure proper cache revalidation for user-specific data.
 *
 * SENTINEL SECURITY WARNING:
 * Some actions in this file (e.g. `toggleBookmarkProblemAction`, `setProblemStatusAction`)
 * accept a `userId` parameter. We verify this matches the server-side authenticated user
 * to prevent IDOR.
 *
 * NOTE: Since this project uses the Firebase Client SDK on the server, `auth.currentUser`
 * is typically null unless a session management solution (like cookies) is implemented to
 * hydrate the auth state. Consequently, these actions may currently fail in production
 * if called directly from the server without such context. They remain here for architectural
 * completeness and future enhancement (e.g., migrating to Admin SDK or implementing session cookies).
 */
"use server";

import type {
  ProblemStatus,
} from "@/types";
import { userService } from "@/services/user.service";
import { revalidateTag } from "next/cache";
import { z } from "zod";
import { ProblemStatusSchema } from "@/types";
import { Logger } from "@/lib/logger";
import { auth } from "@/lib/firebase";

import { handleServerActionError } from "@/lib/error-handler";

const ActionInputSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  problemId: z.string().min(1, "Problem ID is required"),
  companySlug: z.string().min(1, "Company slug is required").max(100),
  problemSlug: z.string().min(1, "Problem slug is required").max(100),
});

const GetStatusInputSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  problemIds: z.array(z.string().min(1)).min(1),
});

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
 *
 * @deprecated This action is currently disabled for security reasons until proper server-side
 * authentication (Admin SDK) is implemented. It currently relies on client-side auth state
 * which is not available on the server.
 */
export async function toggleBookmarkProblemAction(
  userId: string,
  problemId: string,
  companySlug: string,
  problemSlug: string,
): Promise<{ success: boolean; isBookmarked?: boolean; error?: string }> {
  // SENTINEL: Prevent IDOR by verifying the requested userId matches the authenticated session.
  // Note: auth.currentUser is likely null in the current Client SDK server setup, causing this to fail safely.
  const currentUser = auth.currentUser;
  if (!currentUser || currentUser.uid !== userId) {
    Logger.warn("Security: Unauthorized attempt to toggle bookmark", { requestedUserId: userId, authenticatedUserId: currentUser?.uid });
    return { success: false, error: "Unauthorized: Server-side authentication is required to perform this action." };
  }

  const validation = ActionInputSchema.safeParse({
    userId,
    problemId,
    companySlug,
    problemSlug,
  });

  if (!validation.success) {
    Logger.warn("Security validation failed in toggleBookmarkProblemAction", { error: validation.error });
    
    // Zod v3+ safeParse return structure
    if (validation.error) {
       return {
         success: false,
         error: validation.error.issues[0]?.message || "Invalid input parameters",
       };
    } else {
       return {
         success: false,
         error: "Invalid input parameters",
       };
    }
  }

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
    const message = handleServerActionError(error, "toggleBookmarkProblemAction", {
      userId,
      problemId,
      companySlug,
      problemSlug,
    });
    return { success: false, error: message };
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
 *
 * @deprecated This action is currently disabled for security reasons until proper server-side
 * authentication (Admin SDK) is implemented. It currently relies on client-side auth state
 * which is not available on the server.
 */
export async function setProblemStatusAction(
  userId: string,
  problemId: string,
  status: ProblemStatus,
  companySlug: string,
  problemSlug: string,
): Promise<{ success: boolean; error?: string }> {
  // SENTINEL: Prevent IDOR by verifying the requested userId matches the authenticated session.
  const currentUser = auth.currentUser;
  if (!currentUser || currentUser.uid !== userId) {
    Logger.warn("Security: Unauthorized attempt to set problem status", { requestedUserId: userId, authenticatedUserId: currentUser?.uid });
    return { success: false, error: "Unauthorized: Server-side authentication is required to perform this action." };
  }

  const validation = ActionInputSchema.extend({
    status: ProblemStatusSchema,
  }).safeParse({
    userId,
    problemId,
    companySlug,
    problemSlug,
    status,
  });

  if (!validation.success) {
     Logger.warn("Security validation failed in setProblemStatusAction", { error: validation.error });
     if (validation.error) {
       return {
         success: false,
         error: validation.error.issues[0]?.message || "Invalid input parameters",
       };
    } else {
       return {
         success: false,
         error: "Invalid input parameters",
       };
    }
  }

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
    const message = handleServerActionError(error, "setProblemStatusAction", {
      userId,
      problemId,
      status,
      companySlug,
      problemSlug,
    });
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
 *
 * @deprecated This action is currently disabled for security reasons until proper server-side
 * authentication (Admin SDK) is implemented. It currently relies on client-side auth state
 * which is not available on the server.
 */
export async function getUserProblemStatusesForIdsAction(
  userId: string,
  problemIds: string[],
): Promise<
  | Record<string, { isBookmarked: boolean; status?: ProblemStatus }>
  | { error: string }
> {
  // SENTINEL: Prevent IDOR by verifying the requested userId matches the authenticated session.
  const currentUser = auth.currentUser;
  if (!currentUser || currentUser.uid !== userId) {
    Logger.warn("Security: Unauthorized attempt to fetch user problem statuses", { requestedUserId: userId, authenticatedUserId: currentUser?.uid });
    return { error: "Unauthorized: Server-side authentication is required to perform this action." };
  }

  const validation = GetStatusInputSchema.safeParse({ userId, problemIds });
  if (!validation.success) {
    if (problemIds && problemIds.length === 0) return {};
    
    Logger.warn("Security validation failed in getUserProblemStatusesForIdsAction", { error: validation.error });
    if (validation.error) {
       return { error: validation.error.issues[0]?.message || "Invalid input parameters" };
    } else {
       return { error: "Invalid input parameters" };
    }
  }

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
    const message = handleServerActionError(
      error,
      "getUserProblemStatusesForIdsAction",
      { userId, count: problemIds.length },
    );
    return { error: message };
  }
}
