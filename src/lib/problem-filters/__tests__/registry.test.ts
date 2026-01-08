import { problemFilterRegistry } from "../registry";
import { DifficultyFilterImplementation, LastAskedFilterImplementation } from "../implementations";
import { where } from "firebase/firestore";

describe("ProblemFilterRegistry - Query Plan", () => {
  // Register default filters
  problemFilterRegistry.register(new DifficultyFilterImplementation());
  problemFilterRegistry.register(new LastAskedFilterImplementation());

  it("should prioritize exact match over 'in' operator", () => {
    const activeFilters = {
      difficulty: ["Easy"], // Single value -> '=='
      lastAsked: ["last_30_days", "within_3_months"] // Multiple -> 'in'
    };

    // We expect both to be applied at DB level because 'difficulty' uses ==, leaving 'in' available for lastAsked
    const plan = problemFilterRegistry.getQueryPlan(activeFilters, "company123");

    expect(plan.constraints.length).toBeGreaterThan(0);
    expect(Object.keys(plan.residualFilters).length).toBe(0);
  });

  it("should allow only one 'in' operator", () => {
    const activeFilters = {
      difficulty: ["Easy", "Medium"], // Multiple -> needs 'in'
      lastAsked: ["last_30_days", "within_3_months"] // Multiple -> needs 'in'
    };

    // We expect ONE to be applied and ONE to be residual
    const plan = problemFilterRegistry.getQueryPlan(activeFilters, "company123");

    expect(Object.keys(plan.residualFilters).length).toBe(1);

    // Check which one was residual. Since we iterate via Object.entries, order depends on runtime engine for string keys.
    // However, usually insertion order or alphabetical. 'difficulty' comes before 'lastAsked' alphabetically.
    // If difficulty took the slot, lastAsked should be residual.
  });

  it("should handle mixed exact and 'in' operators correctly", () => {
    const activeFilters = {
      difficulty: ["Easy"], // '=='
      lastAsked: ["last_30_days"] // '=='
    };

    const plan = problemFilterRegistry.getQueryPlan(activeFilters, "company123");

    // Both applied, no residuals
    expect(Object.keys(plan.residualFilters).length).toBe(0);
    expect(plan.constraints.length).toBe(2);
  });

  it("should fallback to residual if filter requires context but context is missing", () => {
    const activeFilters = {
      lastAsked: ["last_30_days"]
    };

    // No companyId passed -> LastAskedFilterImplementation returns residual because it needs companyId path
    const plan = problemFilterRegistry.getQueryPlan(activeFilters, "");

    expect(Object.keys(plan.residualFilters)).toContain("lastAsked");
  });
});
