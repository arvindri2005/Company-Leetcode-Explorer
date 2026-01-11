import { updateDoc } from "firebase/firestore";

import { userRepository } from "@/features/profile/repositories/user.repository";
import { EducationExperienceSchema, WorkExperienceSchema } from "@/types";

// Mock Firebase
jest.mock("firebase/firestore", () => ({
  collection: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  documentId: jest.fn(),
  getDocs: jest.fn(),
  orderBy: jest.fn(),
  doc: jest.fn(),
  updateDoc: jest.fn(),
  addDoc: jest.fn(),
  setDoc: jest.fn(),
  writeBatch: jest.fn(),
  serverTimestamp: jest.fn(),
}));

jest.mock("@/lib/api/firebase", () => ({
  db: {},
  auth: {},
}));

jest.mock("@/lib/utils/logger", () => ({
  Logger: {
    error: jest.fn(),
    warn: jest.fn(),
  },
}));

describe("User Input Validation Security", () => {
  const LONG_STRING = "a".repeat(1001); // Create a string longer than standard reasonable limits

  describe("EducationExperienceSchema", () => {
    it("should reject extremely long degree names", () => {
      const result = EducationExperienceSchema.safeParse({
        degree: LONG_STRING,
        major: "CS",
        school: "Uni",
      });
      expect(result.success).toBe(false);
    });

    it("should reject extremely long school names", () => {
        const result = EducationExperienceSchema.safeParse({
          degree: "BS",
          major: "CS",
          school: LONG_STRING,
        });
        expect(result.success).toBe(false);
      });
  });

  describe("WorkExperienceSchema", () => {
    it("should reject extremely long job titles", () => {
      const result = WorkExperienceSchema.safeParse({
        jobTitle: LONG_STRING,
        companyName: "Acme",
        startDate: "2020",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("updateUserDisplayName", () => {
      it("should reject extremely long display names", async () => {
          (updateDoc as jest.Mock).mockResolvedValueOnce();
          
          const result = await userRepository.updateUserDisplayName("user1", LONG_STRING);
          
          expect(result.success).toBe(false);
          expect(result.error).toContain("Display name must be less than 50 characters");
          expect(updateDoc).not.toHaveBeenCalled();
      });
  });
});
