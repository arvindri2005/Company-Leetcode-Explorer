// Mock Firestore
const mockGetDocs = jest.fn();
const mockGetDoc = jest.fn();
const mockAddDoc = jest.fn();
const mockUpdateDoc = jest.fn();
const mockCollectionGroup = jest.fn();

// Mock Web APIs
global.fetch = jest.fn(() =>
  Promise.resolve({ json: () => Promise.resolve({}) }),
) as jest.Mock;
global.Response = jest.fn();
global.Headers = jest.fn();
global.Request = jest.fn();

jest.mock("firebase/firestore", () => ({
  getFirestore: jest.fn(),
  collection: jest.fn(),
  getDocs: mockGetDocs,
  doc: jest.fn(),
  getDoc: mockGetDoc,
  query: jest.fn(),
  where: jest.fn(),
  limit: jest.fn(),
  addDoc: mockAddDoc,
  updateDoc: mockUpdateDoc,
  orderBy: jest.fn(),
  collectionGroup: mockCollectionGroup,
}));

// Mock company.data
jest.mock("../company.data", () => ({
  getCompanyById: jest.fn(),
  getCompanyBySlug: jest.fn(),
}));

import {
  getProblemsByCompanyFromDb,
  getAllProblems,
  getProblemDetailsFromDb,
  getProblemByCompanySlugAndProblemSlug,
  getAllProblemCompanyAndProblemSlugs,
  addProblemToDb,
} from "../problem.data";
import { getCompanyById, getCompanyBySlug } from "../company.data";

const createMockDoc = (data: any) => ({
  id: data.id || "mock-id",
  data: () => data,
  exists: () => true,
});

describe("problem.data", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("getProblemsByCompanyFromDb", () => {
    it("should filter by difficulty", async () => {
      (getCompanyById as jest.Mock).mockResolvedValue({
        id: "1",
        name: "Company A",
        slug: "company-a",
      });
      mockGetDocs.mockResolvedValue({
        docs: [
          createMockDoc({ title: "Problem 1", difficulty: "Easy" }),
          createMockDoc({ title: "Problem 2", difficulty: "Medium" }),
        ],
      });
      const result = await getProblemsByCompanyFromDb("1", {
        difficultyFilter: "Easy",
      });
      expect(result.problems).toHaveLength(1);
      expect(result.problems[0].difficulty).toBe("Easy");
    });

    it("should handle errors", async () => {
      (getCompanyById as jest.Mock).mockRejectedValue(
        new Error("Firestore error"),
      );
      const result = await getProblemsByCompanyFromDb("1");
      expect(result.problems).toEqual([]);
    });
  });

  describe("addProblemToDb", () => {
    it("should add a new problem", async () => {
      mockGetDocs.mockResolvedValue({ empty: true, docs: [] });
      mockAddDoc.mockResolvedValue({ id: "new-id" });
      const result = await addProblemToDb("1", {
        title: "New Problem",
        normalizedTitle: "new problem",
      });
      expect(result.id).toBe("new-id");
      expect(result.updated).toBe(false);
    });

    it("should update an existing problem", async () => {
      mockGetDocs.mockResolvedValue({
        empty: false,
        docs: [createMockDoc({ id: "existing-id", title: "Existing Problem" })],
      });
      const result = await addProblemToDb("1", {
        title: "Existing Problem",
        normalizedTitle: "existing problem",
      });
      expect(result.id).toBe("existing-id");
      expect(result.updated).toBe(true);
    });
  });

  describe("getAllProblemCompanyAndProblemSlugs", () => {
    it("should return all slugs", async () => {
      (getCompanyById as jest.Mock).mockResolvedValue({
        id: "1",
        name: "Company A",
        slug: "company-a",
      });
      mockCollectionGroup.mockReturnValue({});
      mockGetDocs.mockResolvedValue({
        docs: [
          {
            ...createMockDoc({ title: "Problem 1", slug: "problem-1" }),
            ref: { parent: { parent: { id: "1" } } },
          },
        ],
      });
      const result = await getAllProblemCompanyAndProblemSlugs();
      expect(result).toHaveLength(1);
      expect(result[0].companySlug).toBe("company-a");
      expect(result[0].problemSlug).toBe("problem-1");
    });

    it("should handle errors", async () => {
      mockCollectionGroup.mockImplementation(() => {
        throw new Error("Firestore error");
      });
      const result = await getAllProblemCompanyAndProblemSlugs();
      expect(result).toEqual([]);
    });
  });
});
