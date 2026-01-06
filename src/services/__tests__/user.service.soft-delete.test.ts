import { userService } from "@/services/user.service";
import { userRepository } from "@/repositories/user.repository";

// Mock the repository
jest.mock("@/repositories/user.repository");

describe("UserService Soft Delete", () => {
  const userId = "test-user-id";
  const educationId = "edu-123";
  const workId = "work-123";

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("softDeleteUserEducation", () => {
    it("should call repository softDeleteUserEducation", async () => {
      (userRepository.softDeleteUserEducation as jest.Mock).mockResolvedValue({
        success: true,
      });

      const result = await userService.softDeleteUserEducation(userId, educationId);

      expect(userRepository.softDeleteUserEducation).toHaveBeenCalledWith(
        userId,
        educationId
      );
      expect(result).toEqual({ success: true });
    });

    it("should return error if repository fails", async () => {
      (userRepository.softDeleteUserEducation as jest.Mock).mockResolvedValue({
        success: false,
        error: "Failed",
      });

      const result = await userService.softDeleteUserEducation(userId, educationId);

      expect(result).toEqual({ success: false, error: "Failed" });
    });
  });

  describe("softDeleteUserWorkExperience", () => {
    it("should call repository softDeleteUserWorkExperience", async () => {
      (userRepository.softDeleteUserWorkExperience as jest.Mock).mockResolvedValue({
        success: true,
      });

      const result = await userService.softDeleteUserWorkExperience(userId, workId);

      expect(userRepository.softDeleteUserWorkExperience).toHaveBeenCalledWith(
        userId,
        workId
      );
      expect(result).toEqual({ success: true });
    });
  });
});
