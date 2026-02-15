/**
 * Strategy Queries Module
 * Handles strategy query operations
 */

import { createSupabaseBrowserClient } from "@/shared/lib/api/supabase-browser";
import { Logger } from "@/shared/lib/utils/logger";
import type {
  FocusTopic,
  SavedStrategyTodoList,
  StrategyTodoItem,
} from "@/shared/types";

const MAX_PAGE_SIZE = 50;

/**
 * Interface for strategy query operations
 */
export interface StrategyQueries {
  /**
   * Get user's strategy todo lists
   */
  getUserStrategyTodoLists(userId: string): Promise<SavedStrategyTodoList[]>;
}

/**
 * Implementation of strategy query operations
 */
export class StrategyQueriesImpl implements StrategyQueries {
  private supabase = createSupabaseBrowserClient();

  /**
   * Get user's strategy todo lists
   * @param userId - The user's unique identifier
   * @returns Array of saved strategy todo lists
   */
  async getUserStrategyTodoLists(userId: string): Promise<SavedStrategyTodoList[]> {
    if (!userId) {
      return [];
    }
    try {
      const { data, error } = await this.supabase
        .from("user_strategies")
        .select("*")
        .eq("uid", userId)
        .order("company_name", { ascending: true }) // Changed from companyName to company_name
        .limit(MAX_PAGE_SIZE);

      if (error) throw error;

      return (data || []).map((row) => ({
        companyId: row.company_id,
        companyName: row.company_name || "Unknown Company",
        savedAt: row.saved_at ? new Date(row.saved_at) : new Date(row.created_at || Date.now()),
        preparationStrategy: row.preparation_strategy || "",
        focusTopics: (row.focus_topics as FocusTopic[]) || [],
        items: (row.todo_items as StrategyTodoItem[]) || [],
      } as SavedStrategyTodoList));
    } catch (error) {
      Logger.error(`Error fetching strategy todo lists`, error, { userId });
      return [];
    }
  }
}
