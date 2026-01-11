import { type QueryConstraint,where } from "firebase/firestore";

import { type DifficultyFilter, DifficultySchema, type LastAskedFilter, LastAskedPeriodSchema,type ProblemSummaryDTO } from "@/types";

import { type ProblemFilter } from "./types";

export class DifficultyFilterImplementation implements ProblemFilter<DifficultyFilter[]> {
  key = "difficulty";

  getConstraints(value: DifficultyFilter[], _companyId: string): QueryConstraint[] {
    if (!value || value.length === 0) {return [];}
    
    // Note: This naive implementation might conflict with other 'in' or '!=' queries
    // The Repository handles constraint conflict resolution (e.g. "usedInOperator")
    // For now, we return the constraint, and the consumer (Repository) might need to be smart 
    // or we assume this Registry is used primarily for the Semi-Optimized path where we might only apply 
    // simple equality or fall back to memory.
    
    // However, to replicate existing logic:
    if (value.length === 1) {
      return [where("difficulty", "==", value[0])];
    }
    // 'in' queries are handled cautiously in the original repo. 
    // If we return it here, we assume it's safe or the only 'in' query.
    return [where("difficulty", "in", value)];
  }

  matches(problem: ProblemSummaryDTO, value: DifficultyFilter[], _companyId: string): boolean {
    if (!value || value.length === 0) {return true;}
    return value.includes(problem.difficulty);
  }

  isValidValue(value: unknown): value is DifficultyFilter[] {
    if (!Array.isArray(value)) {return false;}
    // Check if every item in the array matches the DifficultySchema
    return value.every(item => DifficultySchema.safeParse(item).success);
  }
}

export class LastAskedFilterImplementation implements ProblemFilter<LastAskedFilter[]> {
  key = "lastAsked";

  getConstraints(value: LastAskedFilter[], companyId: string): QueryConstraint[] {
    if (!value || value.length === 0) {return [];}
    
    const fieldPath = `companies.${companyId}.lastAskedPeriod`;
    
    if (value.length === 1) {
      return [where(fieldPath, "==", value[0])];
    }
    return [where(fieldPath, "in", value)];
  }

  matches(problem: ProblemSummaryDTO, value: LastAskedFilter[], _companyId: string): boolean {
    if (!value || value.length === 0) {return true;}
    // ProblemSummaryDTO has 'lastAskedPeriod' already resolved for the context company
    // in the mapDocToProblem / fetch logic.
    return problem.lastAskedPeriod ? value.includes(problem.lastAskedPeriod) : false;
  }

  isValidValue(value: unknown): value is LastAskedFilter[] {
    if (!Array.isArray(value)) {return false;}
    // Check if every item in the array matches the LastAskedPeriodSchema
    return value.every(item => LastAskedPeriodSchema.safeParse(item).success);
  }
}






