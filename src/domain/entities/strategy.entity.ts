import { z } from "zod";

import type { FocusTopic, StrategyTodoItem } from "../value-objects/strategy.vo";

/**
 * @description Zod schema for validating saved strategy todo lists.
 * Enforces limits on array lengths and string sizes to prevent storage exhaustion/DoS.
 */
export const SavedStrategyTodoListSchema = z.object({
  companyId: z.string(),
  companyName: z.string().max(100, "Company name must be less than 100 characters."),
  savedAt: z.union([z.date(), z.any()]), // Allow Firestore Timestamp or Date
  preparationStrategy: z.string().max(10000, "Preparation strategy is too long."),
  focusTopics: z.array(z.object({
    topic: z.string().max(200, "Topic name too long."),
    reason: z.string().max(1000, "Topic reason too long.")
  })).max(50, "Too many focus topics."),
  items: z.array(z.object({
    text: z.string().max(500, "Todo item text too long."),
    isCompleted: z.boolean()
  })).max(100, "Too many todo items.")
});

/**
 * @description Represents a saved strategy todo list for a user and a company.
 * This now also includes the preparation strategy and focus topics.
 */
export interface SavedStrategyTodoList {
  companyId: string; // The ID of the company this list is for
  companyName: string;
  savedAt: Date; // Or Firestore Timestamp
  preparationStrategy: string;
  focusTopics: FocusTopic[];
  items: StrategyTodoItem[]; // 'items' is used for the todo list for consistency with previous naming
}
