import { z } from "zod";

/**
 * @description Zod schema for a key topic to focus on.
 */
export const FocusTopicSchema = z.object({
  topic: z
    .string()
    .describe(
      "A key topic or concept to focus on (e.g., 'Dynamic Programming', 'Graph Traversal', 'System Design Fundamentals for Scalability').",
    ),
  reason: z
    .string()
    .describe(
      "A brief explanation (1-2 sentences) of why this topic is particularly relevant for interviews at this company, based on the provided problem data and target role level if specified.",
    ),
});

/**
 * @description Represents a key topic to focus on for interview preparation.
 */
export type FocusTopic = z.infer<typeof FocusTopicSchema>;

/**
 * @description Zod schema for a single actionable item in a strategy todo list.
 */
export const StrategyTodoItemSchema = z.object({
  text: z
    .string()
    .describe("A single, concise, actionable task for the user to complete."),
  isCompleted: z
    .boolean()
    .default(false)
    .describe("Whether the task is completed. Defaults to false."),
});

/**
 * @description Represents a single actionable item in a strategy to-do list.
 */
export type StrategyTodoItem = z.infer<typeof StrategyTodoItemSchema>;
