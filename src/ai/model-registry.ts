/**
 * @fileoverview Defines the Model Registry and Strategy for AI model selection.
 * 
 * This module allows the application to decouple specific model versions (e.g., "gemini-1.5-flash")
 * from their intended usage (e.g., "fast", "reasoning"). This enables swapping models
 * globally or per-task without modifying the core flow logic.
 */

export const AI_MODELS = {
  // The lightweight, low-latency model for real-time interactions
  FAST: "googleai/gemini-flash-lite-latest",
  
  // The capable, balanced model for standard tasks
  STANDARD: "googleai/gemini-flash-lite-latest", // Currently same as fast, but can be split
  
  // The high-intelligence model for complex reasoning or coding tasks
  REASONING: "googleai/gemini-pro-1.5",
} as const;

export type AIModelIntent = "fast" | "standard" | "reasoning";

/**
 * Retrieves the appropriate model identifier for a given intent.
 * 
 * @param {AIModelIntent} intent - The purpose of the AI task (e.g., 'fast' for autocomplete, 'reasoning' for deep analysis).
 * @returns {string} The model identifier string.
 */
export function getModelForIntent(intent: AIModelIntent): string {
  switch (intent) {
    case "fast":
      return AI_MODELS.FAST;
    case "reasoning":
      return AI_MODELS.REASONING;
    case "standard":
    default:
      return AI_MODELS.STANDARD;
  }
}
