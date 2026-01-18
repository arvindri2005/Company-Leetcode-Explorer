import { where } from "firebase/firestore";

import { MAX_SEARCH_TERM_LENGTH } from "@/features/problems/constants/problem-constants";

import { problemRepository } from "../problem.repository";

// Mock Firebase dependencies
jest.mock("firebase/firestore", () => ({
  collection: jest.fn(),
  doc: jest.fn(),
  getDoc: jest.fn(),
  getDocs: jest.fn(() => Promise.resolve({ docs: [], size: 0 })),
  setDoc: jest.fn(),
  updateDoc: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  limit: jest.fn(),
  orderBy: jest.fn(),
  startAfter: jest.fn(),
  getCountFromServer: jest.fn(() => Promise.resolve({ data: () => ({ count: 0 }) })),
}));

jest.mock("@/lib/api/firebase", () => ({
  db: {},
}));

jest.mock("@/lib/utils/logger", () => ({
  Logger: {
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
  },
}));

jest.mock("@/features/companies/repositories/company.repository", () => ({
  companyRepository: {
    getCompanyById: jest.fn().mockResolvedValue({ id: "test-company", slug: "test-company" }),
  }
}));

describe("ProblemRepository Search Security", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should truncate search terms exceeding MAX_SEARCH_TERM_LENGTH", async () => {
    const longSearchTerm = "a".repeat(MAX_SEARCH_TERM_LENGTH + 50); // 150 chars
    const expectedTerm = "a".repeat(MAX_SEARCH_TERM_LENGTH); // 100 chars

    await problemRepository.getAllProblemsPaginated({
      searchTerm: longSearchTerm,
    });

    // Check that 'where' was called with the truncated term
    // The query construction uses >= truncatedTerm and <= truncatedTerm + \uf8ff
    
    // We expect where to be called with normalizedTitle >= expectedTerm
    expect(where).toHaveBeenCalledWith(
      "normalizedTitle", 
      ">=", 
      expectedTerm
    );
    
    // And normalizedTitle <= expectedTerm + \uf8ff
    expect(where).toHaveBeenCalledWith(
      "normalizedTitle", 
      "<=", 
      expectedTerm + "\uf8ff"
    );
  });

  it("should truncate search terms in getProblemsByCompany", async () => {
    const longSearchTerm = "b".repeat(MAX_SEARCH_TERM_LENGTH + 20);
    const expectedTerm = "b".repeat(MAX_SEARCH_TERM_LENGTH);

    await problemRepository.getProblemsByCompany("test-company", {
      searchTerm: longSearchTerm,
    });

    expect(where).toHaveBeenCalledWith(
      "normalizedTitle",
      ">=",
      expectedTerm
    );
    expect(where).toHaveBeenCalledWith(
      "normalizedTitle",
      "<=",
      expectedTerm + "\uf8ff"
    );
  });
});
