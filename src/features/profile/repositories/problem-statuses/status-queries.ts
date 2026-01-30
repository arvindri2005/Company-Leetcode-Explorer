/**
 * Problem Status Queries Module
 * Handles problem status query operations
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
import type { ProblemStatus, UserProblemStatusInfo } from "@/shared/types";

/**
 * Interface for problem status query operations
 */
export interface StatusQueries {
  /**
   * Get problem statuses for specific problem IDs
   */
  getProblemStatusesForIds(
    userId: string,
    problemIds: string[]
  ): Promise<Record<string, UserProblemStatusInfo>>;
}

/**
 * Implementation of problem status query operations
 */
export class StatusQueriesImpl implements StatusQueries {
  /**
   * Get problem statuses for specific problem IDs
   * @param userId - The user's unique identifier
   * @param problemIds - Array of problem IDs to fetch statuses for
   * @returns Record of problem ID to status info
   */
  async getProblemStatusesForIds(
    userId: string,
    problemIds: string[]
  ): Promise<Record<string, UserProblemStatusInfo>> {
    if (!userId || !problemIds || problemIds.length === 0) {
      return {};
    }
    const statuses: Record<string, UserProblemStatusInfo> = {};

    try {
      const progressColRef = collection(db, "users", userId, "problemProgress");
      const querySnapshots = await this.fetchDocsByIds(progressColRef, problemIds);

      // Flatten snapshots to reduce nesting and simplify iteration
      const allDocs = querySnapshots.flatMap((qs) => qs.docs);

      for (const docSnap of allDocs) {
        const data = docSnap.data();
        if (!data.status) {
          continue;
        }

        statuses[docSnap.id] = {
          problemId: docSnap.id,
          status: data.status as ProblemStatus,
          companySlug: data.companySlug,
          problemSlug: data.problemSlug,
          updatedAt: data.updatedAt?.toDate(),
        };
      }

      return statuses;
    } catch (error) {
      Logger.error(`Error fetching problem statuses`, error, { userId });
      return {};
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
