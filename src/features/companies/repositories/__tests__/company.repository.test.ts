import { doc, getDocs, limit, updateDoc } from "firebase/firestore";

import { CompanyRepository } from "../company.repository";

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
    doc: jest.fn(),
    updateDoc: jest.fn(),
    limit: jest.fn((n) => ({ type: 'limit', value: n })),
    query: jest.fn(),
    getDocs: jest.fn(() => ({ docs: [] })),
  };
});

describe("CompanyRepository Security", () => {
  let repository: CompanyRepository;
  const mockUpdateDoc = updateDoc as jest.Mock;
  const mockDoc = doc as jest.Mock;
  const mockLimit = limit as jest.Mock;
  const mockGetDocs = getDocs as jest.Mock;

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
  });
  
  describe("fetchCompanySuggestions (Security)", () => {
      it("should CLAMP limit to MAX_SUGGESTION_LIMIT (20)", async () => {
          // Act
          await repository.fetchCompanySuggestions("test", 1000);

          // Assert
          // limit should be called with 20
          expect(mockLimit).toHaveBeenCalledWith(20);
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
