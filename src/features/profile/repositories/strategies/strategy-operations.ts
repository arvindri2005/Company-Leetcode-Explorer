/**
 * Strategy Operations Module
 * Handles strategy CRUD operations
 */

import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";

import { db } from "@/shared/lib/api/firebase";
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
    const todoListDocRef = doc(db, "users", userId, "strategyTodoLists", companyId);
    try {
      const docSnap = await getDoc(todoListDocRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        const items = Array.isArray(data.items)
          ? data.items.map((item: unknown) => {
              const typedItem = item as Partial<StrategyTodoItem>;
              return {
                ...typedItem,
                text: typeof typedItem.text === "string" ? typedItem.text : "",
                isCompleted:
                  typeof typedItem.isCompleted === "boolean" ? typedItem.isCompleted : false,
              };
            })
          : [];
        const focusTopics = Array.isArray(data.focusTopics) ? data.focusTopics : [];
        return {
          companyId: data.companyId || companyId,
          companyName: data.companyName || "Unknown Company",
          savedAt: data.savedAt?.toDate
            ? data.savedAt.toDate()
            : new Date(data.savedAt || Date.now()),
          preparationStrategy: data.preparationStrategy || "",
          focusTopics: focusTopics as FocusTopic[],
          items: items as StrategyTodoItem[],
        } as SavedStrategyTodoList;
      }
      return null;
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
    const todoListDocRef = doc(db, "users", userId, "strategyTodoLists", companyId);

    const rawData = {
      companyId: companyId,
      companyName: companyName,
      savedAt: new Date(),
      preparationStrategy: strategyData.preparationStrategy,
      focusTopics: strategyData.focusTopics,
      items: strategyData.todoItems,
    };

    try {
      // Use validated data, casting to SavedStrategyTodoList is safe here as schema matches
      await setDoc(todoListDocRef, rawData as SavedStrategyTodoList, { merge: true });
      return { success: true };
    } catch (error) {
      // Security: Return generic error message to prevent leaking internal details
      Logger.error("Error saving strategy to Firestore", error);
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
    const todoListDocRef = doc(db, "users", userId, "strategyTodoLists", companyId);
    try {
      const docSnap = await getDoc(todoListDocRef);
      if (!docSnap.exists()) {
        return { success: false, error: "Todo list not found." };
      }
      const listData = docSnap.data() as SavedStrategyTodoList;
      if (!listData.items || itemIndex >= listData.items.length) {
        return { success: false, error: "Item index out of bounds." };
      }

      const updatedItems = listData.items.map((item, index) =>
        index === itemIndex ? { ...item, isCompleted: isCompleted } : item
      );

      await updateDoc(todoListDocRef, {
        items: updatedItems,
        savedAt: serverTimestamp(),
      });
      return { success: true };
    } catch (error) {
      // Security: Return generic error message to prevent leaking internal details
      Logger.error("Error updating todo item status in Firestore", error);
      return {
        success: false,
        error: "An unexpected error occurred while updating todo item.",
      };
    }
  }
}
