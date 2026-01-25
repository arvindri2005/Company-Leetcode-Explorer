
import { 
  collection, 
  doc, 
  documentId, 
  getDoc, 
  getDocs, 
  limit, 
  orderBy, 
  query, 
  runTransaction,
  startAfter, 
  updateDoc, 
  where} from "firebase/firestore";

import { companyRepository } from "@/features/companies/repositories/company.repository";

import { createMockCompany, createMockFirestoreDoc } from "../factories/data-factories";

// Mock Firebase
jest.mock("firebase/firestore", () => {
  class MockTimestamp {
    seconds: number;
    nanoseconds: number;
    
    constructor(seconds: number, nanoseconds: number) {
      this.seconds = seconds;
      this.nanoseconds = nanoseconds;
    }

    toDate() {
      return new Date(this.seconds * 1000);
    }
    
    static now() {
      return new MockTimestamp(Math.floor(Date.now() / 1000), 0);
    }

    static fromDate(date: Date) {
        return new MockTimestamp(Math.floor(date.getTime() / 1000), 0);
    }
  }

  return {
    collection: jest.fn(),
    query: jest.fn(),
    where: jest.fn(),
    orderBy: jest.fn(),
    limit: jest.fn(),
    startAfter: jest.fn(),
    getDocs: jest.fn(),
    getDoc: jest.fn(),
    doc: jest.fn(),
    setDoc: jest.fn(),
    updateDoc: jest.fn(),
    documentId: jest.fn(),
    runTransaction: jest.fn(),
    Timestamp: MockTimestamp,
  };
});

// Import the mocked Timestamp to use in test data
const { Timestamp } = require("firebase/firestore");

jest.mock("@/lib/api/firebase", () => ({
  db: {},
}));

describe("CompanyRepository", () => {
  const mockCompany = createMockCompany({
    id: "1",
    slug: "google",
    name: "Google",
    normalizedName: "google",
  });

  const mockCompanyDoc = createMockFirestoreDoc({
    ...mockCompany,
    // Simulate Firestore specific fields using the local MockTimestamp class
    statsLastUpdatedAt: mockCompany.statsLastUpdatedAt 
      ? Timestamp.fromDate(mockCompany.statsLastUpdatedAt) 
      : null,
  }, mockCompany.id);

  beforeEach(() => {
    jest.clearAllMocks();
    (collection as jest.Mock).mockReturnValue("companies-collection");
    (doc as jest.Mock).mockReturnValue("company-doc-ref");
    (orderBy as jest.Mock).mockReturnValue("orderBy-constraint");
    (limit as jest.Mock).mockReturnValue("limit-constraint");
    (where as jest.Mock).mockReturnValue("where-constraint");
    (startAfter as jest.Mock).mockReturnValue("startAfter-constraint");
    (documentId as jest.Mock).mockReturnValue("documentId-sentinel");
  });

  describe("getCompanies", () => {
    it("should return paginated companies", async () => {
      (getDocs as jest.Mock).mockResolvedValue({
        docs: [mockCompanyDoc],
      });

      const result = await companyRepository.getCompanies({ page: 1, pageSize: 10 });

      expect(result.companies).toHaveLength(1);
      expect(result.companies[0].id).toBe(mockCompany.id);
      expect(result.hasMore).toBe(false);
      expect(getDocs).toHaveBeenCalled();
      
      // Verify query constraints
      expect(query).toHaveBeenCalledWith(
        "companies-collection",
        expect.anything(),
        expect.anything(),
        expect.anything() 
      );
    });

    it("should filter by search term", async () => {
        (getDocs as jest.Mock).mockResolvedValue({
          docs: [mockCompanyDoc],
        });
  
        const searchTerm = "Google";
        await companyRepository.getCompanies({ page: 1, pageSize: 10, searchTerm });
  
        expect(where).toHaveBeenCalledWith("normalizedName", ">=", "google");
        expect(where).toHaveBeenCalledWith("normalizedName", "<=", "google\uf8ff");
    });

    it("should handle cursor pagination (Load More)", async () => {
        (getDocs as jest.Mock).mockResolvedValue({
            docs: [mockCompanyDoc],
        });

        const cursor = Buffer.from(JSON.stringify({ normalizedName: "google", id: "1" })).toString("base64");
        await companyRepository.getCompanies({ cursor, pageSize: 10 });

        expect(startAfter).toHaveBeenCalledWith("google", "1");
    });
    
    it("should generate nextCursor if there are more results", async () => {
         // Create enough docs to trigger hasMore (pageSize + 1)
         const docs = Array.from({ length: 11 }, (_, i) => 
             createMockFirestoreDoc({ 
               ...mockCompany, 
               id: `${i}`, 
               name: `Company ${i}`, 
               normalizedName: `company ${i}`,
               statsLastUpdatedAt: Timestamp.now()
             }, `${i}`)
         );
         
         (getDocs as jest.Mock).mockResolvedValue({ docs });

         const result = await companyRepository.getCompanies({ page: 1, pageSize: 10 });
         
         expect(result.companies).toHaveLength(10);
         expect(result.hasMore).toBe(true);
         expect(result.nextCursor).toBeDefined();
    });
  });

  describe("getCompanyById", () => {
      it("should return company if it exists", async () => {
          (getDoc as jest.Mock).mockResolvedValue(mockCompanyDoc);
          
          const result = await companyRepository.getCompanyById("1");
          
          expect(result).toBeDefined();
          expect(result?.id).toBe("1");
          expect(doc).toHaveBeenCalledWith(expect.anything(), "companies", "1");
      });

      it("should return undefined if company does not exist", async () => {
          (getDoc as jest.Mock).mockResolvedValue({
              exists: () => false,
          });

          const result = await companyRepository.getCompanyById("non-existent");

          expect(result).toBeUndefined();
      });
  });

  describe("getCompanyBySlug", () => {
      it("should return company if it exists", async () => {
          (getDoc as jest.Mock).mockResolvedValue(mockCompanyDoc);

          const result = await companyRepository.getCompanyBySlug("google");

          expect(result).toBeDefined();
          expect(result?.slug).toBe("google");
          expect(doc).toHaveBeenCalledWith(expect.anything(), "companies", "google");
      });
  });
  
  describe("addCompany", () => {
      it("should add a new company successfully", async () => {
          // Mock runTransaction to execute the callback successfully
          const mockTransaction = {
              get: jest.fn().mockResolvedValue({ exists: () => false }),
              set: jest.fn(),
          };
          (runTransaction as jest.Mock).mockImplementation(async (_db: unknown, callback: (tx: typeof mockTransaction) => Promise<void>) => {
              await callback(mockTransaction);
          });

          const newCompanyData = {
              name: "New Corp",
              logo: "https://example.com/logo.png",
          };

          const result = await companyRepository.addCompany(newCompanyData);

          expect(result.id).toBe("new-corp");
          expect(result.error).toBeUndefined();
          expect(mockTransaction.set).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({
              name: "New Corp",
              normalizedName: "new corp",
              slug: "new-corp"
          }));
      });

      it("should return error if company already exists", async () => {
           // Mock runTransaction to throw ALREADY_EXISTS error when company exists
           const mockTransaction = {
               get: jest.fn().mockResolvedValue({ exists: () => true }),
               set: jest.fn(),
           };
           (runTransaction as jest.Mock).mockImplementation(async (_db: unknown, callback: (tx: typeof mockTransaction) => Promise<void>) => {
               await callback(mockTransaction);
           });
           
           const result = await companyRepository.addCompany({ name: "Google" });
           
           expect(result.id).toBe("google"); // Returns slug of the company name
           expect(result.alreadyExists).toBe(true);
           expect(mockTransaction.set).not.toHaveBeenCalled();
      });

       it("should return error if validation fails", async () => {
          const result = await companyRepository.addCompany({ name: "" }); // Invalid name
          
          expect(result.id).toBeNull();
          expect(result.error).toBeDefined();
      });
  });

  describe("updateCompany", () => {
      it("should update company successfully", async () => {
          const updates = { description: "Updated description" };
          
          const result = await companyRepository.updateCompany("1", updates);
          
          expect(result.success).toBe(true);
          expect(updateDoc).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({
              description: "Updated description"
          }));
      });
      
      it("should update normalizedName if name is changed", async () => {
          const result = await companyRepository.updateCompany("1", { name: "Updated Name" });
          
          expect(result.success).toBe(true);
          expect(updateDoc).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({
              name: "Updated Name",
              normalizedName: "updated name"
          }));
      });

      it("should return error if companyId is missing", async () => {
          const result = await companyRepository.updateCompany("", { name: "test" });
          expect(result.success).toBe(false);
      });
  });

  describe("fetchCompanySuggestions", () => {
      it("should return suggestions based on search term", async () => {
          (getDocs as jest.Mock).mockResolvedValue({
              docs: [mockCompanyDoc]
          });

          const result = await companyRepository.fetchCompanySuggestions("Goo");

          expect(result).toHaveLength(1);
          expect(result[0].name).toBe("Google");
          expect(where).toHaveBeenCalledWith("normalizedName", ">=", "goo");
      });

      it("should return empty array for empty search term", async () => {
          const result = await companyRepository.fetchCompanySuggestions("");
          expect(result).toEqual([]);
          expect(getDocs).not.toHaveBeenCalled();
      });
  });
});






