
import {
  toggleBookmarkProblemAction,
  setProblemStatusAction,
  getUserProblemStatusesForIdsAction,
  syncUserProfile
} from "../user.actions";
import { userService } from "@/services/user.service";
import { revalidateTag } from "next/cache";

// Mock the userService
jest.mock("@/services/user.service", () => ({
  userService: {
    toggleBookmarkProblem: jest.fn(),
    setProblemStatus: jest.fn(),
    getBookmarksForIds: jest.fn(),
    getProblemStatusesForIds: jest.fn(),
    syncUserProfile: jest.fn(),
  },
}));

// Mock next/cache
jest.mock("next/cache", () => ({
  revalidateTag: jest.fn(),
}));

describe("User Actions", () => {
  const mockUserId = "user-123";
  const mockProblemId = "problem-456";
  const mockCompanySlug = "google";
  const mockProblemSlug = "two-sum";

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("toggleBookmarkProblemAction", () => {
    it("should successfully toggle bookmark and revalidate tags", async () => {
      // Arrange
      (userService.toggleBookmarkProblem as jest.Mock).mockResolvedValue({
        isBookmarked: true,
      });

      // Act
      const result = await toggleBookmarkProblemAction(
        mockUserId,
        mockProblemId,
        mockCompanySlug,
        mockProblemSlug
      );

      // Assert
      expect(userService.toggleBookmarkProblem).toHaveBeenCalledWith(
        mockUserId,
        mockProblemId,
        mockCompanySlug,
        mockProblemSlug
      );
      expect(revalidateTag).toHaveBeenCalledWith(`user-bookmarks-${mockUserId}`, "max");
      expect(revalidateTag).toHaveBeenCalledWith(`user-profile-${mockUserId}`, "max");
      expect(result).toEqual({ success: true, isBookmarked: true });
    });

    it("should return error if required params are missing", async () => {
      // Act & Assert
      expect(await toggleBookmarkProblemAction("", mockProblemId, mockCompanySlug, mockProblemSlug))
        .toEqual({ success: false, error: expect.stringContaining("User not authenticated") });

      expect(await toggleBookmarkProblemAction(mockUserId, "", mockCompanySlug, mockProblemSlug))
        .toEqual({ success: false, error: expect.stringContaining("Problem ID is required") });

      expect(await toggleBookmarkProblemAction(mockUserId, mockProblemId, "", mockProblemSlug))
        .toEqual({ success: false, error: expect.stringContaining("Company slug is required") });

      expect(await toggleBookmarkProblemAction(mockUserId, mockProblemId, mockCompanySlug, ""))
        .toEqual({ success: false, error: expect.stringContaining("Problem slug is required") });
    });

    it("should handle service errors", async () => {
      // Arrange
      const errorMessage = "Database error";
      (userService.toggleBookmarkProblem as jest.Mock).mockResolvedValue({
        error: errorMessage,
      });

      // Act
      const result = await toggleBookmarkProblemAction(
        mockUserId,
        mockProblemId,
        mockCompanySlug,
        mockProblemSlug
      );

      // Assert
      expect(result).toEqual({ success: false, error: errorMessage });
      expect(revalidateTag).not.toHaveBeenCalled();
    });

    it("should catch unexpected errors", async () => {
      // Arrange
      (userService.toggleBookmarkProblem as jest.Mock).mockRejectedValue(new Error("Unexpected crash"));
      const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});

      // Act
      const result = await toggleBookmarkProblemAction(
        mockUserId,
        mockProblemId,
        mockCompanySlug,
        mockProblemSlug
      );

      // Assert
      expect(result).toEqual({ success: false, error: "Unexpected crash" });
      expect(consoleSpy).toHaveBeenCalledWith("Error in toggleBookmarkProblemAction:", expect.any(Error));
      consoleSpy.mockRestore();
    });
  });

  describe("setProblemStatusAction", () => {
    it("should successfully set status and revalidate tags", async () => {
      // Arrange
      (userService.setProblemStatus as jest.Mock).mockResolvedValue({
        success: true,
      });

      // Act
      const result = await setProblemStatusAction(
        mockUserId,
        mockProblemId,
        "solved",
        mockCompanySlug,
        mockProblemSlug
      );

      // Assert
      expect(userService.setProblemStatus).toHaveBeenCalledWith(
        mockUserId,
        mockProblemId,
        "solved",
        mockCompanySlug,
        mockProblemSlug
      );
      expect(revalidateTag).toHaveBeenCalledWith(`user-problem-statuses-${mockUserId}`, "max");
      expect(revalidateTag).toHaveBeenCalledWith(`user-profile-${mockUserId}`, "max");
      expect(result).toEqual({ success: true });
    });

    it("should return error if validation fails", async () => {
       // Act & Assert
       expect(await setProblemStatusAction("", mockProblemId, "solved", mockCompanySlug, mockProblemSlug))
       .toEqual({ success: false, error: expect.stringContaining("User not authenticated") });
    });
  });

  describe("getUserProblemStatusesForIdsAction", () => {
    it("should fetch statuses and bookmarks for given ids", async () => {
      // Arrange
      const problemIds = ["p1", "p2"];
      const mockBookmarks = new Set(["p1"]);
      const mockStatuses = {
        p1: { status: "solved", lastUpdated: Date.now() },
        p2: { status: "todo", lastUpdated: Date.now() },
      };

      (userService.getBookmarksForIds as jest.Mock).mockResolvedValue(mockBookmarks);
      (userService.getProblemStatusesForIds as jest.Mock).mockResolvedValue(mockStatuses);

      // Act
      const result = await getUserProblemStatusesForIdsAction(mockUserId, problemIds);

      // Assert
      // @ts-ignore
      expect(result["p1"]).toEqual({ isBookmarked: true, status: "solved" });
      // @ts-ignore
      expect(result["p2"]).toEqual({ isBookmarked: false, status: "todo" });
    });
  });

  describe("syncUserProfile", () => {
      it("should call userService.syncUserProfile", async () => {
          // Arrange
          const input = { uid: "123", email: "test@example.com", displayName: "Test User" };
          (userService.syncUserProfile as jest.Mock).mockResolvedValue({ success: true });
          const consoleSpy = jest.spyOn(console, "warn").mockImplementation(() => {});

          // Act
          const result = await syncUserProfile(input);

          // Assert
          expect(userService.syncUserProfile).toHaveBeenCalledWith("123", "test@example.com", "Test User");
          expect(result).toEqual({ success: true });
          expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining("deprecated"));
          consoleSpy.mockRestore();
      });
  });
});
