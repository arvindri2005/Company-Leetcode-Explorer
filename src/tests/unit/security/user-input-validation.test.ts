import { userRepository } from "@/features/profile/repositories/user.repository";
import { EducationExperienceSchema, WorkExperienceSchema } from "@/shared/types";

// Mock Supabase client
const mockUpdate = jest.fn();
const mockEq = jest.fn();
const mockFrom = jest.fn();

jest.mock("@/shared/lib/api/supabase-browser", () => ({
  createSupabaseBrowserClient: () => ({
    from: mockFrom,
    auth: {
        getUser: jest.fn(),
    }
  }),
}));

jest.mock("@/shared/lib/utils/logger", () => ({
  Logger: {
    error: jest.fn(),
    warn: jest.fn(),
  },
}));

describe("User Input Validation Security", () => {
  const LONG_STRING = "a".repeat(1001); // Create a string longer than standard reasonable limits

  beforeEach(() => {
      jest.clearAllMocks();
      mockFrom.mockReturnValue({
          update: mockUpdate,
      });
      mockUpdate.mockReturnValue({
          eq: mockEq,
      });
      mockEq.mockResolvedValue({ error: null });
  });

  describe("EducationExperienceSchema", () => {
    it("should reject extremely long degree names", () => {
      const result = EducationExperienceSchema.safeParse({
        degree: LONG_STRING,
        fieldOfStudy: "CS",
        school: "Uni",
        startDate: "2020",
      });
      expect(result.success).toBe(false);
    });

    it("should reject extremely long school names", () => {
        const result = EducationExperienceSchema.safeParse({
          degree: "BS",
          fieldOfStudy: "CS",
          school: LONG_STRING,
          startDate: "2020",
        });
        expect(result.success).toBe(false);
      });
  });

  describe("WorkExperienceSchema", () => {
    it("should reject extremely long role names", () => {
      const result = WorkExperienceSchema.safeParse({
        role: LONG_STRING,
        company: "Acme",
        startDate: "2020",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("updateUserDisplayName", () => {
      it("should reject extremely long display names", async () => {
          // Mock isAuthorized to return true (or mock the validator)
          // Actually userRepository checks isAuthorized internally using userValidators.
          // We need to mock userValidators or the internal check.
          // Since we are testing repository, we might need to mock the operations.
          // But here we are calling repository directly. 
          // Repository delegates to operations.
          // OPERATIONS calls Supabase.
          
          // Let's assume we want to test that the VALIDATION logic in operations/repository catches it.
          // userRepository.updateUserDisplayName calls userOperations.updateUserDisplayName
          
          const result = await userRepository.updateUserDisplayName("user1", LONG_STRING);
          
          expect(result.success).toBe(false);
          expect(result.error).toContain("Display name must be less than 50 characters");
          expect(mockUpdate).not.toHaveBeenCalled();
      });
  });
});
