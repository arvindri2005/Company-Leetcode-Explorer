
import { getProblemsByCompanyFromDb } from "@/lib/db/problem.data";
import { dbGetUserBookmarkedProblemsInfo, dbGetAllUserProblemStatuses } from "@/lib/db/user.data";
import { getCountFromServer, getDocs } from "firebase/firestore";

// Mock next/cache
jest.mock("next/cache", () => ({
  unstable_cache: (fn: any) => fn,
}));

// Mock Firebase
jest.mock("firebase/firestore", () => ({
  collection: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  orderBy: jest.fn(),
  limit: jest.fn(),
  startAfter: jest.fn(),
  getDocs: jest.fn(),
  getCountFromServer: jest.fn(),
  doc: jest.fn(),
  getDoc: jest.fn(),
}));

jest.mock("@/lib/firebase", () => ({
  db: {},
}));

// Mock user data functions
jest.mock("@/lib/db/user.data", () => ({
  dbGetUserBookmarkedProblemsInfo: jest.fn(),
  dbGetAllUserProblemStatuses: jest.fn(),
}));

// Mock company data
jest.mock("@/lib/db/company.data", () => ({
  getCompanyById: jest.fn().mockResolvedValue({ id: "1", name: "Test Company", slug: "test-company" }),
}));

describe("getProblemsByCompanyFromDb", () => {
  const mockProblems = [
    {
      id: "problem-1",
      title: "Problem 1",
      difficulty: "Easy",
      companyIds: ["1"],
      normalizedTitle: "problem 1",
      data: () => ({
          title: "Problem 1",
          difficulty: "Easy",
          companyIds: ["1"],
          normalizedTitle: "problem 1",
      })
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    (getCountFromServer as jest.Mock).mockResolvedValue({
      data: () => ({ count: 1 }),
    });
    (getDocs as jest.Mock).mockResolvedValue({
      docs: mockProblems,
    });
  });

  it("should merge user status when userId is provided", async () => {
    const userId = "user-1";
    const companyId = "1";

    (dbGetUserBookmarkedProblemsInfo as jest.Mock).mockResolvedValue([
      { problemId: "problem-1" },
    ]);
    (dbGetAllUserProblemStatuses as jest.Mock).mockResolvedValue({
      "problem-1": { status: "solved" },
    });

    const result = await getProblemsByCompanyFromDb(companyId, { userId });

    expect(result.problems[0].isBookmarked).toBe(true);
    expect(result.problems[0].currentStatus).toBe("solved");
  });

  it("should not merge user status when userId is NOT provided", async () => {
    const companyId = "1";

    const result = await getProblemsByCompanyFromDb(companyId, {});

    expect(result.problems[0].isBookmarked).toBeUndefined();
    expect(result.problems[0].currentStatus).toBeUndefined();
  });
});
