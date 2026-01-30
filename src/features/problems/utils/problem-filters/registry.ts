import { type QueryConstraint } from "firebase/firestore";

import { type ProblemSummaryDTO } from "@/shared/types";

import { type ProblemFilter } from "./types";

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
    
    if (!filter) {return undefined;}
    if (value === undefined || value === null) {return undefined;}
    if (Array.isArray(value) && value.length === 0) {return undefined;}
    if (!filter.isValidValue(value)) {return undefined;}
    
    return filter;
  }

  /**
   * Generates constraints for all active filters.
   * @param activeFilters A map of filter keys to their values
   * @param companyId The current company context
   */
  getConstraints(activeFilters: Record<string, unknown>, companyId: string): QueryConstraint[] {
    let constraints: QueryConstraint[] = [];
    
    for (const [key, value] of Object.entries(activeFilters)) {
      const filter = this.getApplicableFilter(key, value);
      if (filter) {
        constraints = constraints.concat(filter.getConstraints(value, companyId));
      }
    }
    
    return constraints;
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






