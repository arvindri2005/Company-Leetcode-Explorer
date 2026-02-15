/**
 * Problem Repository Security Tests (Supabase)
 *
 * Tests validation, search poisoning prevention, and security
 * constraints in the problem repository.
 */

import { ZodError } from "zod";

import { MAX_COMPANIES_PER_PROBLEM } from "@/features/problems/constants/problem-constants";
import { CreateProblemSchema } from "@/features/problems/types/problem.types";

import type {
  CreateProblemDTO,
  UpdateProblemDTO,
} from "../../interfaces/problem.repository.interface";
import { problemRepository } from "../problem.repository";

// ============================================
// Supabase Mock
// ============================================

const mockSelect = jest.fn();
const mockInsert = jest.fn();
const mockUpdate = jest.fn();
const mockDelete = jest.fn();
const mockEq = jest.fn();
const mockIn = jest.fn();
const mockSingle = jest.fn();

function createChainableMock(overrides: Record<string, jest.Mock> = {}) {
  const mock: Record<string, jest.Mock> = {
    select: mockSelect,
    insert: mockInsert,
    update: mockUpdate,
    delete: mockDelete,
    eq: mockEq,
    in: mockIn,
    single: mockSingle,
    order: jest.fn(),
    limit: jest.fn(),
    ilike: jest.fn(),
    or: jest.fn(),
    range: jest.fn(),
    ...overrides,
  };

  // Make each method return the mock object for chaining
  for (const [key, fn] of Object.entries(mock)) {
    if (!overrides[key]) {
      fn.mockReturnValue(mock);
    }
  }

  return mock;
}

jest.mock("@/shared/lib/api/supabase", () => {
  const chainable = createChainableMock();
  const from = jest.fn(() => chainable);
  // Store reference for test access
  (global as Record<string, unknown>).__mockSupabaseFrom = from;
  (global as Record<string, unknown>).__mockSupabaseChainable = chainable;
  return {
    supabase: {
      from,
    },
  };
});

jest.mock("@/shared/lib/utils", () => ({
  slugify: (str: string) => str.toLowerCase().replace(/\s+/g, "-"),
}));

jest.mock("@/shared/lib/utils/logger", () => ({
  Logger: {
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
  },
}));

jest.mock("@/features/companies/repositories/company.repository", () => ({
  companyRepository: {
    getCompanyById: jest.fn(),
    getCompanyBySlug: jest.fn(),
  },
}));

describe("ProblemRepository Security Validation", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("save", () => {
    it("should validate input using CreateProblemSchema", async () => {
      const invalidData: CreateProblemDTO = {
        title: "Test Problem",
        // Missing difficulty, link, etc.
      } as CreateProblemDTO;

      await expect(problemRepository.save(invalidData)).rejects.toThrow(
        ZodError,
      );
    });

    it("should reject malicious URLs in link", async () => {
      const maliciousData: CreateProblemDTO = {
        title: "Malicious Problem",
        difficulty: "Easy",
        link: "javascript:alert(1)",
        tags: ["array"],
        normalizedTitle: "malicious problem",
      };

      await expect(problemRepository.save(maliciousData)).rejects.toThrow(
        ZodError,
      );
    });

    it("should accept valid data and call CreateProblemSchema.parse", async () => {
      const validData: CreateProblemDTO = {
        title: "Valid Problem",
        difficulty: "Medium",
        link: "https://leetcode.com/problems/valid-problem",
        tags: ["dp"],
        normalizedTitle: "valid problem",
      };

      const parseSpy = jest.spyOn(CreateProblemSchema, "parse");

      try {
        await problemRepository.save(validData);
      } catch {
        // Ignore downstream errors from mocked supabase
      }

      expect(parseSpy).toHaveBeenCalledWith(validData);
    });
  });

  describe("addProblem", () => {
    it("should prevent adding more companies than the limit", async () => {
      // Mock: problem exists
      const from = (global as Record<string, unknown>).__mockSupabaseFrom as jest.Mock;

      // Reset the from mock to track calls
      let fromCallCount = 0;
      from.mockImplementation((table: string) => {
        fromCallCount++;
        const tableMock = createChainableMock();

        if (table === "problems") {
          // First call: check if problem exists → yes
          tableMock.single.mockResolvedValue({ data: { id: "test-problem" }, error: null });
        } else if (table === "company_problems") {
          if (fromCallCount <= 3) {
            // Second call: check existing link → not found
            tableMock.single.mockResolvedValue({ data: null, error: { code: "PGRST116" } });
          } else {
            // Third call: count companies → at limit
            tableMock.select.mockReturnValue({
              ...tableMock,
              eq: jest.fn().mockReturnValue({
                ...tableMock,
                // Return count at MAX limit
              }),
            });
            (tableMock as Record<string, unknown>).count = MAX_COMPANIES_PER_PROBLEM;
            (tableMock as Record<string, unknown>).error = null;
          }
        }

        return tableMock;
      });

      const validData = {
        title: "Test Problem",
        difficulty: "Easy" as const,
        link: "https://leetcode.com/problems/test",
        tags: ["array"],
        normalizedTitle: "test problem",
        description: "test description",
      };

      const result = await problemRepository.addProblem(
        "new-company-id",
        validData,
      );

      expect(result.error).toContain(
        `Maximum number of companies (${MAX_COMPANIES_PER_PROBLEM}) reached`,
      );
    });

    it("should prevent search poisoning by enforcing normalizedTitle generation server-side", async () => {
      const from = (global as Record<string, unknown>).__mockSupabaseFrom as jest.Mock;
      let insertedData: Record<string, unknown> | null = null;

      from.mockImplementation((table: string) => {
        const tableMock = createChainableMock();

        if (table === "problems") {
          // First call: check if exists → no
          tableMock.single.mockResolvedValue({ data: null, error: { code: "PGRST116" } });
          // Insert call: capture data
          tableMock.insert.mockImplementation((data: Record<string, unknown>) => {
            insertedData = data;
            return { error: null };
          });
        } else if (table === "company_problems") {
          tableMock.insert.mockReturnValue({ error: null });
        }

        return tableMock;
      });

      const maliciousInput = {
        title: "Safe Title",
        difficulty: "Easy" as const,
        link: "https://leetcode.com/problems/safe-title",
        tags: ["Array"],
        normalizedTitle: "malicious-search-term", // Attack: Trying to poison the search index
        lastAskedPeriod: "last_30_days" as const,
      };

      await problemRepository.addProblem("company-1", maliciousInput);

      // The saved normalized_title should be derived from the TITLE ("safe title"),
      // NOT the provided malicious input ("malicious-search-term").
      expect(insertedData).not.toBeNull();
      expect(insertedData!.normalized_title).toBe("safe title");
      expect(insertedData!.normalized_title).not.toBe("malicious-search-term");
    });
  });

  describe("Security - Update Search Poisoning", () => {
    it("should prevent search poisoning when updating title", async () => {
      const from = (global as Record<string, unknown>).__mockSupabaseFrom as jest.Mock;
      let updatedData: Record<string, unknown> | null = null;

      from.mockImplementation((table: string) => {
        const tableMock = createChainableMock();

        if (table === "problems") {
          // update call: capture data
          tableMock.update.mockImplementation((data: Record<string, unknown>) => {
            updatedData = data;
            return tableMock;
          });
          tableMock.eq.mockReturnValue({ error: null });

          // For findById called after update
          tableMock.single.mockResolvedValue({
            data: {
              id: "problem-id",
              title: "New Safe Title",
              normalized_title: "new safe title",
              difficulty: "Easy",
            },
            error: null,
          });
        } else if (table === "company_problems") {
          tableMock.select.mockReturnValue(tableMock);
          tableMock.eq.mockReturnValue(tableMock);
          tableMock.limit.mockResolvedValue({ data: [], error: null });
        }

        return tableMock;
      });

      const maliciousUpdate: UpdateProblemDTO = {
        title: "New Safe Title",
        normalizedTitle: "poisoned-update-index",
      };

      try {
        await problemRepository.update("problem-id", maliciousUpdate);
      } catch {
        // May fail on findById mock, that's OK
      }

      expect(updatedData).not.toBeNull();
      expect(updatedData!.normalized_title).toBe("new safe title");
      expect(updatedData!.normalized_title).not.toBe("poisoned-update-index");
    });

    it("should ignore normalizedTitle update if title is NOT updated", async () => {
      const from = (global as Record<string, unknown>).__mockSupabaseFrom as jest.Mock;
      let updatedData: Record<string, unknown> | null = null;

      from.mockImplementation((table: string) => {
        const tableMock = createChainableMock();

        if (table === "problems") {
          tableMock.update.mockImplementation((data: Record<string, unknown>) => {
            updatedData = data;
            return tableMock;
          });
          tableMock.eq.mockReturnValue({ error: null });

          tableMock.single.mockResolvedValue({
            data: {
              id: "problem-id",
              title: "Existing Title",
              normalized_title: "existing title",
              difficulty: "Easy",
            },
            error: null,
          });
        } else if (table === "company_problems") {
          tableMock.select.mockReturnValue(tableMock);
          tableMock.eq.mockReturnValue(tableMock);
          tableMock.limit.mockResolvedValue({ data: [], error: null });
        }

        return tableMock;
      });

      const maliciousUpdate: UpdateProblemDTO = {
        normalizedTitle: "poisoned-standalone-update",
      };

      try {
        await problemRepository.update("problem-id", maliciousUpdate);
      } catch {
        // May fail on findById mock
      }

      // normalized_title should NOT be in the update since title was not changed
      if (updatedData) {
        expect(updatedData).not.toHaveProperty("normalized_title");
      }
    });
  });
});
