import { userRepository } from "@/features/profile/repositories/user.repository";
import { userService } from "@/features/profile/services/user.service";

// Mock repository
jest.mock("@/features/profile/repositories/user.repository");
jest.mock("@/shared/lib/utils/logger");

describe("UserService Caching", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // @ts-ignore - Accessing private property for test cleanup
    if (userService.globalStatsCache && typeof userService.globalStatsCache.clear === 'function') {
        // @ts-ignore
        userService.globalStatsCache.clear();
    }
  });

  it("should cache getUserGlobalProblemStats results", async () => {
    const userId = "user1";
    const mockStats = {
      solvedProblemIds: ["p1"],
      attemptedProblemIds: ["p2"],
      bookmarkedProblemIds: ["p3"],
    };

    (userRepository.getUserGlobalProblemStats as jest.Mock).mockResolvedValueOnce(mockStats);

    const result1 = await userService.getUserGlobalProblemStats(userId);
    expect(result1.isSuccess).toBe(true);
    if (result1.isSuccess) {
      expect(result1.value).toEqual(mockStats);
    }
    expect(userRepository.getUserGlobalProblemStats).toHaveBeenCalledTimes(1);

    const result2 = await userService.getUserGlobalProblemStats(userId);
    expect(result2.isSuccess).toBe(true);
    if (result2.isSuccess) {
      expect(result2.value).toEqual(mockStats);
    }
    expect(userRepository.getUserGlobalProblemStats).toHaveBeenCalledTimes(1);
  });

  it("should expire cache after TTL", async () => {
    const userId = "user1";
    const mockStats = { solvedProblemIds: [], attemptedProblemIds: [], bookmarkedProblemIds: [] };
    
    (userRepository.getUserGlobalProblemStats as jest.Mock).mockResolvedValue(mockStats);

    await userService.getUserGlobalProblemStats(userId);
    expect(userRepository.getUserGlobalProblemStats).toHaveBeenCalledTimes(1);

    const realDateNow = Date.now;
    global.Date.now = jest.fn(() => realDateNow() + 6 * 60 * 1000);

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

    await userService.getUserGlobalProblemStats(userId);
    await userService.setProblemStatus(userId, "p1", "solved", "google", "two-sum");

    const result = await userService.getUserGlobalProblemStats(userId);
    
    expect(result.isSuccess).toBe(true);
    if (result.isSuccess) {
      expect(result.value.solvedProblemIds).toContain("p1");
      expect(result.value.solvedProblemIds).toHaveLength(1);
    }
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

    await userService.getUserGlobalProblemStats(userId);
    await userService.toggleBookmarkProblem(userId, "p1", "google", "two-sum");

    let result = await userService.getUserGlobalProblemStats(userId);
    expect(result.isSuccess).toBe(true);
    if (result.isSuccess) {
      expect(result.value.bookmarkedProblemIds).toContain("p1");
    }

    (userRepository.toggleBookmarkProblem as jest.Mock).mockResolvedValue({ isBookmarked: false });
    await userService.toggleBookmarkProblem(userId, "p1", "google", "two-sum");

    result = await userService.getUserGlobalProblemStats(userId);
    expect(result.isSuccess).toBe(true);
    if (result.isSuccess) {
      expect(result.value.bookmarkedProblemIds).not.toContain("p1");
    }
  });

  it("should return a copy of cached arrays to prevent mutation", async () => {
    const userId = "user1";
    const mockStats = {
      solvedProblemIds: ["p1"],
      attemptedProblemIds: [],
      bookmarkedProblemIds: [],
    };

    (userRepository.getUserGlobalProblemStats as jest.Mock).mockResolvedValue(mockStats);

    const result1 = await userService.getUserGlobalProblemStats(userId);
    expect(result1.isSuccess).toBe(true);
    
    if (result1.isSuccess) {
      result1.value.solvedProblemIds.push("p2");
    }

    const result2 = await userService.getUserGlobalProblemStats(userId);
    expect(result2.isSuccess).toBe(true);

    if (result2.isSuccess) {
      expect(result2.value.solvedProblemIds).toEqual(["p1"]);
      expect(result2.value.solvedProblemIds).not.toContain("p2");
    }
  });

  it("should evict least recently used item when cache is full", async () => {
    // @ts-ignore
    if (userService.globalStatsCache) {
         // @ts-ignore
        userService.globalStatsCache.maxEntries = 3;
    }
    
    const mockStats = { solvedProblemIds: [], attemptedProblemIds: [], bookmarkedProblemIds: [] };
    (userRepository.getUserGlobalProblemStats as jest.Mock).mockResolvedValue(mockStats);

    await userService.getUserGlobalProblemStats("user1");
    await userService.getUserGlobalProblemStats("user2");
    await userService.getUserGlobalProblemStats("user3");
    
    // @ts-ignore
    expect(userService.globalStatsCache.size).toBe(3);

    await userService.getUserGlobalProblemStats("user1");
    await userService.getUserGlobalProblemStats("user4");

    // @ts-ignore
    expect(userService.globalStatsCache.size).toBe(3);
    
    // @ts-ignore
    expect(userService.globalStatsCache.has("user2")).toBe(false);
    // @ts-ignore
    expect(userService.globalStatsCache.has("user1")).toBe(true);
    // @ts-ignore
    expect(userService.globalStatsCache.has("user3")).toBe(true);
    // @ts-ignore
    expect(userService.globalStatsCache.has("user4")).toBe(true);
  });
});
