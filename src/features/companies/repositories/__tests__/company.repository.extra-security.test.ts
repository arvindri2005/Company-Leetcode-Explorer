import { updateDoc } from "firebase/firestore";

import { CompanyRepository } from "../company.repository";

// Mock Firebase dependencies
jest.mock("@/shared/lib/api/firebase", () => ({
  db: {}, // Mock db object
}));

jest.mock("@/shared/lib/utils", () => ({
  slugify: (str: string) =>
    str
      .toLowerCase()
      .trim()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, ""),
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
    collection: jest.fn(() => ({})),
    doc: jest.fn(),
    updateDoc: jest.fn(),
    setDoc: jest.fn(),
    getDoc: jest.fn(() => ({ exists: () => false })),
    limit: jest.fn((n) => ({ type: "limit", value: n })),
    query: jest.fn(),
    runTransaction: jest.fn(async (db, callback) => {
      const transactionMock = {
        get: jest.fn().mockResolvedValue({ exists: () => false }),
        set: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      };
      return callback(transactionMock);
    }),
  };
});

describe("CompanyRepository Extra Security", () => {
  let repository: CompanyRepository;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const mockUpdateDoc = updateDoc as jest.Mock;

  beforeEach(() => {
    repository = new CompanyRepository();
    jest.clearAllMocks();
  });

  describe("Description XSS Prevention", () => {
    it("should BLOCK addCompany when description contains invalid characters (< or >)", async () => {
      const xssInput = {
        name: "Safe Name",
        description: "Description with <script>alert(1)</script>",
      };

      const result = await repository.addCompany(xssInput as any);

      expect(result.id).toBeNull();
      expect(result.error).toMatch(/Description contains invalid characters/);
    });

     it("should BLOCK updateCompany when description contains invalid characters (< or >)", async () => {
      const companyId = "test-company";
      const xssUpdate = {
        description: "Description with <script>alert(1)</script>",
      };

      const result = await repository.updateCompany(companyId, xssUpdate);

      expect(result.success).toBe(false);
      expect(result.error).toMatch(/Description contains invalid characters/);
    });
  });

  describe("RelatedCompanies XSS Prevention", () => {
    it("should BLOCK addCompany when relatedCompanies contains invalid characters (< or >)", async () => {
      const xssInput = {
        name: "Safe Name",
        relatedCompanies: ["Safe Co", "<script>alert(1)</script>"],
      };

      const result = await repository.addCompany(xssInput as any);

      expect(result.id).toBeNull();
      expect(result.error).toMatch(/Related company names contain invalid characters/);
    });

     it("should BLOCK updateCompany when relatedCompanies contains invalid characters (< or >)", async () => {
      const companyId = "test-company";
      const xssUpdate = {
        relatedCompanies: ["Safe Co", "<script>alert(1)</script>"],
      };

      const result = await repository.updateCompany(companyId, xssUpdate);

      expect(result.success).toBe(false);
      expect(result.error).toMatch(/Related company names contain invalid characters/);
    });
  });
});
