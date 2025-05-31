
'use server';

import type { UserProfile, BookmarkedProblemInfo, UserProblemStatusInfo, ProblemStatus, GenerateCompanyStrategyOutput, SavedStrategyTodoList } from '@/types';
import { 
  dbToggleBookmarkProblem, 
  dbGetUserBookmarkedProblemsInfo, 
  dbSetProblemStatus, 
  dbGetAllUserProblemStatuses, 
  dbUpdateUserDisplayName,
  dbSaveStrategyTodoList,
  dbGetUserStrategyTodoLists,
  dbUpdateStrategyTodoItemStatus,
  dbGetStrategyTodoListForCompany
} from '@/lib/data';
import { revalidateTag } from 'next/cache';
import { doc as firestoreDoc, setDoc, updateDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface SyncUserProfileInput { uid: string; email: string | null; displayName: string | null; }
/**
 * Synchronizes Firebase Auth user data to a Firestore user profile document.
 * Creates the profile if it doesn't exist, or updates it if displayName/email changes.
 * @param {SyncUserProfileInput} userData - User data from Firebase Auth.
 * @returns {Promise<{ success: boolean; error?: string }>} Result of the sync operation.
 */
export async function syncUserProfile(userData: SyncUserProfileInput): Promise<{ success: boolean; error?: string }> {
  try {
    if (!userData.uid) return { success: false, error: "User ID is required for profile sync." };

    const userDocRef = firestoreDoc(db, 'users', userData.uid);
    const userDocSnap = await getDoc(userDocRef);

    if (!userDocSnap.exists()) {
      await setDoc(userDocRef, {
        uid: userData.uid,
        email: userData.email,
        displayName: userData.displayName,
        createdAt: serverTimestamp()
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
    console.error('Error syncing user profile to Firestore:', error);
    if (error instanceof Error) return { success: false, error: error.message };
    return { success: false, error: 'An unknown error occurred while syncing user profile.' };
  }
}

/**
 * Toggles a problem's bookmark status for a given user.
 * @param {string} userId - The ID of the user.
 * @param {string} problemId - The ID of the problem to bookmark/unbookmark.
 * @param {string} companySlug - The slug of the company the problem belongs to.
 * @param {string} problemSlug - The slug of the problem.
 * @returns {Promise<{ success: boolean; isBookmarked?: boolean; error?: string }>} Result including new bookmark state.
 */
export async function toggleBookmarkProblemAction(userId: string, problemId: string, companySlug: string, problemSlug: string): Promise<{ success: boolean; isBookmarked?: boolean; error?: string }> {
  if (!userId) return { success: false, error: 'User not authenticated. Cannot toggle bookmark.' };
  if (!problemId) return { success: false, error: 'Problem ID is required to toggle bookmark.' };
  if (!companySlug) return { success: false, error: 'Company slug is required.' };
  if (!problemSlug) return { success: false, error: 'Problem slug is required.' };

  try {
    const result = await dbToggleBookmarkProblem(userId, problemId, companySlug, problemSlug);
    if (result.error) return { success: false, error: result.error };

    revalidateTag(`user-bookmarks-${userId}`);
    revalidateTag(`user-profile-${userId}`);
    return { success: true, isBookmarked: result.isBookmarked };
  } catch (error) {
    console.error('Error in toggleBookmarkProblemAction:', error);
    if (error instanceof Error) return { success: false, error: error.message };
    return { success: false, error: 'An unknown error occurred while toggling bookmark.' };
  }
}

/**
 * Fetches information (IDs and slugs) of all problems bookmarked by a user.
 * @param {string} userId - The ID of the user.
 * @returns {Promise<BookmarkedProblemInfo[] | { error: string }>} Array of bookmarked problem info or an error object.
 */
export async function getUsersBookmarkedProblemsInfoAction(userId: string): Promise<BookmarkedProblemInfo[] | { error: string }> {
  if (!userId) return { error: 'User not authenticated. Cannot fetch bookmarks.' };
  try {
    return await dbGetUserBookmarkedProblemsInfo(userId);
  } catch (error) {
    console.error('Error in getUsersBookmarkedProblemsInfoAction:', error);
    if (error instanceof Error) return { error: error.message };
    return { error: 'An unknown error occurred while fetching bookmarks.' };
  }
}

/**
 * Sets or clears the progress status for a problem for a given user.
 * @param {string} userId - The ID of the user.
 * @param {string} problemId - The ID of the problem.
 * @param {ProblemStatus} status - The new status for the problem.
 * @param {string} companySlug - The slug of the company the problem belongs to.
 * @param {string} problemSlug - The slug of the problem.
 * @returns {Promise<{ success: boolean; error?: string }>} Result of the operation.
 */
export async function setProblemStatusAction(
  userId: string,
  problemId: string,
  status: ProblemStatus,
  companySlug: string,
  problemSlug: string
): Promise<{ success: boolean; error?: string }> {
  if (!userId) return { success: false, error: 'User not authenticated. Cannot set problem status.' };
  if (!problemId) return { success: false, error: 'Problem ID is required to set status.' };
  if (!companySlug) return { success: false, error: 'Company slug is required.' };
  if (!problemSlug) return { success: false, error: 'Problem slug is required.' };

  try {
    const result = await dbSetProblemStatus(userId, problemId, status, companySlug, problemSlug);
    if (result.success) {
      revalidateTag(`user-problem-statuses-${userId}`);
      revalidateTag(`user-profile-${userId}`);
    }
    return result;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to set problem status due to an unknown error.';
    console.error('Error in setProblemStatusAction:', error);
    return { success: false, error: message };
  }
}

/**
 * Fetches all problem statuses for a given user.
 * @param {string} userId - The ID of the user.
 * @returns {Promise<Record<string, UserProblemStatusInfo> | { error: string }>} A map of problem IDs to their statuses and slugs, or an error object.
 */
export async function getAllUserProblemStatusesAction(
  userId: string
): Promise<Record<string, UserProblemStatusInfo> | { error: string }> {
  if (!userId) return { error: 'User not authenticated. Cannot fetch problem statuses.' };
  try {
    return await dbGetAllUserProblemStatuses(userId);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch problem statuses due to an unknown error.';
    console.error('Error in getAllUserProblemStatusesAction:', error);
    return { error: message };
  }
}

/**
 * Updates a user's display name in Firestore.
 * @param {string} userId - The ID of the user.
 * @param {string} newDisplayName - The new display name.
 * @returns {Promise<{ success: boolean; error?: string }>} Result of the operation.
 */
export async function updateUserDisplayNameInFirestore(
  userId: string,
  newDisplayName: string
): Promise<{ success: boolean; error?: string }> {
  if (!userId) return { success: false, error: 'User not authenticated. Cannot update display name.' };
  if (!newDisplayName || newDisplayName.trim().length < 2) {
    return { success: false, error: 'Display name must be at least 2 characters.' };
  }

  try {
    const result = await dbUpdateUserDisplayName(userId, newDisplayName.trim());
    if (result.success) {
      revalidateTag(`user-profile-${userId}`);
    }
    return result;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update display name in Firestore due to an unknown error.';
    console.error('Error in updateUserDisplayNameInFirestore action:', error);
    return { success: false, error: message };
  }
}

/**
 * Saves a generated strategy (text, topics, todo list) to a user's profile in Firestore.
 * @param userId The ID of the user.
 * @param companyId The ID of the company for which the strategy was generated.
 * @param companyName The name of the company.
 * @param strategy The full strategy output from the AI.
 * @returns {Promise<{ success: boolean; error?: string }>} Result of the operation.
 */
export async function saveStrategyTodoListAction(
  userId: string,
  companyId: string,
  companyName: string,
  strategy: Pick<GenerateCompanyStrategyOutput, 'preparationStrategy' | 'focusTopics' | 'todoItems'>
): Promise<{ success: boolean; error?: string }> {
  if (!userId) return { success: false, error: 'User not authenticated. Cannot save strategy.' };
  if (!companyId) return { success: false, error: 'Company ID is required.' };
  if (!strategy || !strategy.todoItems || !strategy.preparationStrategy || !strategy.focusTopics) {
    return { success: false, error: 'Complete strategy data (strategy, topics, and todo list) is required.' };
  }

  try {
    const result = await dbSaveStrategyTodoList(userId, companyId, companyName, strategy);
    if (result.success) {
      revalidateTag(`user-profile-${userId}`);
      revalidateTag(`user-strategy-todo-lists-${userId}`);
      revalidateTag(`user-strategy-for-company-${companyId}-${userId}`);
    }
    return result;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to save strategy.';
    console.error('Error in saveStrategyTodoListAction:', error);
    return { success: false, error: message };
  }
}

/**
 * Fetches all strategy todo lists (including strategy text and focus topics) for a given user.
 * @param {string} userId - The ID of the user.
 * @returns {Promise<SavedStrategyTodoList[] | { error: string }>} Array of saved strategies or an error object.
 */
export async function getUserStrategyTodoListsAction(
  userId: string
): Promise<SavedStrategyTodoList[] | { error: string }> {
  if (!userId) return { error: 'User not authenticated. Cannot fetch saved strategies.' };
  try {
    return await dbGetUserStrategyTodoLists(userId);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch saved strategies due to an unknown error.';
    console.error('Error in getUserStrategyTodoListsAction:', error);
    return { error: message };
  }
}

/**
 * Fetches a specific saved strategy for a user and company.
 * @param {string} userId - The ID of the user.
 * @param {string} companyId - The ID of the company.
 * @returns {Promise<SavedStrategyTodoList | null | { error: string }>} The saved strategy or null if not found, or an error object.
 */
export async function getStrategyTodoListForCompanyAction(
  userId: string,
  companyId: string
): Promise<SavedStrategyTodoList | null | { error: string }> {
  if (!userId) return { error: 'User not authenticated.' };
  if (!companyId) return { error: 'Company ID is required.' };
  try {
    const result = await dbGetStrategyTodoListForCompany(userId, companyId);
    return result;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch strategy for company.';
    console.error('Error in getStrategyTodoListForCompanyAction:', error);
    return { error: message };
  }
}

/**
 * Updates the completion status of a specific item in a user's strategy todo list.
 * @param userId The ID of the user.
 * @param companyId The ID of the company whose todo list is being updated.
 * @param itemIndex The index of the item in the todo list array.
 * @param isCompleted The new completion status.
 * @returns {Promise<{ success: boolean; error?: string }>} Result of the operation.
 */
export async function updateStrategyTodoItemStatusAction(
  userId: string,
  companyId: string,
  itemIndex: number,
  isCompleted: boolean
): Promise<{ success: boolean; error?: string }> {
  if (!userId) return { success: false, error: 'User not authenticated.' };
  if (!companyId) return { success: false, error: 'Company ID is required.' };
  if (itemIndex < 0) return { success: false, error: 'Invalid item index.' };

  try {
    const result = await dbUpdateStrategyTodoItemStatus(userId, companyId, itemIndex, isCompleted);
    if (result.success) {
      revalidateTag(`user-profile-${userId}`);
      revalidateTag(`user-strategy-todo-lists-${userId}`);
      revalidateTag(`user-strategy-for-company-${companyId}-${userId}`);
    }
    return result;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update todo item status.';
    console.error('Error in updateStrategyTodoItemStatusAction:', error);
    return { success: false, error: message };
  }
}

    