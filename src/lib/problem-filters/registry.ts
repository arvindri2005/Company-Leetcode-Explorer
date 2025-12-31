import { ProblemFilter } from "./types";
import { QueryConstraint } from "firebase/firestore";
import { ProblemSummaryDTO } from "@/types";

class ProblemFilterRegistry {
  private filters: Map<string, ProblemFilter> = new Map();

  register(filter: ProblemFilter) {
    this.filters.set(filter.key, filter);
  }

  get(key: string): ProblemFilter | undefined {
    return this.filters.get(key);
  }

  /**
   * Generates constraints for all active filters.
   * @param activeFilters A map of filter keys to their values
   * @param companyId The current company context
   */
  getConstraints(activeFilters: Record<string, any>, companyId: string): QueryConstraint[] {
    let constraints: QueryConstraint[] = [];
    for (const [key, value] of Object.entries(activeFilters)) {
      const filter = this.filters.get(key);
      if (filter && value !== undefined && value !== null) {
          // Skip empty arrays if they mean "no filter"
          if (Array.isArray(value) && value.length === 0) continue;
          
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
    activeFilters: Record<string, any>,
    companyId: string
  ): ProblemSummaryDTO[] {
    return problems.filter((problem) => {
      for (const [key, value] of Object.entries(activeFilters)) {
        const filter = this.filters.get(key);
        if (filter && value !== undefined && value !== null) {
             // Skip empty arrays if they mean "no filter"
             if (Array.isArray(value) && value.length === 0) continue;

             if (!filter.matches(problem, value, companyId)) {
               return false;
             }
        }
      }
      return true;
    });
  }
}

export const problemFilterRegistry = new ProblemFilterRegistry();
