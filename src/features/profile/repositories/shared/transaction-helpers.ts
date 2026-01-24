/**
 * Shared Transaction Helpers Module
 * Common transaction utilities used across repository modules
 */

import {
  type CollectionReference,
  documentId,
  getDocs,
  type Query,
  query,
  where,
} from "firebase/firestore";

/**
 * Interface for transaction helpers
 */
export interface TransactionHelpers {
  /**
   * Fetch documents by IDs in chunks to satisfy Firestore "IN" query limits
   */
  fetchDocsByIds(
    collectionRef: CollectionReference | Query,
    ids: string[]
  ): Promise<Awaited<ReturnType<typeof getDocs>>[]>;
}

/**
 * Implementation of transaction helpers
 */
export class TransactionHelpersImpl implements TransactionHelpers {
  /**
   * Helper to fetch documents by IDs in chunks of 30 to satisfy Firestore "IN" query limits.
   * @param collectionRef - The collection or query reference
   * @param ids - Array of document IDs to fetch
   * @returns Array of query snapshots
   */
  async fetchDocsByIds(
    collectionRef: CollectionReference | Query,
    ids: string[]
  ): Promise<Awaited<ReturnType<typeof getDocs>>[]> {
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
