
import { userProblemBridgeService } from "@/features/problems/services/user-problem-bridge.service";
import { problemService } from "@/features/problems/services/problem.service";
import { userService } from "@/features/profile/services/user.service";
import { LeetCodeProblem } from "@/types";

// Mock dependencies
jest.mock("@/features/problems/services/problem.service", () => ({
  problemService: {
    getAllProblemsPaginated: jest.fn(),
  },
}));

jest.mock("@/features/profile/services/user.service", () => ({
  userService: {
    getBookmarksForIds: jest.fn(),
    getProblemStatusesForIds: jest.fn(),
  },
}));

describe("UserProblemBridgeService", () => {
  describe("getAllProblemsPaginatedWithUserStatus", () => {
    const mockProblems: LeetCodeProblem[] = [
      {
        id: "1",
        title: "Two Sum",
        difficulty: "Easy",
        companyId: "google",
        companySlug: "google",
        slug: "two-sum",
        normalizedTitle: "two sum",
      } as any,
      {
        id: "2",
        title: "Add Two Numbers",
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
      (problemService.getAllProblemsPaginated as jest.Mock).mockResolvedValue(mockPagination);
    });

    it("should return raw problems if no userId is provided", async () => {
      const result = await userProblemBridgeService.getAllProblemsPaginatedWithUserStatus({});

      expect(problemService.getAllProblemsPaginated).toHaveBeenCalled();
      expect(result.problems).toEqual(mockProblems);
      expect(userService.getBookmarksForIds).not.toHaveBeenCalled();
    });

    it("should enrich problems with user data if userId is provided", async () => {
      const userId = "test-user";
      (userService.getBookmarksForIds as jest.Mock).mockResolvedValue(new Set(["1"]));
      (userService.getProblemStatusesForIds as jest.Mock).mockResolvedValue({
        "1": { status: "solved" },
        "2": { status: "attempted" },
      });

      const result = await userProblemBridgeService.getAllProblemsPaginatedWithUserStatus({ userId });

      expect(problemService.getAllProblemsPaginated).toHaveBeenCalled();
      expect(userService.getBookmarksForIds).toHaveBeenCalledWith(userId, ["1", "2"]);
      expect(userService.getProblemStatusesForIds).toHaveBeenCalledWith(userId, ["1", "2"]);

      expect(result.problems[0].isBookmarked).toBe(true);
      expect(result.problems[0].currentStatus).toBe("solved");
      
      expect(result.problems[1].isBookmarked).toBe(false);
      expect(result.problems[1].currentStatus).toBe("attempted");
    });
  });
});






