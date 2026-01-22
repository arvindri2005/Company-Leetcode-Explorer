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
    limit: jest.fn((n) => ({ type: 'limit', value: n })),
    query: jest.fn(),
    where: jest.fn((field, op, val) => ({ type: "where", field, op, val })),
    orderBy: jest.fn(),
    getDocs: jest.fn(() => ({ docs: [] })),
  };
});

describe("CompanyRepository Security (Mass Assignment)", () => {
  let repository: CompanyRepository;
  const mockUpdateDoc = updateDoc as jest.Mock;
  const mockDoc = doc as jest.Mock;

  beforeEach(() => {
    repository = new CompanyRepository();
    jest.clearAllMocks();
  });

  it("should PREVENT updating sensitive computed fields (Mass Assignment)", async () => {
    // Setup
    const companyId = "test-company-id";
    const maliciousUpdate = {
      name: "Updated Name",
      description: "Updated Description",
      // Sensitive fields that should be ignored
      problemCount: 9999,
      difficultyCounts: { Easy: 100, Medium: 100, Hard: 100 },
      recencyCounts: {
        last_30_days: 100,
        within_3_months: 100,
        within_6_months: 100,
        older_than_6_months: 100,
      },
      commonTags: [{ tag: "hacked", count: 999 }],
      statsLastUpdatedAt: new Date("2025-01-01"),
    };
    
    mockDoc.mockReturnValue("mock-doc-ref");
    mockUpdateDoc.mockResolvedValue();

    // Act
    const result = await repository.updateCompany(companyId, maliciousUpdate);

    // Assert
    expect(result.success).toBe(true);

    const updateCallArgs = mockUpdateDoc.mock.calls[0];
    const updatesPassed = updateCallArgs[1];

    // Allowed fields should be present
    expect(updatesPassed).toHaveProperty("name", "Updated Name");
    expect(updatesPassed).toHaveProperty("description", "Updated Description");

    // Sensitive fields should be REMOVED
    expect(updatesPassed).not.toHaveProperty("problemCount");
    expect(updatesPassed).not.toHaveProperty("difficultyCounts");
    expect(updatesPassed).not.toHaveProperty("recencyCounts");
    expect(updatesPassed).not.toHaveProperty("commonTags");
    expect(updatesPassed).not.toHaveProperty("statsLastUpdatedAt");
  });

  it("should PREVENT Search Index Poisoning (normalizedName override)", async () => {
    // Setup
    const companyId = "test-company-id";
    // Malicious payload: Try to set normalizedName to something different than name
    const maliciousUpdate = {
      normalizedName: "hidden-search-term",
    };
    
    mockDoc.mockReturnValue("mock-doc-ref");
    mockUpdateDoc.mockResolvedValue();

    // Act
    // @ts-ignore - explicitly testing behavior with invalid/extra fields that might pass Zod weak checks
    const result = await repository.updateCompany(companyId, maliciousUpdate);

    // Assert
    expect(result.success).toBe(true);

    const updateCallArgs = mockUpdateDoc.mock.calls[0];
    const updatesPassed = updateCallArgs[1];

    // normalizedName should be removed because name was not provided
    expect(updatesPassed).not.toHaveProperty("normalizedName");
  });

  it("should correctly re-derive normalizedName when name is updated", async () => {
    // Setup
    const companyId = "test-company-id";
    const validUpdate = {
      name: "New Name",
    };
    
    mockDoc.mockReturnValue("mock-doc-ref");
    mockUpdateDoc.mockResolvedValue();

    // Act
    const result = await repository.updateCompany(companyId, validUpdate);

    // Assert
    expect(result.success).toBe(true);

    const updateCallArgs = mockUpdateDoc.mock.calls[0];
    const updatesPassed = updateCallArgs[1];

    expect(updatesPassed).toHaveProperty("name", "New Name");
    // Should auto-generate normalized name
    expect(updatesPassed).toHaveProperty("normalizedName", "new name");
  });
});
