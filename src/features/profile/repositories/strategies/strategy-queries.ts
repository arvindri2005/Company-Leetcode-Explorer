/**
 * Strategy Queries Module
 * Handles strategy query operations
 */

import {
  collection,
  getDocs,
  limit,
  orderBy,
  query,
} from "firebase/firestore";

import { db } from "@/shared/lib/api/firebase";
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
      const todoListsColRef = collection(db, "users", userId, "strategyTodoLists");
      const q = query(todoListsColRef, orderBy("companyName", "asc"), limit(MAX_PAGE_SIZE));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map((docSnap) => {
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
          companyId: data.companyId || docSnap.id,
          companyName: data.companyName || "Unknown Company",
          savedAt: data.savedAt?.toDate
            ? data.savedAt.toDate()
            : new Date(data.savedAt || Date.now()),
          preparationStrategy: data.preparationStrategy || "",
          focusTopics: focusTopics as FocusTopic[],
          items: items as StrategyTodoItem[],
        } as SavedStrategyTodoList;
      });
    } catch (error) {
      Logger.error(`Error fetching strategy todo lists`, error, { userId });
      return [];
    }
  }
}
