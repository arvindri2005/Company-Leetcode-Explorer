/**
 * Problem Repository Search Tests (Supabase)
 *
 * Verifies that search queries use efficient ilike() prefix matching
 * instead of unbounded fetches.
 */

import { problemRepository } from "../problem.repository";

// ============================================
// Supabase Mock
// ============================================

const chainableMock: Record<string, jest.Mock> = {};
const trackingCalls: Array<{ method: string; args: unknown[] }> = [];

function createTrackedChainable(): Record<string, jest.Mock> {
  const methods = [
    "select", "insert", "update", "delete",
    "eq", "in", "single",
    "order", "limit", "ilike", "or", "range",
  ];

  const mock: Record<string, jest.Mock> = {};
  for (const method of methods) {
    mock[method] = jest.fn((...args: unknown[]) => {
      trackingCalls.push({ method, args });
      // select returns data when awaited
      if (method === "single") {
        return Promise.resolve({ data: null, error: { code: "PGRST116" } });
      }
      return mock;
    });
  }

  // Make the mock thenable for await
  (mock as Record<string, unknown>).then = (resolve: (value: unknown) => void) => {
    resolve({ data: [], error: null });
    return mock;
  };

  return mock;
}

jest.mock("@/shared/lib/api/supabase", () => {
  const tracked = createTrackedChainable();
  Object.assign(chainableMock, tracked);
  return {
    supabase: {
      from: jest.fn(() => tracked),
    },
  };
});

jest.mock("@/shared/lib/utils", () => ({
  slugify: (str: string) => str.toLowerCase().replace(/\s+/g, "-"),
}));

jest.mock("@/shared/lib/utils/logger", () => ({
  Logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

jest.mock("@/features/companies/repositories/company.repository", () => ({
  companyRepository: {
    getCompanyById: jest.fn(),
    getCompanyBySlug: jest.fn(),
  },
}));

describe("ProblemRepository Search Optimization (Supabase)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    trackingCalls.length = 0;
  });

  describe("getAllProblemsPaginated", () => {
    it("should use ilike prefix query when searchTerm is provided", async () => {
      await problemRepository.getAllProblemsPaginated({
        searchTerm: "Two Sum",
        pageSize: 10,
      });

      // Verify ilike was called with the normalized search term as a prefix
      const ilikeCalls = trackingCalls.filter((c) => c.method === "ilike");
      expect(ilikeCalls.length).toBeGreaterThanOrEqual(1);
      expect(ilikeCalls[0].args).toEqual(["normalized_title", "two sum%"]);
    });

    it("should apply limit to prevent unbounded results", async () => {
      await problemRepository.getAllProblemsPaginated({
        searchTerm: "Test",
        pageSize: 10,
      });

      // Verify limit was applied
      const limitCalls = trackingCalls.filter((c) => c.method === "limit");
      expect(limitCalls.length).toBeGreaterThanOrEqual(1);
      // pageSize + 1 for hasMore detection
      expect(limitCalls[0].args[0]).toBe(11);
    });

    it("should apply difficulty filter using in() method", async () => {
      await problemRepository.getAllProblemsPaginated({
        difficultyFilter: ["Easy", "Medium"],
        pageSize: 10,
      });

      const inCalls = trackingCalls.filter((c) => c.method === "in");
      expect(inCalls.length).toBeGreaterThanOrEqual(1);
      expect(inCalls[0].args).toEqual(["difficulty", ["Easy", "Medium"]]);
    });
  });
});
