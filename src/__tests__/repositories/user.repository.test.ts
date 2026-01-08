import { UserRepository } from "@/repositories/user.repository";
import { getDocs } from "firebase/firestore";
import { createMockFirestoreDoc, createMockTimestamp } from "../factories/data-factories";

// Mock Firebase
jest.mock("firebase/firestore", () => ({
  collection: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  documentId: jest.fn(),
  getDocs: jest.fn(),
  orderBy: jest.fn(),
}));

jest.mock("@/lib/api/firebase", () => ({
  db: {},
  auth: {},
}));

jest.mock("@/lib/utils/logger", () => ({
  Logger: {
    error: jest.fn(),
  },
}));

describe("UserRepository", () => {
  let userRepository: UserRepository;

  beforeEach(() => {
    jest.clearAllMocks();
    userRepository = new UserRepository();
  });

  describe("getProblemStatusesForIds", () => {
    it("should return empty object if invalid inputs", async () => {
      const result = await userRepository.getProblemStatusesForIds("", ["1"]);
      expect(result).toEqual({});

      const result2 = await userRepository.getProblemStatusesForIds("user1", []);
      expect(result2).toEqual({});
    });

    it("should fetch statuses for given problem IDs", async () => {
      const userId = "user1";
      const problemIds = ["p1", "p2"];
      const fixedDate = new Date("2024-01-01");
      
      const mockDocs = [
        createMockFirestoreDoc({
            status: "solved",
            companySlug: "google",
            problemSlug: "two-sum",
            updatedAt: createMockTimestamp(fixedDate),
        }, "p1")
      ];

      (getDocs as jest.Mock).mockResolvedValue({
        docs: mockDocs,
        forEach: (callback: any) => mockDocs.forEach(callback),
      });

      const result = await userRepository.getProblemStatusesForIds(userId, problemIds);

      expect(result).toEqual({
        p1: {
          problemId: "p1",
          status: "solved",
          companySlug: "google",
          problemSlug: "two-sum",
          updatedAt: fixedDate,
        },
      });
      expect(getDocs).toHaveBeenCalledTimes(1);
    });

    it("should handle chunking for more than 30 ids", async () => {
      const userId = "user1";
      // Generate 35 ids
      const problemIds = Array.from({ length: 35 }, (_, i) => `p${i}`);
      
      (getDocs as jest.Mock).mockResolvedValue({
        docs: [],
        forEach: (callback: any) => [].forEach(callback),
      });

      await userRepository.getProblemStatusesForIds(userId, problemIds);

      // Should be called twice: once for 30, once for 5
      expect(getDocs).toHaveBeenCalledTimes(2);
    });
  });

  describe("getBookmarksForIds", () => {
    it("should return empty set if invalid inputs", async () => {
      const result = await userRepository.getBookmarksForIds("", ["1"]);
      expect(result.size).toBe(0);

      const result2 = await userRepository.getBookmarksForIds("user1", []);
      expect(result2.size).toBe(0);
    });

    it("should fetch bookmarks for given problem IDs", async () => {
      const userId = "user1";
      const problemIds = ["p1", "p2"];

      const mockDocs = [
        createMockFirestoreDoc({}, "p1")
      ];

      (getDocs as jest.Mock).mockResolvedValue({
        docs: mockDocs,
        forEach: (callback: any) => mockDocs.forEach(callback),
      });

      const result = await userRepository.getBookmarksForIds(userId, problemIds);

      expect(result.has("p1")).toBe(true);
      expect(result.has("p2")).toBe(false);
      expect(getDocs).toHaveBeenCalledTimes(1);
    });
  });
});






