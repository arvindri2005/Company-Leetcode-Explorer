
import { toggleBookmarkProblemAction, setProblemStatusAction, getUserProblemStatusesForIdsAction } from "../user.actions";
import { userService } from "@/services/user.service";
import { revalidateTag } from "next/cache";
import { handleServerActionError } from "@/lib/error-handler";
import { simpleFaker } from "@/__tests__/factories/data-factories";

// Mock dependencies
jest.mock("@/services/user.service");
jest.mock("next/cache");
jest.mock("@/lib/error-handler");

// Mock Firebase to avoid initialization errors
jest.mock("@/lib/firebase", () => ({
  db: {},
  auth: {},
  app: {},
}));

describe("User Actions", () => {
  const mockUserId = simpleFaker.string.uuid();
  const mockProblemId = simpleFaker.string.uuid();
  const mockCompanySlug = simpleFaker.helpers.slugify(simpleFaker.company.name());
  const mockProblemSlug = simpleFaker.helpers.slugify(simpleFaker.word.noun() + "-" + simpleFaker.word.noun());

  beforeEach(() => {
    jest.clearAllMocks();
    (handleServerActionError as jest.Mock).mockImplementation((error) => error.message);
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
        .toEqual({ success: false, error: expect.stringContaining("User ID is required") });
      
      expect(await toggleBookmarkProblemAction(mockUserId, "", mockCompanySlug, mockProblemSlug))
        .toEqual({ success: false, error: expect.stringContaining("Problem ID is required") });

      expect(await toggleBookmarkProblemAction(mockUserId, mockProblemId, "", mockProblemSlug))
        .toEqual({ success: false, error: expect.stringContaining("Company slug is required") });

      expect(await toggleBookmarkProblemAction(mockUserId, mockProblemId, mockCompanySlug, ""))
        .toEqual({ success: false, error: expect.stringContaining("Problem slug is required") });
    });

    it("should handle service errors", async () => {
      // Arrange
      (userService.toggleBookmarkProblem as jest.Mock).mockResolvedValue({
        error: "Database error",
      });

      // Act
      const result = await toggleBookmarkProblemAction(
        mockUserId,
        mockProblemId,
        mockCompanySlug,
        mockProblemSlug
      );

      // Assert
      expect(result).toEqual({ success: false, error: "Database error" });
      expect(revalidateTag).not.toHaveBeenCalled();
    });

    it("should catch unexpected errors", async () => {
      // Arrange
      const error = new Error("Unexpected error");
      (userService.toggleBookmarkProblem as jest.Mock).mockRejectedValue(error);

      // Act
      const result = await toggleBookmarkProblemAction(
        mockUserId,
        mockProblemId,
        mockCompanySlug,
        mockProblemSlug
      );

      // Assert
      expect(handleServerActionError).toHaveBeenCalledWith(error, "toggleBookmarkProblemAction", {
        userId: mockUserId,
        problemId: mockProblemId,
        companySlug: mockCompanySlug,
        problemSlug: mockProblemSlug,
      });
      expect(result).toEqual({ success: false, error: "Unexpected error" });
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
       .toEqual({ success: false, error: expect.stringContaining("User ID is required") });
    });
  });

  describe("getUserProblemStatusesForIdsAction", () => {
    it("should fetch statuses and bookmarks for given ids", async () => {
      // Arrange
      const problemIds = [simpleFaker.string.uuid(), simpleFaker.string.uuid()];
      const mockBookmarks = new Set([problemIds[0]]);
      const mockStatuses = {
        [problemIds[0]]: { status: "solved" },
        [problemIds[1]]: { status: "todo" },
      };

      (userService.getBookmarksForIds as jest.Mock).mockResolvedValue(mockBookmarks);
      (userService.getProblemStatusesForIds as jest.Mock).mockResolvedValue(mockStatuses);

      // Act
      const result = await getUserProblemStatusesForIdsAction(mockUserId, problemIds);

      // Assert
      expect(result).toEqual({
        [problemIds[0]]: { isBookmarked: true, status: "solved" },
        [problemIds[1]]: { isBookmarked: false, status: "todo" },
      });
    });
  });
});
