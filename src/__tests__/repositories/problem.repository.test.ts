
import { problemRepository } from "@/repositories/problem.repository";
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
  documentId: jest.fn(),
}));

jest.mock("@/lib/firebase", () => ({
  db: {},
}));

// Mock user repository
jest.mock("@/repositories/user.repository", () => ({
  userRepository: {
    getBookmarkedProblemIds: jest.fn(),
    getProblemStatuses: jest.fn(),
    getUser: jest.fn(), // If needed
  },
}));

// Mock company repository (if needed by problem repo, checking code...)
// ProblemRepository might use CompanyRepository or raw DB. Let's assume raw DB or internal methods for now.
// If ProblemRepo imports CompanyRepo for optimization, we mock it.

import { userRepository } from "@/repositories/user.repository";

describe("ProblemRepository.getProblemsByCompany", () => {
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

    (userRepository.getBookmarksForIds as jest.Mock).mockResolvedValue(new Set(["problem-1"]));
    (userRepository.getProblemStatusesForIds as jest.Mock).mockResolvedValue({
      "problem-1": { status: "solved" },
    });

    const result = await problemRepository.getProblemsByCompany(companyId, { userId });

    expect(result.problems[0].isBookmarked).toBe(true);
    expect(result.problems[0].currentStatus).toBe("solved");
  });

  it("should not merge user status when userId is NOT provided", async () => {
    const companyId = "1";

    const result = await problemRepository.getProblemsByCompany(companyId, {});

    expect(result.problems[0].isBookmarked).toBeUndefined();
    expect(result.problems[0].currentStatus).toBeUndefined();
  });

  it("should skip getCountFromServer when recencyCounts is provided and filtering by lastAsked", async () => {
    const companyId = "1";
    const recencyCounts = {
      last_30_days: 10,
      within_3_months: 5,
      within_6_months: 2,
      older_than_6_months: 1,
    };

    // Mock getDocs to return empty list to simplify
    (getDocs as jest.Mock).mockResolvedValue({ docs: [] });

    await problemRepository.getProblemsByCompany(companyId, {
      lastAskedFilter: ["last_30_days"],
      recencyCounts,
    });

    expect(getCountFromServer).not.toHaveBeenCalled();
  });
});
