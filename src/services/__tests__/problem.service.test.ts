
import { problemService } from "@/services/problem.service";
import { problemRepository } from "@/repositories/problem.repository";
import { LeetCodeProblem } from "@/types";
import { cacheManager } from "@/lib/cache";

jest.mock("@/repositories/problem.repository", () => ({
  problemRepository: {
    getAllProblemsPaginated: jest.fn(),
    getProblemsByCompany: jest.fn(),
  },
}));

// Mock the cache manager
jest.mock("@/lib/cache", () => ({
  cacheManager: {
    wrap: jest.fn((key, fn) => fn()),
  },
  CacheTTL: {
    STATIC: 30,
  },
}));

describe("ProblemService", () => {
  const mockPagination = {
    problems: [],
    totalProblems: 0,
    hasMore: false,
    nextCursor: undefined,
    totalPages: 0,
    currentPage: 1,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (problemRepository.getAllProblemsPaginated as jest.Mock).mockResolvedValue(mockPagination);
    (problemRepository.getProblemsByCompany as jest.Mock).mockResolvedValue(mockPagination);
  });

  describe("getAllProblemsPaginated", () => {
    const mockProblems: LeetCodeProblem[] = [
      {
        id: "1",
        title: "Two Sum",
        titleSlug: "two-sum",
        difficulty: "Easy",
        companyId: "google",
        companySlug: "google",
        slug: "two-sum",
        normalizedTitle: "two sum",
      } as any,
      {
        id: "2",
        title: "Add Two Numbers",
        titleSlug: "add-two-numbers",
        difficulty: "Medium",
        companyId: "meta",
        companySlug: "meta",
        slug: "add-two-numbers",
        normalizedTitle: "add two numbers",
      } as any,
    ];

    const mockPaginationResult = {
      problems: mockProblems,
      totalProblems: 2,
      hasMore: false,
      nextCursor: undefined,
      totalPages: 1,
      currentPage: 1,
    };

    it("should return problems from repository using cacheManager", async () => {
      (problemRepository.getAllProblemsPaginated as jest.Mock).mockResolvedValue(mockPaginationResult);

      const result = await problemService.getAllProblemsPaginated({});

      expect(cacheManager.wrap).toHaveBeenCalled();
      expect(problemRepository.getAllProblemsPaginated).toHaveBeenCalled();
      expect(result.problems).toEqual(mockProblems);
    });

    it("should generate canonical cache keys for filters", async () => {
      // Call 1: ['Easy', 'Medium']
      await problemService.getAllProblemsPaginated({
        difficultyFilter: ["Easy", "Medium"],
      });

      // Call 2: ['Medium', 'Easy']
      await problemService.getAllProblemsPaginated({
        difficultyFilter: ["Medium", "Easy"],
      });

      const calls = (cacheManager.wrap as jest.Mock).mock.calls;
      const lastCallKey = calls[calls.length - 1][0];
      const secondLastCallKey = calls[calls.length - 2][0];

      expect(lastCallKey).toBe(secondLastCallKey);
      expect(lastCallKey).toContain('"difficultyFilter":["Easy","Medium"]');
    });

    it("should handle empty/undefined parameters gracefully", async () => {
      // This ensures no runtime error if params are empty
      await expect(problemService.getAllProblemsPaginated({})).resolves.not.toThrow();

      // Also check undefined
      // @ts-ignore - calling with undefined to simulate JS behavior or missed optional
      await expect(problemService.getAllProblemsPaginated(undefined)).resolves.not.toThrow();
    });
  });

  describe("getPublicProblems", () => {
    it("should generate the same cache key for different orders of difficulty filters", async () => {
      const companyId = "google";

      // Call 1: ['Easy', 'Medium']
      await problemService.getPublicProblems(companyId, {
        difficultyFilter: ["Easy", "Medium"],
      });

      // Call 2: ['Medium', 'Easy']
      await problemService.getPublicProblems(companyId, {
        difficultyFilter: ["Medium", "Easy"],
      });

      const calls = (cacheManager.wrap as jest.Mock).mock.calls;
      expect(calls.length).toBe(2);

      const key1 = calls[0][0];
      const key2 = calls[1][0];

      expect(key1).toBe(key2);
      expect(key1).toContain('"difficultyFilter":["Easy","Medium"]');
    });

    it("should handle empty/undefined parameters gracefully", async () => {
       const companyId = "google";
       await expect(problemService.getPublicProblems(companyId, {})).resolves.not.toThrow();

       // @ts-ignore
       await expect(problemService.getPublicProblems(companyId, undefined)).resolves.not.toThrow();
    });
  });
});
