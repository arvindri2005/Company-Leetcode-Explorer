/**
 * Company Search Module
 * Handles search and suggestion functionality for companies
 */

import type { Firestore } from "firebase/firestore";
import {
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  where,
} from "firebase/firestore";

import { db } from "@/shared/lib/api/firebase";
import { slugify } from "@/shared/lib/utils";
import { Logger } from "@/shared/lib/utils/logger";
import type { Company } from "@/shared/types";

const MAX_SUGGESTION_LIMIT = 20;
const MAX_SEARCH_TERM_LENGTH = 100;

/**
 * Interface for Company Search Operations
 */
export interface CompanySearchOperations {
  fetchCompanySuggestions(
    searchTerm: string,
    limitNum?: number
  ): Promise<Array<Pick<Company, "id" | "name" | "slug" | "logo">>>;
}

/**
 * Get Firestore instance with validation
 */
function getFirestore(): Firestore {
  if (!db) {
    throw new Error(
      "Firestore is not initialized. Check your Firebase configuration."
    );
  }
  return db;
}

/**
 * Company Search Operations Implementation
 */
export class CompanySearch implements CompanySearchOperations {
  /**
   * Fetch company suggestions for autocomplete
   * @param searchTerm - The search term to match
   * @param limitNum - Maximum number of suggestions to return (default: 5)
   * @returns Array of company suggestions with id, name, slug, and logo
   */
  async fetchCompanySuggestions(
    searchTerm: string,
    limitNum: number = 5
  ): Promise<Array<Pick<Company, "id" | "name" | "slug" | "logo">>> {
    const sanitizedTerm = searchTerm
      ?.trim()
      .slice(0, MAX_SEARCH_TERM_LENGTH)
      .toLowerCase();

    if (!sanitizedTerm || sanitizedTerm.length < 1) {
      return [];
    }

    try {
      // Security: Clamp limit
      const safeLimit = Math.min(limitNum, MAX_SUGGESTION_LIMIT);

      const companiesCol = collection(getFirestore(), "companies");

      const q = query(
        companiesCol,
        orderBy("normalizedName"),
        where("normalizedName", ">=", sanitizedTerm),
        where("normalizedName", "<=", sanitizedTerm + "\uf8ff"),
        limit(safeLimit)
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map((docSnap) => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          name: data.name,
          slug: data.slug || slugify(data.name),
          logo: data.logo,
        } as Pick<Company, "id" | "name" | "slug" | "logo">;
      });
    } catch (error) {
      Logger.error("Error fetching company suggestions", error);
      throw error;
    }
  }
}
