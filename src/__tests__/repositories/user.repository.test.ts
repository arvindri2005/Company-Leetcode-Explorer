import { userRepository } from "@/repositories/user.repository";
import { db } from "@/lib/firebase";
import {
  doc,
  getDoc,
  deleteDoc,
  setDoc,
  writeBatch,
  serverTimestamp,
  arrayRemove,
  arrayUnion,
  deleteField,
} from "firebase/firestore";

// Mock dependencies
jest.mock("@/lib/firebase", () => {
  return {
    db: {}, // Mock db instance
  };
});

jest.mock("@/lib/logger", () => ({
  Logger: {
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
  },
}));

// Mock Firestore functions
const mockGetDoc = jest.fn();
const mockSetDoc = jest.fn();
const mockUpdateDoc = jest.fn();
const mockDeleteDoc = jest.fn();
const mockDoc = jest.fn();
const mockCollection = jest.fn();
const mockWriteBatch = jest.fn();
const mockQuery = jest.fn();
const mockGetDocs = jest.fn();
const mockWhere = jest.fn();
const mockOrderBy = jest.fn();
const mockServerTimestamp = jest.fn(() => "serverTimestamp");
const mockArrayUnion = jest.fn((...args) => ({ type: "arrayUnion", elements: args }));
const mockArrayRemove = jest.fn((...args) => ({ type: "arrayRemove", elements: args }));
const mockDeleteField = jest.fn(() => "deleteField");

jest.mock("firebase/firestore", () => ({
  getFirestore: jest.fn(),
  collection: (...args: any[]) => mockCollection(...args),
  doc: (...args: any[]) => mockDoc(...args),
  getDoc: (...args: any[]) => mockGetDoc(...args),
  setDoc: (...args: any[]) => mockSetDoc(...args),
  updateDoc: (...args: any[]) => mockUpdateDoc(...args),
  deleteDoc: (...args: any[]) => mockDeleteDoc(...args),
  writeBatch: (...args: any[]) => mockWriteBatch(...args),
  query: (...args: any[]) => mockQuery(...args),
  getDocs: (...args: any[]) => mockGetDocs(...args),
  where: (...args: any[]) => mockWhere(...args),
  orderBy: (...args: any[]) => mockOrderBy(...args),
  serverTimestamp: () => mockServerTimestamp(),
  arrayUnion: (...args: any[]) => mockArrayUnion(...args),
  arrayRemove: (...args: any[]) => mockArrayRemove(...args),
  deleteField: () => mockDeleteField(),
  documentId: jest.fn(),
}));

describe("UserRepository - Soft Deletes", () => {
  const userId = "test-user-id";
  const problemId = "test-problem-id";
  const companySlug = "test-company";
  const problemSlug = "test-problem";
  const bookmarkDocPath = `users/${userId}/bookmarkedProblems/${problemId}`;

  let mockBatch: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockBatch = {
      set: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      commit: jest.fn().mockResolvedValue(undefined),
    };
    mockWriteBatch.mockReturnValue(mockBatch);
  });

  describe("toggleBookmarkProblem", () => {
    it("should soft delete (set deletedAt) when document exists and is active", async () => {
      // Arrange
      mockDoc.mockImplementation((_db, ...pathSegments) => ({ path: pathSegments.join("/") }));
      mockGetDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({ bookmarkedAt: "some-date" }), // No deletedAt
      });

      // Act
      const result = await userRepository.toggleBookmarkProblem(userId, problemId, companySlug, problemSlug);

      // Assert
      expect(result.isBookmarked).toBe(false);
      expect(mockBatch.update).toHaveBeenCalledWith(
        expect.objectContaining({ path: expect.stringContaining(problemId) }),
        expect.objectContaining({ deletedAt: "serverTimestamp" })
      );
      expect(mockBatch.delete).not.toHaveBeenCalled(); // Should NOT call hard delete
      // Verify aggregate update
      expect(mockBatch.set).toHaveBeenCalledWith(
          expect.objectContaining({ path: expect.stringContaining("aggregates/problemStats") }),
          expect.objectContaining({ bookmarkedProblemIds: { type: "arrayRemove", elements: [problemId] } }),
          { merge: true }
      );
    });

    it("should restore (remove deletedAt) when document exists but is soft-deleted", async () => {
      // Arrange
      mockDoc.mockImplementation((_db, ...pathSegments) => ({ path: pathSegments.join("/") }));
      mockGetDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({ bookmarkedAt: "old-date", deletedAt: "some-date" }), // Has deletedAt
      });

      // Act
      const result = await userRepository.toggleBookmarkProblem(userId, problemId, companySlug, problemSlug);

      // Assert
      expect(result.isBookmarked).toBe(true);
      expect(mockBatch.update).toHaveBeenCalledWith(
        expect.objectContaining({ path: expect.stringContaining(problemId) }),
        expect.objectContaining({
          deletedAt: "deleteField",
          bookmarkedAt: "serverTimestamp",
        })
      );
      // Verify aggregate update
      expect(mockBatch.set).toHaveBeenCalledWith(
          expect.objectContaining({ path: expect.stringContaining("aggregates/problemStats") }),
          expect.objectContaining({ bookmarkedProblemIds: { type: "arrayUnion", elements: [problemId] } }),
          { merge: true }
      );
    });

    it("should create new document when document does not exist", async () => {
      // Arrange
      mockDoc.mockImplementation((_db, ...pathSegments) => ({ path: pathSegments.join("/") }));
      mockGetDoc.mockResolvedValue({
        exists: () => false,
        data: () => undefined,
      });

      // Act
      const result = await userRepository.toggleBookmarkProblem(userId, problemId, companySlug, problemSlug);

      // Assert
      expect(result.isBookmarked).toBe(true);
      expect(mockBatch.set).toHaveBeenCalledWith(
        expect.objectContaining({ path: expect.stringContaining(problemId) }),
        expect.objectContaining({
          bookmarkedAt: "serverTimestamp",
          companySlug,
          problemSlug,
        })
      );
       // Verify aggregate update
       expect(mockBatch.set).toHaveBeenCalledWith(
        expect.objectContaining({ path: expect.stringContaining("aggregates/problemStats") }),
        expect.objectContaining({ bookmarkedProblemIds: { type: "arrayUnion", elements: [problemId] } }),
        { merge: true }
    );
    });
  });

  describe("getBookmarksForIds", () => {
    it("should exclude soft-deleted bookmarks", async () => {
      // Arrange
      const mockDocs = [
        { id: "1", data: () => ({ deletedAt: null }) }, // Active
        { id: "2", data: () => ({ deletedAt: "some-date" }) }, // Soft Deleted
        { id: "3", data: () => ({}) }, // Active (undefined deletedAt)
      ];

      mockGetDocs.mockResolvedValue({
        forEach: (callback: any) => mockDocs.forEach(callback),
      });

      // Act
      const result = await userRepository.getBookmarksForIds(userId, ["1", "2", "3"]);

      // Assert
      expect(result.has("1")).toBe(true);
      expect(result.has("2")).toBe(false); // Should be excluded
      expect(result.has("3")).toBe(true);
    });
  });

  describe("getBookmarkedProblemsInfo", () => {
    it("should exclude soft-deleted bookmarks", async () => {
      // Arrange
      const mockDocs = [
        {
          id: "1",
          data: () => ({
            companySlug: "c1",
            problemSlug: "p1",
            bookmarkedAt: { toDate: () => new Date() },
          }),
        },
        {
          id: "2",
          data: () => ({
            companySlug: "c2",
            problemSlug: "p2",
            bookmarkedAt: { toDate: () => new Date() },
            deletedAt: "some-date", // Soft Deleted
          }),
        },
      ];

      mockGetDocs.mockResolvedValue({
        docs: mockDocs,
      });

      // Act
      const result = await userRepository.getBookmarkedProblemsInfo(userId);

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0].problemId).toBe("1");
    });
  });
});
