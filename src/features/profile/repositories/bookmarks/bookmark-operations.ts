/**
 * Bookmark Operations Module
 * Handles bookmark CRUD operations
 */

import {
  arrayRemove,
  arrayUnion,
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  writeBatch,
} from "firebase/firestore";

import { db } from "@/shared/lib/api/firebase";
import { Logger } from "@/shared/lib/utils/logger";
import type { BookmarkedProblemInfo } from "@/shared/types";

const MAX_PAGE_SIZE = 50;

/**
 * Interface for bookmark operations
 */
export interface BookmarkOperations {
  /**
   * Get bookmarked problems info for a user
   */
  getBookmarkedProblemsInfo(userId: string): Promise<BookmarkedProblemInfo[]>;

  /**
   * Toggle bookmark status for a problem
   */
  toggleBookmarkProblem(
    userId: string,
    problemId: string,
    companySlug: string,
    problemSlug: string
  ): Promise<{ isBookmarked: boolean; error?: string }>;
}

/**
 * Implementation of bookmark operations
 */
export class BookmarkOperationsImpl implements BookmarkOperations {
  /**
   * Get bookmarked problems info for a user
   * @param userId - The user's unique identifier
   * @returns Array of bookmarked problem info
   */
  async getBookmarkedProblemsInfo(userId: string): Promise<BookmarkedProblemInfo[]> {
    if (!userId) {
      return [];
    }
    try {
      const q = query(
        collection(db, "users", userId, "bookmarkedProblems"),
        orderBy("bookmarkedAt", "desc"),
        limit(MAX_PAGE_SIZE)
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs
        .map((docSnap) => {
          const data = docSnap.data();
          return {
            problemId: docSnap.id,
            companySlug: data.companySlug,
            problemSlug: data.problemSlug,
            bookmarkedAt: data.bookmarkedAt?.toDate(),
          } as BookmarkedProblemInfo;
        })
        .filter((info) => info.companySlug && info.problemSlug);
    } catch (error) {
      Logger.error(`Error fetching bookmarked problems info`, error, { userId });
      return [];
    }
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
    if (!userId || !problemId) {
      return {
        isBookmarked: false,
        error: "User ID and Problem ID are required.",
      };
    }
    const bookmarkDocRef = doc(db, "users", userId, "bookmarkedProblems", problemId);
    const aggregateDocRef = doc(db, "users", userId, "aggregates", "problemStats");

    try {
      const docSnap = await getDoc(bookmarkDocRef);
      const batch = writeBatch(db);
      let isBookmarked = false;

      if (docSnap.exists()) {
        batch.delete(bookmarkDocRef);
        batch.set(
          aggregateDocRef,
          {
            bookmarkedProblemIds: arrayRemove(problemId),
          },
          { merge: true }
        );
        isBookmarked = false;
      } else {
        batch.set(bookmarkDocRef, {
          bookmarkedAt: serverTimestamp(),
          companySlug: companySlug,
          problemSlug: problemSlug,
        });
        batch.set(
          aggregateDocRef,
          {
            bookmarkedProblemIds: arrayUnion(problemId),
          },
          { merge: true }
        );
        isBookmarked = true;
      }

      await batch.commit();
      return { isBookmarked };
    } catch (error) {
      // Security: Return generic error message to prevent leaking internal details
      Logger.error("Error toggling bookmark in Firestore", error);
      return {
        isBookmarked: false,
        error: "An unexpected error occurred while toggling bookmark.",
      };
    }
  }
}
