import { ProblemFilter } from "./types";
import { QueryConstraint } from "firebase/firestore";
import { ProblemSummaryDTO } from "@/types";

export interface QueryPlan {
  constraints: QueryConstraint[];
  residualFilters: Record<string, unknown>;
}

class ProblemFilterRegistry {
  private filters: Map<string, ProblemFilter> = new Map();

  register(filter: ProblemFilter) {
    this.filters.set(filter.key, filter);
  }

  get(key: string): ProblemFilter | undefined {
    return this.filters.get(key);
  }

  /**
   * Helper to check if a filter should be applied.
   * Returns the filter if it should be applied, otherwise undefined.
   */
  private getApplicableFilter(key: string, value: unknown): ProblemFilter | undefined {
    const filter = this.filters.get(key);
    
    if (!filter) return undefined;
    if (value === undefined || value === null) return undefined;
    if (Array.isArray(value) && value.length === 0) return undefined;
    if (!filter.isValidValue(value)) return undefined;
    
    return filter;
  }

  /**
   * Generates a query plan for all active filters.
   * This coordinates resource usage (like the single 'in' operator allowed by Firestore)
   * across multiple filters.
   *
   * @param activeFilters A map of filter keys to their values
   * @param companyId The current company context
   */
  getQueryPlan(activeFilters: Record<string, unknown>, companyId: string): QueryPlan {
    let constraints: QueryConstraint[] = [];
    const residualFilters: Record<string, unknown> = {};
    let usedInOperator = false;

    // We iterate through filters.
    // Optimization: We might want to prioritize certain filters for the 'in' operator.
    // For now, we respect the iteration order (which usually follows insertion/definition order).
    // The Repository previously prioritized Difficulty over LastAsked.
    // To preserve this, the consumer should pass keys in order, or we iterate in a fixed order if keys exist.

    // To ensure deterministic behavior, we can sort keys or prioritize known keys.
    // Let's iterate through the active filters.
    // If we want to strictly follow "Difficulty First", we rely on the object key order or enforce it.
    // Since 'activeFilters' is passed by the caller, they can control the order.
    
    for (const [key, value] of Object.entries(activeFilters)) {
      const filter = this.getApplicableFilter(key, value);

      if (filter) {
        const result = filter.getConstraints(value, {
            companyId,
            canUseInOperator: !usedInOperator
        });

        if (result.applied) {
            constraints = constraints.concat(result.constraints);
            if (result.usesInOperator) {
                usedInOperator = true;
            }
        } else {
            // If not applied (e.g. needed 'in' but couldn't get it), it becomes residual
            residualFilters[key] = value;
        }
      }
    }

    return { constraints, residualFilters };
  }

  /**
   * Applies in-memory filtering for all active filters.
   */
  filterInMemory(
    problems: ProblemSummaryDTO[],
    activeFilters: Record<string, unknown>,
    companyId: string
  ): ProblemSummaryDTO[] {
    return problems.filter((problem) => {
      for (const [key, value] of Object.entries(activeFilters)) {
        const filter = this.getApplicableFilter(key, value);
        
        if (filter && !filter.matches(problem, value, companyId)) {
          return false;
        }
      }
      return true;
    });
  }
}

export const problemFilterRegistry = new ProblemFilterRegistry();
