/**
 * Bookmark Queries Module
 * Handles bookmark query operations
 */

import {
  collection,
  type CollectionReference,
  documentId,
  getDocs,
  type Query,
  query,
  where,
} from "firebase/firestore";

import { db } from "@/shared/lib/api/firebase";
import { Logger } from "@/shared/lib/utils/logger";

/**
 * Interface for bookmark query operations
 */
export interface BookmarkQueries {
  /**
   * Get bookmarks for specific problem IDs
   */
  getBookmarksForIds(userId: string, problemIds: string[]): Promise<Set<string>>;
}

/**
 * Implementation of bookmark query operations
 */
export class BookmarkQueriesImpl implements BookmarkQueries {
  /**
   * Get bookmarks for specific problem IDs
   * @param userId - The user's unique identifier
   * @param problemIds - Array of problem IDs to check bookmarks for
   * @returns Set of bookmarked problem IDs
   */
  async getBookmarksForIds(userId: string, problemIds: string[]): Promise<Set<string>> {
    if (!userId || !problemIds || problemIds.length === 0) {
      return new Set();
    }
    const bookmarkedIds = new Set<string>();

    try {
      const bookmarksColRef = collection(db, "users", userId, "bookmarkedProblems");

      const querySnapshots = await this.fetchDocsByIds(bookmarksColRef, problemIds);

      // Flatten snapshots to reduce nesting
      const allDocs = querySnapshots.flatMap((qs) => qs.docs);

      for (const docSnap of allDocs) {
        bookmarkedIds.add(docSnap.id);
      }

      return bookmarkedIds;
    } catch (error) {
      Logger.error(`Error fetching bookmarks`, error, { userId });
      return new Set();
    }
  }

  /**
   * Helper to fetch documents by IDs in chunks of 30 to satisfy Firestore "IN" query limits.
   */
  private async fetchDocsByIds(
    collectionRef: CollectionReference | Query,
    ids: string[]
  ) {
    const CHUNK_SIZE = 30;
    const chunks = [];
    for (let i = 0; i < ids.length; i += CHUNK_SIZE) {
      chunks.push(ids.slice(i, i + CHUNK_SIZE));
    }

    const queryPromises = chunks.map((chunk) => {
      const q = query(collectionRef, where(documentId(), "in", chunk));
      return getDocs(q);
    });

    return Promise.all(queryPromises);
  }
}
