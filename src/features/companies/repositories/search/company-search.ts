/**
 * Company Search Module
 * Handles search and suggestion functionality for companies
 * Data source: Supabase (PostgreSQL)
 */

import { supabase } from "@/shared/lib/api/supabase";
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
 * Company Search Operations Implementation (Supabase)
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

      const { data, error } = await supabase
        .from("companies")
        .select("id, name, slug, logo")
        .ilike("normalized_name", `${sanitizedTerm}%`)
        .order("normalized_name", { ascending: true })
        .limit(safeLimit);

      if (error) {
        Logger.error("Error fetching company suggestions", error);
        throw error;
      }

      return (data || []).map(
        (row: { id: string; name: string; slug: string | null; logo: string | null }) => ({
          id: row.id,
          name: row.name,
          slug: row.slug || slugify(row.name),
          logo: row.logo || undefined,
        })
      ) as Array<Pick<Company, "id" | "name" | "slug" | "logo">>;
    } catch (error) {
      Logger.error("Error fetching company suggestions", error);
      throw error;
    }
  }
}
