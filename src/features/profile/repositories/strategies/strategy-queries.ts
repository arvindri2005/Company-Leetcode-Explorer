/**
 * Strategy Queries Module
 *
 * Provides read-only query operations for user strategy todo lists.
 * Used on the profile page to display all strategies across companies.
 *
 * @module strategy-queries
 */

import { createSupabaseBrowserClient } from "@/shared/lib/api/supabase-browser";
import { Logger } from "@/shared/lib/utils/logger";
import type {
  FocusTopic,
  SavedStrategyTodoList,
  StrategyTodoItem,
} from "@/shared/types";

/** Maximum number of strategy rows returned per query (pagination guard) */
const MAX_PAGE_SIZE = 50;

/**
 * Interface for strategy query operations.
 */
export interface StrategyQueries {
  /** Retrieve all saved strategy todo lists for a user, sorted by company name */
  getUserStrategyTodoLists(userId: string): Promise<SavedStrategyTodoList[]>;
}

/**
 * Supabase-backed implementation of {@link StrategyQueries}.
 */
export class StrategyQueriesImpl implements StrategyQueries {
  private supabase = createSupabaseBrowserClient();

  /**
   * Get all saved strategy todo lists for a user.
   *
   * Returns all strategies sorted alphabetically by company name.
   * JSON columns (`focus_topics`, `todo_items`) are cast to their
   * respective TypeScript types.
   *
   * @param userId - The user's uid
   * @returns Array of saved strategy todo lists
   */
  async getUserStrategyTodoLists(userId: string): Promise<SavedStrategyTodoList[]> {
    if (!userId) {
      Logger.debug("[StrategyQueries.getAll] Skipped — empty userId");
      return [];
    }

    Logger.debug("[StrategyQueries.getAll] Fetching all strategy todo lists", { userId });

    try {
      const { data, error } = await this.supabase
        .from("user_strategies")
        .select("*")
        .eq("uid", userId)
        .order("company_name", { ascending: true })
        .limit(MAX_PAGE_SIZE);

      if (error) {
        Logger.error("[StrategyQueries.getAll] Supabase query failed", error, { userId });
        throw error;
      }

      // Map snake_case Supabase columns → camelCase domain objects
      const results = (data || []).map((row) => ({
        companyId: row.company_id,
        companyName: row.company_name || "Unknown Company",
        savedAt: row.saved_at ? new Date(row.saved_at) : new Date(row.created_at || Date.now()),
        preparationStrategy: row.preparation_strategy || "",
        focusTopics: (row.focus_topics as FocusTopic[]) || [],
        items: (row.todo_items as StrategyTodoItem[]) || [],
      } as SavedStrategyTodoList));

      Logger.debug("[StrategyQueries.getAll] Strategy lists fetched", {
        userId,
        count: results.length,
      });

      return results;
    } catch (error) {
      Logger.error("[StrategyQueries.getAll] Unexpected error", error, { userId });
      return [];
    }
  }
}
