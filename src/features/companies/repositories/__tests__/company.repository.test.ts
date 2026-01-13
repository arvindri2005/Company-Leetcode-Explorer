import { doc, updateDoc } from "firebase/firestore";

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
  };
});

describe("CompanyRepository Security", () => {
  let repository: CompanyRepository;
  const mockUpdateDoc = updateDoc as jest.Mock;
  const mockDoc = doc as jest.Mock;

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
});
