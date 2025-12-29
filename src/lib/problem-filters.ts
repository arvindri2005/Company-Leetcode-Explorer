import { QueryConstraint, where } from "firebase/firestore";
import { DifficultyFilter, LastAskedFilter } from "@/types";

/**
 * Interface representing the context available to a filter.
 * Contains the filter values and other relevant parameters.
 */
export interface ProblemFilterContext {
  companyId: string;
  difficultyFilter?: DifficultyFilter[];
  lastAskedFilter?: LastAskedFilter[];
  // We can extend this with other potential filters like 'tags', 'status', etc.
  [key: string]: any;
}

/**
 * Interface representing the result of applying a filter.
 * Can include Firestore constraints and/or residual in-memory filtering logic.
 */
export interface ProblemFilterResult {
  constraints: QueryConstraint[];
  usedInOperator: boolean; // Indicates if the 'in' operator was used (Firestore limit: 1 per query)
  isResidual?: boolean; // If true, this filter must be applied in memory after fetching
}

/**
 * Base abstract class for a Problem Filter.
 */
export abstract class ProblemFilter {
  abstract key: string;

  /**
   * Applies the filter to generate Firestore constraints.
   * @param context The context containing filter values.
   * @param currentUsedInOperator Whether an 'in' operator has already been used in this query chain.
   * @returns The result including constraints and updated 'in' operator usage.
   */
  abstract apply(
    context: ProblemFilterContext,
    currentUsedInOperator: boolean
  ): ProblemFilterResult;

  /**
   * Optional: Logic to filter items in-memory.
   * Used when Firestore constraints are insufficient or efficient query is not possible.
   * @param item The problem item to check.
   * @param context The context containing filter values.
   */
  abstract matches(item: any, context: ProblemFilterContext): boolean;
}

/**
 * Registry to manage active filters.
 */
export class ProblemFilterRegistry {
  private filters: ProblemFilter[] = [];

  register(filter: ProblemFilter) {
    this.filters.push(filter);
  }

  getFilters(): ProblemFilter[] {
    return this.filters;
  }
}

export const problemFilterRegistry = new ProblemFilterRegistry();

// --- Default Filters Implementation ---

export class DifficultyFilterImpl extends ProblemFilter {
  key = "difficulty";

  apply(
    context: ProblemFilterContext,
    currentUsedInOperator: boolean
  ): ProblemFilterResult {
    const { difficultyFilter } = context;
    const constraints: QueryConstraint[] = [];
    let usedInOperator = currentUsedInOperator;
    let isResidual = false;

    if (difficultyFilter && difficultyFilter.length > 0) {
      if (difficultyFilter.length === 1) {
        constraints.push(where("difficulty", "==", difficultyFilter[0]));
      } else if (!usedInOperator) {
        constraints.push(where("difficulty", "in", difficultyFilter));
        usedInOperator = true;
      } else {
        // Fallback to residual filtering if 'in' is already used
        isResidual = true;
      }
    }

    return { constraints, usedInOperator, isResidual };
  }

  matches(item: any, context: ProblemFilterContext): boolean {
    const { difficultyFilter } = context;
    if (!difficultyFilter || difficultyFilter.length === 0) return true;
    return difficultyFilter.includes(item.difficulty);
  }
}

export class LastAskedFilterImpl extends ProblemFilter {
  key = "lastAsked";

  apply(
    context: ProblemFilterContext,
    currentUsedInOperator: boolean
  ): ProblemFilterResult {
    const { lastAskedFilter, companyId } = context;
    const constraints: QueryConstraint[] = [];
    let usedInOperator = currentUsedInOperator;
    let isResidual = false;

    if (lastAskedFilter && lastAskedFilter.length > 0) {
      const fieldPath = `companies.${companyId}.lastAskedPeriod`;
      if (lastAskedFilter.length === 1) {
        constraints.push(where(fieldPath, "==", lastAskedFilter[0]));
      } else if (!usedInOperator) {
        constraints.push(where(fieldPath, "in", lastAskedFilter));
        usedInOperator = true;
      } else {
        isResidual = true;
      }
    }

    return { constraints, usedInOperator, isResidual };
  }

  matches(item: any, context: ProblemFilterContext): boolean {
    const { lastAskedFilter } = context;
    if (!lastAskedFilter || lastAskedFilter.length === 0) return true;
    // Check item.lastAskedPeriod (which is usually normalized in the repository before this check)
    return item.lastAskedPeriod && lastAskedFilter.includes(item.lastAskedPeriod);
  }
}

// Register default filters
problemFilterRegistry.register(new DifficultyFilterImpl());
problemFilterRegistry.register(new LastAskedFilterImpl());
