import { QueryConstraint } from "firebase/firestore";
import { ProblemSummaryDTO } from "@/types";

export interface FilterContext {
  companyId: string;
  canUseInOperator: boolean;
}

export interface FilterResult {
  constraints: QueryConstraint[];
  applied: boolean;
  usesInOperator: boolean;
}

/**
 * Interface for implementing a problem filter.
 * T = The type of the filter value (e.g., string[], number, etc.)
 */
export interface ProblemFilter<T = unknown> {
  key: string;
  
  /**
   * Generates Firestore query constraints based on the filter value.
   * Respected the context to determine if 'in' operator can be used.
   * 
   * @param value The value of the filter (e.g. ["Easy", "Medium"])
   * @param context The filter context containing companyId and query capabilities
   */
  getConstraints(value: T, context: FilterContext): FilterResult;

  /**
   * Checks if a problem matches the filter in memory.
   * This is used for:
   * 1. The "Semi-Optimized" path where we fetch a broad set and filter down.
   * 2. Verifying consistency after a query.
   * 
   * @param problem The problem to check
   * @param value The value of the filter
   * @param companyId The ID of the company context
   */
  matches(problem: ProblemSummaryDTO, value: T, companyId: string): boolean;

  /**
   * Type guard to validate if a runtime value matches the expected filter type T.
   * This ensures type safety when iterating over generic filters in the registry.
   */
  isValidValue(value: unknown): value is T;
}
