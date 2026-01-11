
import { toggleBookmarkProblemAction, setProblemStatusAction, getUserProblemStatusesForIdsAction } from "../user.actions";
import { userService } from "@/features/profile/services/user.service";
import { revalidateTag } from "next/cache";
import { handleServerActionError } from "@/lib/utils/error-handler";
import { simpleFaker } from "@/__tests__/factories/data-factories";
import { success, failure } from "@/shared/types/result";

// Mock dependencies
jest.mock("@/features/profile/services/user.service");
jest.mock("next/cache");
jest.mock("@/lib/utils/error-handler");

// Mock Firebase to avoid initialization errors
jest.mock("@/lib/api/firebase", () => ({
  db: {},
  auth: {
    currentUser: {
      uid: "test-user-id",
    },
  },
  app: {},
}));

describe("User Actions", () => {
  const mockUserId = "test-user-id";
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
      (userService.toggleBookmarkProblem as jest.Mock).mockResolvedValue(
        success({ isBookmarked: true })
      );

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
      expect(result.success).toBe(true);
      expect(result.data).toEqual({ isBookmarked: true });
    });

    it("should return error if required params are missing", async () => {
      // Act & Assert
      const result1 = await toggleBookmarkProblemAction("", mockProblemId, mockCompanySlug, mockProblemSlug);
      expect(result1.success).toBe(false);
      expect(result1.error?.message).toContain("Unauthorized");
      
      const result2 = await toggleBookmarkProblemAction(mockUserId, "", mockCompanySlug, mockProblemSlug);
      expect(result2.success).toBe(false);
      expect(result2.error?.message).toContain("Problem ID is required");

      const result3 = await toggleBookmarkProblemAction(mockUserId, mockProblemId, "", mockProblemSlug);
      expect(result3.success).toBe(false);
      expect(result3.error?.message).toContain("Company slug is required");

      const result4 = await toggleBookmarkProblemAction(mockUserId, mockProblemId, mockCompanySlug, "");
      expect(result4.success).toBe(false);
      expect(result4.error?.message).toContain("Problem slug is required");
    });

    it("should handle service errors", async () => {
      // Arrange
      (userService.toggleBookmarkProblem as jest.Mock).mockResolvedValue(
        failure({ code: "INTERNAL_ERROR", message: "Database error" })
      );

      // Act
      const result = await toggleBookmarkProblemAction(
        mockUserId,
        mockProblemId,
        mockCompanySlug,
        mockProblemSlug
      );

      // Assert
      expect(result.success).toBe(false);
      expect(result.error?.message).toBe("Database error");
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
      expect(result.success).toBe(false);
      expect(result.error?.message).toBe("Unexpected error");
    });
  });

  describe("setProblemStatusAction", () => {
    it("should successfully set status and revalidate tags", async () => {
      // Arrange
      (userService.setProblemStatus as jest.Mock).mockResolvedValue(
        success(undefined)
      );

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
      expect(result.success).toBe(true);
    });

     it("should return error if validation fails", async () => {
       // Act & Assert
       const result = await setProblemStatusAction("", mockProblemId, "solved", mockCompanySlug, mockProblemSlug);
       expect(result.success).toBe(false);
       expect(result.error?.message).toContain("Unauthorized");
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

      (userService.getBookmarksForIds as jest.Mock).mockResolvedValue(success(mockBookmarks));
      (userService.getProblemStatusesForIds as jest.Mock).mockResolvedValue(success(mockStatuses));

      // Act
      const result = await getUserProblemStatusesForIdsAction(mockUserId, problemIds);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data).toEqual({
        [problemIds[0]]: { isBookmarked: true, status: "solved" },
        [problemIds[1]]: { isBookmarked: false, status: "todo" },
      });
    });
  });
});






