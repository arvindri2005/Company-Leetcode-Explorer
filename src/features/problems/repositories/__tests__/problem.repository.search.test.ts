import { ProblemRepository } from "../problem.repository";
import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
  limit,
  startAfter,
  Firestore,
} from "firebase/firestore";

// Mock Firebase dependencies
jest.mock("@/lib/api/firebase", () => ({
  db: {}, // Mock db object
}));

jest.mock("@/lib/utils", () => ({
  slugify: (str: string) => str.toLowerCase().replace(/\s+/g, "-"),
}));

jest.mock("@/lib/utils/logger", () => ({
  Logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

// Mock Firestore functions
jest.mock("firebase/firestore", () => {
  const originalModule = jest.requireActual("firebase/firestore");
  return {
    ...originalModule,
    getFirestore: jest.fn(() => ({})),
    collection: jest.fn(),
    query: jest.fn(),
    where: jest.fn(),
    limit: jest.fn(),
    orderBy: jest.fn(),
    startAfter: jest.fn(),
    getDocs: jest.fn(),
    doc: jest.fn(),
    getDoc: jest.fn(),
    getCountFromServer: jest.fn(),
  };
});

describe("ProblemRepository Search Optimization", () => {
  let repository: ProblemRepository;
  const mockGetDocs = getDocs as jest.Mock;
  const mockQuery = query as jest.Mock;
  const mockWhere = where as jest.Mock;
  const mockCollection = collection as jest.Mock;
  const mockOrderBy = orderBy as jest.Mock;
  const mockLimit = limit as jest.Mock;

  beforeEach(() => {
    repository = new ProblemRepository();
    jest.clearAllMocks();

    // Default mock implementation for getDocs
    mockGetDocs.mockResolvedValue({
      docs: [],
      size: 0,
    });
  });

  describe("fetchAllProblemsCore", () => {
    it("should use range queries when searchTerm is provided", async () => {
      // Act
      await repository.getAllProblemsPaginated({
        searchTerm: "Two Sum",
        pageSize: 10,
      });

      // Assert
      // 1. Verify that 'where' was called with >= and <= for normalizedTitle
      const whereCalls = mockWhere.mock.calls;
      const normalizedTitleCalls = whereCalls.filter(
        (call) => call[0] === "normalizedTitle"
      );

      // We expect 2 calls: one for >= and one for <=
      // And we expect them to be passed to query()
      
      // Find the query call that includes these constraints
      // Since fetchAllProblemsCore might have multiple paths, we need to trace the execution.
      // If our logic works, it should hit the Semi-Optimized path but with constraints added.
      // Currently, it fetches ALL and filters in memory.
      // We want to verify the NEW behavior (once implemented). 
      // FOR NOW (Pre-implementation), this test should FAIL or show NO range queries if I assert on them.
      
      // Let's assert what we WANT to see:
      expect(normalizedTitleCalls.length).toBeGreaterThanOrEqual(2);
      expect(normalizedTitleCalls).toEqual(
        expect.arrayContaining([
          ["normalizedTitle", ">=", "two sum"],
          ["normalizedTitle", "<=", "two sum\uf8ff"],
        ])
      );
    });

    it("should NOT fetch unbounded results when searching", async () => {
       await repository.getAllProblemsPaginated({
        searchTerm: "Test",
      });

      // In the Semi-Optimized path, it calls query(col, ...constraints).
      // If optimization is missing, constraints are empty (except for basic filters).
      // If optimization is present, constraints include range filters.
      
      // We can inspect the calls to `query`.
      // The last call to `query` (before `getDocs`) should contain the range filters.
      const queryCalls = mockQuery.mock.calls;
      const lastQueryCall = queryCalls[queryCalls.length - 1];
      
      // We need to check if the arguments passed to query include the result of our where() calls.
      // Since 'where' returns a constraint object, we can't easily match object identity without capturing the return values.
      // However, we can check if 'where' was called correctly as a proxy.
      
      expect(mockWhere).toHaveBeenCalledWith("normalizedTitle", ">=", "test");
      expect(mockWhere).toHaveBeenCalledWith("normalizedTitle", "<=", "test\uf8ff");
    });
  });
});
