/**
 * @fileoverview Server-side actions related to user profile and interaction data.
 *
 * This module contains Next.js server actions for managing user-specific data,
 * such as profile information, problem bookmarks, problem statuses, saved AI-generated
 * strategies, and educational/work history. These actions interface with the
 * database layer (`@/shared/lib/data`) and handle tasks like creating or updating user
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

import { revalidateTag } from "next/cache";

import { z } from "zod";

import { userService } from "@/features/profile/services/user.service";
import {
  type ApiResponse,
  errorResponse,
  successResponse,
} from "@/shared/lib/api/response";
import { createSupabaseServerClient } from "@/shared/lib/api/supabase-server";
import { handleServerActionError } from "@/shared/lib/utils/error-handler";
import { Logger } from "@/shared/lib/utils/logger";
import type {
  ProblemStatus,
} from "@/shared/types";
import { ProblemStatusSchema } from "@/shared/types";

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
 * @returns {Promise<ApiResponse<{ isBookmarked: boolean }>>} A promise that resolves to
 * a standardized API response with the new bookmark status.
 */
export async function toggleBookmarkProblemAction(
  userId: string,
  problemId: string,
  companySlug: string,
  problemSlug: string,
): Promise<ApiResponse<{ isBookmarked: boolean }>> {
  // SENTINEL: Prevent IDOR by verifying the requested userId matches the authenticated session.
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || user.id !== userId) {
    Logger.warn("Security: Unauthorized attempt to toggle bookmark", { requestedUserId: userId, authenticatedUserId: user?.id });
    return errorResponse({
      code: "UNAUTHORIZED",
      message: "Unauthorized: Server-side authentication is required to perform this action.",
    });
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
    return validation.error ? errorResponse({
         code: "VALIDATION_ERROR",
         message: validation.error.issues[0]?.message || "Invalid input parameters",
       }) : errorResponse({
         code: "VALIDATION_ERROR",
         message: "Invalid input parameters",
       });
  }

  try {
    const result = await userService.toggleBookmarkProblem(
      userId,
      problemId,
      companySlug,
      problemSlug,
    );
    
    if (result.isFailure) {
      return errorResponse({
        code: result.error.code,
        message: result.error.message,
      });
    }

    revalidateTag(`user-bookmarks-${userId}`, "max");
    revalidateTag(`user-profile-${userId}`, "max");
    return successResponse({ isBookmarked: result.value.isBookmarked });
  } catch (error) {
    const message = handleServerActionError(error, "toggleBookmarkProblemAction", {
      userId,
      problemId,
      companySlug,
      problemSlug,
    });
    return errorResponse({
      code: "INTERNAL_ERROR",
      message,
    });
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
 * @returns {Promise<ApiResponse<void>>} A promise that resolves to a standardized API response.
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
): Promise<ApiResponse<void>> {
  // SENTINEL: Prevent IDOR by verifying the requested userId matches the authenticated session.
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || user.id !== userId) {
    Logger.warn("Security: Unauthorized attempt to set problem status", { requestedUserId: userId, authenticatedUserId: user?.id });
    return errorResponse({
      code: "UNAUTHORIZED",
      message: "Unauthorized: Server-side authentication is required to perform this action.",
    });
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
     return validation.error ? errorResponse({
         code: "VALIDATION_ERROR",
         message: validation.error.issues[0]?.message || "Invalid input parameters",
       }) : errorResponse({
         code: "VALIDATION_ERROR",
         message: "Invalid input parameters",
       });
  }

  try {
    const result = await userService.setProblemStatus(
      userId,
      problemId,
      status,
      companySlug,
      problemSlug,
    );
    
    if (result.isFailure) {
      return errorResponse({
        code: result.error.code,
        message: result.error.message,
      });
    }

    revalidateTag(`user-problem-statuses-${userId}`, "max");
    revalidateTag(`user-profile-${userId}`, "max");
    return successResponse();
  } catch (error) {
    const message = handleServerActionError(error, "setProblemStatusAction", {
      userId,
      problemId,
      status,
      companySlug,
      problemSlug,
    });
    return errorResponse({
      code: "INTERNAL_ERROR",
      message,
    });
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
 * @returns {Promise<ApiResponse<Record<string, { isBookmarked: boolean; status?: ProblemStatus }>>>}
 *
 * @deprecated This action is currently disabled for security reasons until proper server-side
 * authentication (Admin SDK) is implemented. It currently relies on client-side auth state
 * which is not available on the server.
 */
export async function getUserProblemStatusesForIdsAction(
  userId: string,
  problemIds: string[],
): Promise<ApiResponse<Record<string, { isBookmarked: boolean; status?: ProblemStatus }>>> {
  // SENTINEL: Prevent IDOR by verifying the requested userId matches the authenticated session.
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || user.id !== userId) {
    Logger.warn("Security: Unauthorized attempt to fetch user problem statuses", { requestedUserId: userId, authenticatedUserId: user?.id });
    return errorResponse({
      code: "UNAUTHORIZED",
      message: "Unauthorized: Server-side authentication is required to perform this action.",
    });
  }

  const validation = GetStatusInputSchema.safeParse({ userId, problemIds });
  if (!validation.success) {
    if (problemIds && problemIds.length === 0) {
      return successResponse({});
    }
    
    Logger.warn("Security validation failed in getUserProblemStatusesForIdsAction", { error: validation.error });
    return validation.error ? errorResponse({
         code: "VALIDATION_ERROR",
         message: validation.error.issues[0]?.message || "Invalid input parameters",
       }) : errorResponse({
         code: "VALIDATION_ERROR",
         message: "Invalid input parameters",
       });
  }

  try {
    const [bookmarksResult, statusesResult] = await Promise.all([
      userService.getBookmarksForIds(userId, problemIds),
      userService.getProblemStatusesForIds(userId, problemIds),
    ]);

    if (bookmarksResult.isFailure) {
      return errorResponse({
        code: bookmarksResult.error.code,
        message: bookmarksResult.error.message,
      });
    }

    if (statusesResult.isFailure) {
      return errorResponse({
        code: statusesResult.error.code,
        message: statusesResult.error.message,
      });
    }

    const bookmarks = bookmarksResult.value;
    const statuses = statusesResult.value;

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

    return successResponse(result);
  } catch (error) {
    const message = handleServerActionError(
      error,
      "getUserProblemStatusesForIdsAction",
      { userId, count: problemIds.length },
    );
    return errorResponse({
      code: "INTERNAL_ERROR",
      message,
    });
  }
}






