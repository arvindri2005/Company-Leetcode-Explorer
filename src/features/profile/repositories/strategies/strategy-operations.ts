/**
 * Strategy Operations Module
 * Handles strategy CRUD operations
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
 * Interface for strategy operations
 */
export interface StrategyOperations {
  /**
   * Get strategy todo list for a specific company
   */
  getStrategyTodoListForCompany(
    userId: string,
    companyId: string
  ): Promise<SavedStrategyTodoList | null>;

  /**
   * Save strategy todo list for a company
   */
  saveStrategyTodoList(
    userId: string,
    companyId: string,
    companyName: string,
    strategyData: Pick<
      GenerateCompanyStrategyOutput,
      "preparationStrategy" | "focusTopics" | "todoItems"
    >
  ): Promise<{ success: boolean; error?: string }>;

  /**
   * Update status of a todo item in a strategy list
   */
  updateStrategyTodoItemStatus(
    userId: string,
    companyId: string,
    itemIndex: number,
    isCompleted: boolean
  ): Promise<{ success: boolean; error?: string }>;
}

/**
 * Implementation of strategy operations
 */
export class StrategyOperationsImpl implements StrategyOperations {
  private supabase = createSupabaseBrowserClient();

  /**
   * Get strategy todo list for a specific company
   * @param userId - The user's unique identifier
   * @param companyId - The company's unique identifier
   * @returns The strategy todo list if found, null otherwise
   */
  async getStrategyTodoListForCompany(
    userId: string,
    companyId: string
  ): Promise<SavedStrategyTodoList | null> {
    if (!userId || !companyId) {
      return null;
    }
    
    try {
      const { data, error } = await this.supabase
        .from("user_strategies")
        .select("*")
        .eq("uid", userId)
        .eq("company_id", companyId)
        .single();

      if (error && error.code !== "PGRST116") {
        throw error;
      }

      if (!data) {return null;}

      // Map snake_case to domain object
      return {
        companyId: data.company_id || companyId,
        companyName: data.company_name || "Unknown Company",
        savedAt: data.saved_at ? new Date(data.saved_at) : new Date(data.created_at || Date.now()),
        preparationStrategy: data.preparation_strategy || "",
        focusTopics: (data.focus_topics as FocusTopic[]) || [],
        items: (data.todo_items as StrategyTodoItem[]) || [],
      } as SavedStrategyTodoList;
    } catch (error) {
      Logger.error(`Error fetching strategy`, error, { companyId, userId });
      return null;
    }
  }

  /**
   * Save strategy todo list for a company
   * @param userId - The user's unique identifier
   * @param companyId - The company's unique identifier
   * @param companyName - The company's name
   * @param strategyData - The strategy data to save
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
      return { success: false, error: "User ID and Company ID are required." };
    }
    
    try {
      // Check if exists
      const { data: existing } = await this.supabase
        .from("user_strategies")
        .select("id")
        .eq("uid", userId)
        .eq("company_id", companyId)
        .single();
        
      const dbRow = {
        uid: userId,
        company_id: companyId,
        company_name: companyName,
        preparation_strategy: strategyData.preparationStrategy,
        focus_topics: strategyData.focusTopics, // Supabase handles JSON array automatically
        todo_items: strategyData.todoItems,
        saved_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      if (existing) {
         // Update
         const { error } = await this.supabase
          .from("user_strategies")
          .update(dbRow)
          .eq("id", existing.id);
          
         if (error) {throw error;}
      } else {
         // Insert
         const { error } = await this.supabase
          .from("user_strategies")
          .insert(dbRow);
          
         if (error) {throw error;}
      }

      return { success: true };
    } catch (error) {
      Logger.error("Error saving strategy to Supabase", error);
      return { success: false, error: "An unexpected error occurred while saving strategy." };
    }
  }

  /**
   * Update status of a todo item in a strategy list
   * @param userId - The user's unique identifier
   * @param companyId - The company's unique identifier
   * @param itemIndex - The index of the item to update
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
      return {
        success: false,
        error: "Invalid parameters for updating todo item.",
      };
    }
    
    try {
      // 1. Fetch existing items
      const { data, error: fetchError } = await this.supabase
        .from("user_strategies")
        .select("id, todo_items")
        .eq("uid", userId)
        .eq("company_id", companyId)
        .single();

      if (fetchError || !data) {
         return { success: false, error: "Todo list not found." };
      }

      const items = (data.todo_items as StrategyTodoItem[]) || [];
      
      if (itemIndex >= items.length) {
         return { success: false, error: "Item index out of bounds." };
      }

      // 2. Modify item
      items[itemIndex].isCompleted = isCompleted;

      // 3. Update
      const { error: updateError } = await this.supabase
        .from("user_strategies")
        .update({
           todo_items: items,
           updated_at: new Date().toISOString() // saved_at might be preserved or updated? sticking to updated_at
        })
        .eq("id", data.id);

      if (updateError) {throw updateError;}
      
      return { success: true };
    } catch (error) {
      Logger.error("Error updating todo item status in Supabase", error);
      return {
        success: false,
        error: "An unexpected error occurred while updating todo item.",
      };
    }
  }
}
