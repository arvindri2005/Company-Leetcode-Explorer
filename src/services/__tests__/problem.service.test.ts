
import { problemService } from "@/services/problem.service";
import { userService } from "@/services/user.service";
import { problemRepository } from "@/repositories/problem.repository";
import { LeetCodeProblem } from "@/types";

// Mock dependencies
jest.mock("@/services/user.service", () => ({
  userService: {
    getBookmarksForIds: jest.fn(),
    getProblemStatusesForIds: jest.fn(),
  },
}));

jest.mock("@/repositories/problem.repository", () => ({
  problemRepository: {
    getAllProblemsPaginated: jest.fn(),
  },
}));

jest.mock("next/cache", () => ({
  unstable_cache: (fn: any) => fn, // Simply execute the function immediately
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

    it("should return problems without user data if no userId is provided", async () => {
      const result = await problemService.getAllProblemsPaginated({ userId: undefined });

      expect(result.problems[0].isBookmarked).toBeUndefined();
      expect(result.problems[0].currentStatus).toBeUndefined();
      expect(userService.getBookmarksForIds).not.toHaveBeenCalled();
      expect(userService.getProblemStatusesForIds).not.toHaveBeenCalled();
    });

    it("should enrich problems with user data if userId is provided", async () => {
      const userId = "test-user";
      (userService.getBookmarksForIds as jest.Mock).mockResolvedValue(new Set(["1"]));
      (userService.getProblemStatusesForIds as jest.Mock).mockResolvedValue({
        "1": { status: "solved" },
        "2": { status: "attempted" },
      });

      const result = await problemService.getAllProblemsPaginated({ userId });

      expect(userService.getBookmarksForIds).toHaveBeenCalledWith(userId, ["1", "2"]);
      expect(userService.getProblemStatusesForIds).toHaveBeenCalledWith(userId, ["1", "2"]);

      expect(result.problems[0].isBookmarked).toBe(true);
      expect(result.problems[0].currentStatus).toBe("solved");

      expect(result.problems[1].isBookmarked).toBe(false);
      expect(result.problems[1].currentStatus).toBe("attempted");
    });
  });
});
