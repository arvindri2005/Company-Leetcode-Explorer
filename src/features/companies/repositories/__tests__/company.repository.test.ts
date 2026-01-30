import { doc, getDocs, limit, updateDoc, where } from "firebase/firestore";

import { CompanyRepository } from "../company.repository";

// Mock Firebase dependencies
jest.mock("@/shared/lib/api/firebase", () => ({
  db: {}, // Mock db object
}));

jest.mock("@/shared/lib/utils", () => ({
  slugify: (str: string) => str.toLowerCase().replace(/\s+/g, "-"),
}));

jest.mock("@/shared/lib/utils/logger", () => ({
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
    doc: jest.fn(),
    updateDoc: jest.fn(),
    limit: jest.fn((n) => ({ type: 'limit', value: n })),
    query: jest.fn(),
    where: jest.fn((field, op, val) => ({ type: "where", field, op, val })),
    orderBy: jest.fn(),
    getDocs: jest.fn(() => ({ docs: [] })),
  };
});

describe("CompanyRepository Security", () => {
  let repository: CompanyRepository;
  const mockUpdateDoc = updateDoc as jest.Mock;
  const mockDoc = doc as jest.Mock;
  const mockLimit = limit as jest.Mock;
  const mockGetDocs = getDocs as jest.Mock;
  const mockWhere = where as jest.Mock;

  beforeEach(() => {
    repository = new CompanyRepository();
    jest.clearAllMocks();
  });

  describe("updateCompany", () => {
    it("should BLOCK invalid website URL (vulnerability fix verification)", async () => {
      // Setup
      const companyId = "test-company-id";
      const unsafeData = {
        website: "javascript:alert('XSS')",
      };
      
      mockDoc.mockReturnValue("mock-doc-ref");
      mockUpdateDoc.mockResolvedValue();

      // Act
      const result = await repository.updateCompany(companyId, unsafeData);

      // Assert - After the fix, this should fail validation and NOT call updateDoc
      expect(result.success).toBe(false);
      expect(result.error).toMatch(/Website must start with http:\/\/ or https:\/\//);
      expect(mockUpdateDoc).not.toHaveBeenCalled();
    });

    it("should ALLOW valid website URL", async () => {
        // Setup
        const companyId = "test-company-id";
        const safeData = {
          website: "https://example.com",
        };
        
        mockDoc.mockReturnValue("mock-doc-ref");
        mockUpdateDoc.mockResolvedValue();
  
        // Act
        const result = await repository.updateCompany(companyId, safeData);
  
        // Assert
        expect(result.success).toBe(true);
        expect(mockUpdateDoc).toHaveBeenCalledTimes(1);
      });

    it("should PREVENT extra fields from being saved (Mass Assignment)", async () => {
      // Setup
      const companyId = "test-company-id";
      const massAssignmentAttempt = {
        name: "Valid Name",
        isAdmin: true, // Malicious extra field
        roles: ["admin"], // Another malicious extra field
      };
      
      mockDoc.mockReturnValue("mock-doc-ref");
      mockUpdateDoc.mockResolvedValue();

      // Act
      // @ts-ignore - simulating untyped input or casted input
      await repository.updateCompany(companyId, massAssignmentAttempt);

      // Assert
      // Verify what was passed to updateDoc
      const updateCallArgs = mockUpdateDoc.mock.calls[0];
      // updateCallArgs[0] is docRef, updateCallArgs[1] is data
      // However, check how updateDoc mock was called. In beforeEach it's cleared.
      // If previous test ran, mock might have calls. But beforeEach clears it.
      
      const updatesPassed = updateCallArgs[1];

      // Expect 'name' to be present
      expect(updatesPassed).toHaveProperty("name", "Valid Name");

      // Expect malicious fields to be ABSENT
      expect(updatesPassed).not.toHaveProperty("isAdmin");
      expect(updatesPassed).not.toHaveProperty("roles");
    });
  });

  describe("getCompanies (Pagination Security)", () => {
    it("should BLOCK query when offset limit is exceeded (DoS prevention)", async () => {
      // Setup: page * pageSize = 100 * 50 = 5000 > 2000
      const params = {
        page: 100,
        pageSize: 50,
      };

      // Act
      const result = await repository.getCompanies(params);

      // Assert
      // Should return empty result (due to catch block in repository)
      expect(result.companies).toEqual([]);
      // Crucially, getDocs should NOT have been called, avoiding the expensive read
      expect(mockGetDocs).not.toHaveBeenCalled();
    });

    it("should CLAMP pageSize to MAX_PAGE_SIZE (50)", async () => {
      // Setup: Request 1000 page size
      const params = {
        page: 1,
        pageSize: 1000
      };

      // Act
      await repository.getCompanies(params);

      // Assert
      // limit is called with (page * safePageSize) + 1
      // safePageSize should be 50. page=1. limit should be 51.
      // NOT 1001.
      expect(mockLimit).toHaveBeenCalledWith(51);
    });

    it("should TRUNCATE search term to MAX_SEARCH_TERM_LENGTH (100)", async () => {
      // Setup
      const longTerm = "a".repeat(200);
      const expectedTerm = "a".repeat(100);

      // Act
      await repository.getCompanies({ searchTerm: longTerm });

      // Assert
      // The repository performs: searchTerm?.trim().slice(0, 100).toLowerCase()
      // We expect 'where' to be called with the truncated term
      expect(mockWhere).toHaveBeenCalledWith(
        "normalizedName",
        ">=",
        expectedTerm,
      );
    });
  });

  describe("fetchCompanySuggestions (Security)", () => {
    it("should CLAMP limit to MAX_SUGGESTION_LIMIT (20)", async () => {
      // Act
      await repository.fetchCompanySuggestions("test", 1000);

      // Assert
      // limit should be called with 20
      expect(mockLimit).toHaveBeenCalledWith(20);
    });

    it("should TRUNCATE search term to MAX_SEARCH_TERM_LENGTH (100)", async () => {
      // Setup
      const longTerm = "b".repeat(200);
      const expectedTerm = "b".repeat(100);

      // Act
      await repository.fetchCompanySuggestions(longTerm);

      // Assert
      expect(mockWhere).toHaveBeenCalledWith(
        "normalizedName",
        ">=",
        expectedTerm,
      );
    });
  });

  describe("getAllCompanySlugs (DoS Prevention)", () => {
      it("should apply MAX_ALL_SLUGS_LIMIT (10000)", async () => {
          // Act
          await repository.getAllCompanySlugs();

          // Assert
          expect(mockLimit).toHaveBeenCalledWith(10000);
      });
  });
});
