
import { problemService } from "@/services/problem.service";
import { problemRepository } from "@/repositories/problem.repository";
import { LeetCodeProblem } from "@/types";
import { cacheManager } from "@/lib/cache";

jest.mock("@/repositories/problem.repository", () => ({
  problemRepository: {
    getAllProblemsPaginated: jest.fn(),
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

    const mockPagination = {
      problems: mockProblems,
      totalProblems: 2,
      hasMore: false,
      nextCursor: undefined,
      totalPages: 1,
      currentPage: 1,
    };

    beforeEach(() => {
      jest.clearAllMocks();
      (problemRepository.getAllProblemsPaginated as jest.Mock).mockResolvedValue(mockPagination);
    });

    it("should return problems from repository using cacheManager", async () => {
      const result = await problemService.getAllProblemsPaginated({});

      expect(cacheManager.wrap).toHaveBeenCalled();
      expect(problemRepository.getAllProblemsPaginated).toHaveBeenCalled();
      expect(result.problems).toEqual(mockProblems);
    });
  });
});
