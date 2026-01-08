import { ProblemFilter, FilterContext, FilterResult } from "./types";
import { where } from "firebase/firestore";
import { ProblemSummaryDTO, DifficultyFilter, LastAskedFilter, DifficultySchema, LastAskedPeriodSchema } from "@/types";

export class DifficultyFilterImplementation implements ProblemFilter<DifficultyFilter[]> {
  key = "difficulty";

  getConstraints(value: DifficultyFilter[], context: FilterContext): FilterResult {
    if (!value || value.length === 0) {
      return { constraints: [], applied: true, usesInOperator: false };
    }
    
    if (value.length === 1) {
      return {
        constraints: [where("difficulty", "==", value[0])],
        applied: true,
        usesInOperator: false
      };
    }

    if (context.canUseInOperator) {
      return {
        constraints: [where("difficulty", "in", value)],
        applied: true,
        usesInOperator: true
      };
    }

    // Cannot apply at DB level
    return { constraints: [], applied: false, usesInOperator: false };
  }

  matches(problem: ProblemSummaryDTO, value: DifficultyFilter[], companyId: string): boolean {
    if (!value || value.length === 0) return true;
    return value.includes(problem.difficulty);
  }

  isValidValue(value: unknown): value is DifficultyFilter[] {
    if (!Array.isArray(value)) return false;
    // Check if every item in the array matches the DifficultySchema
    return value.every(item => DifficultySchema.safeParse(item).success);
  }
}

export class LastAskedFilterImplementation implements ProblemFilter<LastAskedFilter[]> {
  key = "lastAsked";

  getConstraints(value: LastAskedFilter[], context: FilterContext): FilterResult {
    if (!value || value.length === 0) {
      return { constraints: [], applied: true, usesInOperator: false };
    }
    
    // If companyId is present, we filter by company-specific period.
    // If NOT present (generic list), we can't filter by DB efficiently usually,
    // or we might filter by a global property if it existed.
    // The original logic only applied LastAsked filter in DB if companyId was present.
    // But here 'context.companyId' is always passed?
    // Wait, Repository passes companyId to registry. If companyId is missing in params, what happens?
    // In ProblemRepository.buildQueryConstraints, companyId is optional.

    if (!context.companyId) {
        // If no company context, we treat it as residual (cannot filter in DB by company-specific field)
        return { constraints: [], applied: false, usesInOperator: false };
    }

    const fieldPath = `companies.${context.companyId}.lastAskedPeriod`;
    
    if (value.length === 1) {
      return {
        constraints: [where(fieldPath, "==", value[0])],
        applied: true,
        usesInOperator: false
      };
    }

    if (context.canUseInOperator) {
      return {
        constraints: [where(fieldPath, "in", value)],
        applied: true,
        usesInOperator: true
      };
    }

    return { constraints: [], applied: false, usesInOperator: false };
  }

  matches(problem: ProblemSummaryDTO, value: LastAskedFilter[], companyId: string): boolean {
    if (!value || value.length === 0) return true;
    // ProblemSummaryDTO has 'lastAskedPeriod' already resolved for the context company
    return problem.lastAskedPeriod ? value.includes(problem.lastAskedPeriod) : false;
  }

  isValidValue(value: unknown): value is LastAskedFilter[] {
    if (!Array.isArray(value)) return false;
    // Check if every item in the array matches the LastAskedPeriodSchema
    return value.every(item => LastAskedPeriodSchema.safeParse(item).success);
  }
}
