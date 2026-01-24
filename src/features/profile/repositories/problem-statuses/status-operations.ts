/**
 * Problem Status Operations Module
 * Handles problem status CRUD operations
 */

import {
  arrayUnion,
  collection,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  writeBatch,
} from "firebase/firestore";

import { db } from "@/lib/api/firebase";
import { Logger } from "@/lib/utils/logger";
import type { ProblemStatus, UserProblemStatusInfo } from "@/types";

/**
 * Interface for problem status operations
 */
export interface StatusOperations {
  /**
   * Get all problem statuses for a user
   */
  getAllUserProblemStatuses(userId: string): Promise<Record<string, UserProblemStatusInfo>>;

  /**
   * Get user's global problem stats
   */
  getUserGlobalProblemStats(userId: string): Promise<{
    solvedProblemIds: string[];
    attemptedProblemIds: string[];
    bookmarkedProblemIds: string[];
  }>;

  /**
   * Set problem status for a user
   */
  setProblemStatus(
    userId: string,
    problemId: string,
    status: ProblemStatus,
    companySlug: string,
    problemSlug: string
  ): Promise<{ success: boolean; error?: string }>;
}

/**
 * Implementation of problem status operations
 */
export class StatusOperationsImpl implements StatusOperations {
  /**
   * Get all problem statuses for a user
   * @param userId - The user's unique identifier
   * @returns Record of problem ID to status info
   */
  async getAllUserProblemStatuses(
    userId: string
  ): Promise<Record<string, UserProblemStatusInfo>> {
    if (!userId) {
      return {};
    }
    const statuses: Record<string, UserProblemStatusInfo> = {};
    try {
      const progressColRef = collection(db, "users", userId, "problemProgress");
      const q = query(progressColRef, orderBy("updatedAt", "desc"));
      const querySnapshot = await getDocs(q);
      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        if (data.status && data.companySlug && data.problemSlug) {
          statuses[docSnap.id] = {
            problemId: docSnap.id,
            status: data.status as ProblemStatus,
            companySlug: data.companySlug,
            problemSlug: data.problemSlug,
            updatedAt: data.updatedAt?.toDate(),
          };
        }
      });
      return statuses;
    } catch (error) {
      Logger.error(`Error fetching all problem statuses`, error, { userId });
      return {};
    }
  }

  /**
   * Get user's global problem stats
   * @param userId - The user's unique identifier
   * @returns User's global problem stats
   */
  async getUserGlobalProblemStats(userId: string): Promise<{
    solvedProblemIds: string[];
    attemptedProblemIds: string[];
    bookmarkedProblemIds: string[];
  }> {
    if (!userId) {
      return { solvedProblemIds: [], attemptedProblemIds: [], bookmarkedProblemIds: [] };
    }
    try {
      const docRef = doc(db, "users", userId, "aggregates", "problemStats");
      const docSnap = await (await import("firebase/firestore")).getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        return {
          solvedProblemIds: (data.solvedProblemIds as string[]) || [],
          attemptedProblemIds: (data.attemptedProblemIds as string[]) || [],
          bookmarkedProblemIds: (data.bookmarkedProblemIds as string[]) || [],
        };
      }
      return { solvedProblemIds: [], attemptedProblemIds: [], bookmarkedProblemIds: [] };
    } catch (error) {
      Logger.error(`Error fetching global problem stats`, error, { userId });
      return { solvedProblemIds: [], attemptedProblemIds: [], bookmarkedProblemIds: [] };
    }
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
    if (!userId || !problemId) {
      return { success: false, error: "User ID and Problem ID are required." };
    }

    const statusDocRef = doc(db, "users", userId, "problemProgress", problemId);
    const aggregateDocRef = doc(db, "users", userId, "aggregates", "problemStats");

    try {
      const batch = writeBatch(db);

      // 1. Update individual problem status
      if (status === "none") {
        batch.delete(statusDocRef);
      } else {
        batch.set(statusDocRef, {
          status: status,
          updatedAt: serverTimestamp(),
          companySlug: companySlug,
          problemSlug: problemSlug,
        });
      }

      // 2. Update aggregate stats
      // Note: We only ADD to the aggregate arrays as requested.
      // We do not remove from them if status changes or is removed, to keep it as a historical record of "ever solved" or "ever attempted".
      // If stricter sync is needed later, we can add logic to remove from other arrays.
      if (status === "solved") {
        batch.set(
          aggregateDocRef,
          {
            solvedProblemIds: arrayUnion(problemId),
          },
          { merge: true }
        );
      } else if (status === "attempted") {
        batch.set(
          aggregateDocRef,
          {
            attemptedProblemIds: arrayUnion(problemId),
          },
          { merge: true }
        );
      }

      await batch.commit();
      return { success: true };
    } catch (error) {
      // Security: Return generic error message to prevent leaking internal details
      Logger.error("Error setting problem status in Firestore", error);
      return {
        success: false,
        error: "An unexpected error occurred while updating problem status.",
      };
    }
  }
}
