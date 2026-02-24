/**
 * Strategy Operations Module
 *
 * Provides CRUD operations for user company preparation strategies.
 * Strategies are stored in the `user_strategies` table with JSON columns
 * for `focus_topics` and `todo_items`.
 *
 * @module strategy-operations
 */

import { createSupabaseBrowserClient } from "@/shared/lib/api/supabase-browser";
import { Logger } from "@/shared/lib/utils/logger";
import type {
  FocusTopic,
  GenerateCompanyStrategyOutput,
  SavedStrategyTodoList,
  StrategyTodoItem,
} from "@/shared/types";

/**
 * Interface for strategy operations.
 */
export interface StrategyOperations {
  /** Retrieve the strategy todo list for a specific company */
  getStrategyTodoListForCompany(
    userId: string,
    companyId: string
  ): Promise<SavedStrategyTodoList | null>;

  /** Save (create or update) a strategy todo list for a company */
  saveStrategyTodoList(
    userId: string,
    companyId: string,
    companyName: string,
    strategyData: Pick<
      GenerateCompanyStrategyOutput,
      "preparationStrategy" | "focusTopics" | "todoItems"
    >
  ): Promise<{ success: boolean; error?: string }>;

  /** Toggle the completion status of a single todo item */
  updateStrategyTodoItemStatus(
    userId: string,
    companyId: string,
    itemIndex: number,
    isCompleted: boolean
  ): Promise<{ success: boolean; error?: string }>;
}

/**
 * Supabase-backed implementation of {@link StrategyOperations}.
 */
export class StrategyOperationsImpl implements StrategyOperations {
  private supabase = createSupabaseBrowserClient();

  /**
   * Get the strategy todo list for a specific company.
   *
   * Uses `.single()` since we expect at most one strategy per user+company.
   * PGRST116 (no rows) is silently handled as a null return.
   *
   * @param userId - The user's uid
   * @param companyId - The company's unique identifier
   * @returns The strategy todo list, or null if none exists
   */
  async getStrategyTodoListForCompany(
    userId: string,
    companyId: string
  ): Promise<SavedStrategyTodoList | null> {
    if (!userId || !companyId) {
      Logger.debug("[StrategyOps.get] Skipped — missing userId or companyId", { userId, companyId });
      return null;
    }

    Logger.debug("[StrategyOps.get] Fetching strategy for company", { userId, companyId });

    try {
      const { data, error } = await this.supabase
        .from("user_strategies")
        .select("*")
        .eq("uid", userId)
        .eq("company_id", companyId)
        .single();

      // PGRST116 = no rows found — expected when user hasn't saved a strategy yet
      if (error && error.code !== "PGRST116") {
        Logger.error("[StrategyOps.get] Supabase query failed", error, { userId, companyId });
        throw error;
      }

      if (!data) {
        Logger.debug("[StrategyOps.get] No strategy found for company", { userId, companyId });
        return null;
      }

      // Map snake_case Supabase columns → camelCase domain object
      const result: SavedStrategyTodoList = {
        companyId: data.company_id || companyId,
        companyName: data.company_name || "Unknown Company",
        savedAt: data.saved_at ? new Date(data.saved_at) : new Date(data.created_at || Date.now()),
        preparationStrategy: data.preparation_strategy || "",
        focusTopics: (data.focus_topics as FocusTopic[]) || [],
        items: (data.todo_items as StrategyTodoItem[]) || [],
      } as SavedStrategyTodoList;

      Logger.debug("[StrategyOps.get] Strategy found", {
        userId,
        companyId,
        todoCount: result.items?.length ?? 0,
      });

      return result;
    } catch (error) {
      Logger.error("[StrategyOps.get] Unexpected error", error, { companyId, userId });
      return null;
    }
  }

  /**
   * Save a strategy todo list for a company.
   *
   * Uses a check-then-act pattern:
   *   1. Check if a strategy already exists for this user+company
   *   2. If exists → update the existing row
   *   3. If not → insert a new row
   *
   * Supabase handles the JSON serialization of `focus_topics` and
   * `todo_items` arrays automatically.
   *
   * @param userId - The user's uid
   * @param companyId - The company's unique identifier
   * @param companyName - The company's display name
   * @param strategyData - The AI-generated strategy data to persist
   * @returns Result indicating success or error
   */
  async saveStrategyTodoList(
    userId: string,
    companyId: string,
    companyName: string,
    strategyData: Pick<
      GenerateCompanyStrategyOutput,
      "preparationStrategy" | "focusTopics" | "todoItems"
    >
  ): Promise<{ success: boolean; error?: string }> {
    if (!userId || !companyId) {
      Logger.debug("[StrategyOps.save] Skipped — missing required params", { userId, companyId });
      return { success: false, error: "User ID and Company ID are required." };
    }

    Logger.debug("[StrategyOps.save] Saving strategy", {
      userId,
      companyId,
      companyName,
      todoCount: strategyData.todoItems?.length ?? 0,
    });

    try {
      // Step 1: Check if a strategy row already exists
      const { data: existing } = await this.supabase
        .from("user_strategies")
        .select("id")
        .eq("uid", userId)
        .eq("company_id", companyId)
        .single();

      // Map camelCase domain fields → snake_case Supabase columns
      const dbRow = {
        uid: userId,
        company_id: companyId,
        company_name: companyName,
        preparation_strategy: strategyData.preparationStrategy,
        focus_topics: strategyData.focusTopics, // Supabase handles JSON array serialization
        todo_items: strategyData.todoItems,
        saved_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      if (existing) {
         // Step 2a: Update existing strategy row
         Logger.debug("[StrategyOps.save] Existing strategy found — updating", {
           userId,
           companyId,
           existingId: existing.id,
         });

         const { error } = await this.supabase
          .from("user_strategies")
          .update(dbRow)
          .eq("id", existing.id);
          
         if (error) {
           Logger.error("[StrategyOps.save] Update failed", error, { userId, companyId });
           throw error;
         }
      } else {
         // Step 2b: Insert new strategy row
         Logger.debug("[StrategyOps.save] No existing strategy — inserting new row", {
           userId,
           companyId,
         });

         const { error } = await this.supabase
          .from("user_strategies")
          .insert(dbRow);
          
         if (error) {
           Logger.error("[StrategyOps.save] Insert failed", error, { userId, companyId });
           throw error;
         }
      }

      Logger.info("[StrategyOps.save] Strategy saved successfully", { userId, companyId });
      return { success: true };
    } catch (error) {
      Logger.error("[StrategyOps.save] Unexpected error", error, { userId, companyId });
      return { success: false, error: "An unexpected error occurred while saving strategy." };
    }
  }

  /**
   * Update the completion status of a single todo item.
   *
   * This is a read-modify-write operation:
   *   1. Fetch the current todo_items JSON array
   *   2. Modify the item at the given index
   *   3. Write the entire array back
   *
   * Note: This is not atomic — concurrent updates to different items in
   * the same list could cause a lost update. Acceptable for single-user use.
   *
   * @param userId - The user's uid
   * @param companyId - The company's unique identifier
   * @param itemIndex - Zero-based index of the todo item to update
   * @param isCompleted - The new completion status
   * @returns Result indicating success or error
   */
  async updateStrategyTodoItemStatus(
    userId: string,
    companyId: string,
    itemIndex: number,
    isCompleted: boolean
  ): Promise<{ success: boolean; error?: string }> {
    if (!userId || !companyId || itemIndex < 0) {
      Logger.debug("[StrategyOps.updateItem] Skipped — invalid params", {
        userId,
        companyId,
        itemIndex,
      });
      return {
        success: false,
        error: "Invalid parameters for updating todo item.",
      };
    }

    Logger.debug("[StrategyOps.updateItem] Updating todo item status", {
      userId,
      companyId,
      itemIndex,
      isCompleted,
    });

    try {
      // Step 1: Fetch the current todo_items array
      const { data, error: fetchError } = await this.supabase
        .from("user_strategies")
        .select("id, todo_items")
        .eq("uid", userId)
        .eq("company_id", companyId)
        .single();

      if (fetchError || !data) {
         Logger.warn("[StrategyOps.updateItem] Strategy not found", { userId, companyId });
         return { success: false, error: "Todo list not found." };
      }

      const items = (data.todo_items as StrategyTodoItem[]) || [];

      // Step 2: Validate the index bounds
      if (itemIndex >= items.length) {
         Logger.warn("[StrategyOps.updateItem] Item index out of bounds", {
           userId,
           companyId,
           itemIndex,
           totalItems: items.length,
         });
         return { success: false, error: "Item index out of bounds." };
      }

      // Step 3: Modify the item and write back the entire array
      items[itemIndex].isCompleted = isCompleted;

      Logger.debug("[StrategyOps.updateItem] Writing updated todo_items array", {
        userId,
        companyId,
        updatedIndex: itemIndex,
      });

      const { error: updateError } = await this.supabase
        .from("user_strategies")
        .update({
           todo_items: items,
           updated_at: new Date().toISOString()
        })
        .eq("id", data.id);

      if (updateError) {
        Logger.error("[StrategyOps.updateItem] Supabase update failed", updateError, {
          userId,
          companyId,
          itemIndex,
        });
        throw updateError;
      }

      Logger.info("[StrategyOps.updateItem] Todo item updated successfully", {
        userId,
        companyId,
        itemIndex,
        isCompleted,
      });

      return { success: true };
    } catch (error) {
      Logger.error("[StrategyOps.updateItem] Unexpected error", error, {
        userId,
        companyId,
        itemIndex,
      });
      return {
        success: false,
        error: "An unexpected error occurred while updating todo item.",
      };
    }
  }
}
