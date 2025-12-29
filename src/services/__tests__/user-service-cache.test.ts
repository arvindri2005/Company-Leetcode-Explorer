import { userService } from "@/services/user.service";
import { userRepository } from "@/repositories/user.repository";

// Mock repository
jest.mock("@/repositories/user.repository");
jest.mock("@/lib/logger");

describe("UserService Caching", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // @ts-ignore - Accessing private property for test cleanup if needed, 
    // or we can rely on creating a new instance if we weren't using the singleton.
    // Since we export a singleton, we need to manually clear the cache if we can't recreate it.
    // However, for this test file, we can just rely on the fact that mocks are cleared.
    // Ideally, we'd add a clearCache method for testing or export the class.
    
    // Hack to clear private cache:
    (userService as any).globalStatsCache = new Map();
  });

  it("should cache getUserGlobalProblemStats results", async () => {
    const userId = "user1";
    const mockStats = {
      solvedProblemIds: ["p1"],
      attemptedProblemIds: ["p2"],
      bookmarkedProblemIds: ["p3"],
    };

    (userRepository.getUserGlobalProblemStats as jest.Mock).mockResolvedValueOnce(mockStats);

    // First call - should hit repository
    const result1 = await userService.getUserGlobalProblemStats(userId);
    expect(result1).toEqual(mockStats);
    expect(userRepository.getUserGlobalProblemStats).toHaveBeenCalledTimes(1);

    // Second call - should return cached result
    const result2 = await userService.getUserGlobalProblemStats(userId);
    expect(result2).toEqual(mockStats);
    expect(userRepository.getUserGlobalProblemStats).toHaveBeenCalledTimes(1);
  });

  it("should expire cache after TTL", async () => {
    const userId = "user1";
    const mockStats = { solvedProblemIds: [], attemptedProblemIds: [], bookmarkedProblemIds: [] };
    
    (userRepository.getUserGlobalProblemStats as jest.Mock).mockResolvedValue(mockStats);

    // First call
    await userService.getUserGlobalProblemStats(userId);
    expect(userRepository.getUserGlobalProblemStats).toHaveBeenCalledTimes(1);

    // Advance time by 6 minutes (TTL is 5 mins)
    const realDateNow = Date.now;
    global.Date.now = jest.fn(() => realDateNow() + 6 * 60 * 1000);

    // Second call - should hit repository again
    await userService.getUserGlobalProblemStats(userId);
    expect(userRepository.getUserGlobalProblemStats).toHaveBeenCalledTimes(2);

    global.Date.now = realDateNow;
  });

  it("should update cache when setProblemStatus succeeds", async () => {
    const userId = "user1";
    const initialStats = {
      solvedProblemIds: [],
      attemptedProblemIds: ["p1"],
      bookmarkedProblemIds: [],
    };

    (userRepository.getUserGlobalProblemStats as jest.Mock).mockResolvedValueOnce(initialStats);
    (userRepository.setProblemStatus as jest.Mock).mockResolvedValue({ success: true });

    // Populate cache
    await userService.getUserGlobalProblemStats(userId);

    // Update status to 'solved'
    await userService.setProblemStatus(userId, "p1", "solved", "google", "two-sum");

    // Fetch again - should have updated stats from cache without repo call
    const result = await userService.getUserGlobalProblemStats(userId);
    
    expect(result.solvedProblemIds).toContain("p1");
    expect(result.solvedProblemIds).toHaveLength(1);
  });

  it("should update cache when toggleBookmarkProblem succeeds", async () => {
    const userId = "user1";
    const initialStats = {
      solvedProblemIds: [],
      attemptedProblemIds: [],
      bookmarkedProblemIds: [],
    };

    (userRepository.getUserGlobalProblemStats as jest.Mock).mockResolvedValueOnce(initialStats);
    (userRepository.toggleBookmarkProblem as jest.Mock).mockResolvedValue({ isBookmarked: true });

    // Populate cache
    await userService.getUserGlobalProblemStats(userId);

    // Toggle bookmark on
    await userService.toggleBookmarkProblem(userId, "p1", "google", "two-sum");

    // Fetch again
    let result = await userService.getUserGlobalProblemStats(userId);
    expect(result.bookmarkedProblemIds).toContain("p1");

    // Toggle bookmark off
    (userRepository.toggleBookmarkProblem as jest.Mock).mockResolvedValue({ isBookmarked: false });
    await userService.toggleBookmarkProblem(userId, "p1", "google", "two-sum");

    // Fetch again
    result = await userService.getUserGlobalProblemStats(userId);
    expect(result.bookmarkedProblemIds).not.toContain("p1");
  });

  it("should return a copy of cached arrays to prevent mutation", async () => {
    const userId = "user1";
    const mockStats = {
      solvedProblemIds: ["p1"],
      attemptedProblemIds: [],
      bookmarkedProblemIds: [],
    };

    (userRepository.getUserGlobalProblemStats as jest.Mock).mockResolvedValue(mockStats);

    // First call
    const result1 = await userService.getUserGlobalProblemStats(userId);
    
    // Mutate the result
    result1.solvedProblemIds.push("p2");

    // Second call
    const result2 = await userService.getUserGlobalProblemStats(userId);

    // Cache should remain pristine
    expect(result2.solvedProblemIds).toEqual(["p1"]);
    expect(result2.solvedProblemIds).not.toContain("p2");
  });
});
