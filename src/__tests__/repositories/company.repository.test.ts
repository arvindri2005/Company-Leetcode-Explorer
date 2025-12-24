
import { companyRepository } from "@/repositories/company.repository";
import {
  getFirestore,
  doc,
  getDoc,
  getDocs,
  collection,
  query,
  where,
  updateDoc,
  writeBatch,
  Timestamp
} from "firebase/firestore";
import { Company } from "@/types";

// Mock Firebase
jest.mock("firebase/firestore", () => {
  const originalModule = jest.requireActual("firebase/firestore");
  return {
    ...originalModule,
    getFirestore: jest.fn(),
    collection: jest.fn(),
    doc: jest.fn(),
    getDoc: jest.fn(),
    getDocs: jest.fn(),
    query: jest.fn(),
    where: jest.fn(),
    limit: jest.fn(),
    orderBy: jest.fn(),
    updateDoc: jest.fn(),
    writeBatch: jest.fn(() => ({
      delete: jest.fn(),
      update: jest.fn(),
      commit: jest.fn().mockResolvedValue(undefined),
    })),
    deleteDoc: jest.fn(), // We are not using this anymore for soft delete, but for completeness
    startAfter: jest.fn(),
    documentId: jest.fn(),
  };
});

jest.mock("@/lib/firebase", () => ({
  db: {},
}));

describe("CompanyRepository Soft Delete", () => {
  const mockDb = {};

  beforeEach(() => {
    jest.clearAllMocks();
    (getFirestore as jest.Mock).mockReturnValue(mockDb);
  });

  describe("deleteCompany", () => {
    it("should perform a soft delete by updating deletedAt", async () => {
      const companyId = "test-company-id";

      (doc as jest.Mock).mockReturnValue("mock-doc-ref");
      (updateDoc as jest.Mock).mockResolvedValue(undefined);

      const result = await companyRepository.deleteCompany(companyId);

      expect(doc).toHaveBeenCalledWith(mockDb, "companies", companyId);
      expect(updateDoc).toHaveBeenCalledWith(
        "mock-doc-ref",
        expect.objectContaining({ deletedAt: expect.any(Date) })
      );
      expect(result.success).toBe(true);
    });

    it("should fail if companyId is missing", async () => {
      const result = await companyRepository.deleteCompany("");
      expect(result.success).toBe(false);
      expect(result.error).toBe("Company ID is required");
    });
  });

  describe("bulkDeleteCompanies", () => {
    it("should perform soft delete on multiple companies", async () => {
      const companyIds = ["id1", "id2"];
      const mockBatch = {
        delete: jest.fn(),
        update: jest.fn(),
        commit: jest.fn().mockResolvedValue(undefined),
      };
      (writeBatch as jest.Mock).mockReturnValue(mockBatch);
      (doc as jest.Mock).mockImplementation((_, __, id) => `ref-${id}`);

      const result = await companyRepository.bulkDeleteCompanies(companyIds);

      expect(writeBatch).toHaveBeenCalledWith(mockDb);
      expect(doc).toHaveBeenCalledWith(mockDb, "companies", "id1");
      expect(doc).toHaveBeenCalledWith(mockDb, "companies", "id2");

      expect(mockBatch.update).toHaveBeenCalledTimes(2);
      expect(mockBatch.update).toHaveBeenCalledWith(
        "ref-id1",
        expect.objectContaining({ deletedAt: expect.any(Date) })
      );
      expect(mockBatch.update).toHaveBeenCalledWith(
        "ref-id2",
        expect.objectContaining({ deletedAt: expect.any(Date) })
      );

      expect(mockBatch.commit).toHaveBeenCalled();
      expect(result.success).toBe(true);
      expect(result.deletedCount).toBe(2);
    });
  });

  describe("getCompanyById", () => {
    it("should return undefined if company is soft deleted", async () => {
      const companyId = "deleted-company";
      const mockSnap = {
        exists: () => true,
        id: companyId,
        data: () => ({
          name: "Deleted Company",
          deletedAt: Timestamp.now(), // Simulating Firestore Timestamp
        }),
      };

      (doc as jest.Mock).mockReturnValue("mock-doc-ref");
      (getDoc as jest.Mock).mockResolvedValue(mockSnap);

      const result = await companyRepository.getCompanyById(companyId);

      expect(result).toBeUndefined();
    });

    it("should return company if not deleted", async () => {
      const companyId = "active-company";
      const mockSnap = {
        exists: () => true,
        id: companyId,
        data: () => ({
          name: "Active Company",
          // deletedAt is undefined
        }),
      };

      (doc as jest.Mock).mockReturnValue("mock-doc-ref");
      (getDoc as jest.Mock).mockResolvedValue(mockSnap);

      const result = await companyRepository.getCompanyById(companyId);

      expect(result).toBeDefined();
      expect(result?.id).toBe(companyId);
    });
  });

  describe("getCompanies", () => {
    it("should NOT include deletedAt == null filter (in-memory filtering)", async () => {
      (collection as jest.Mock).mockReturnValue("companies-col");
      (getDocs as jest.Mock).mockResolvedValue({ docs: [] });

      await companyRepository.getCompanies({});

      expect(where).not.toHaveBeenCalledWith("deletedAt", "==", null);
    });

    it("should filter out deleted companies in memory", async () => {
      const activeCompanySnap = {
        exists: () => true,
        id: "active",
        data: () => ({ name: "Active", normalizedName: "active" }),
      };
      const deletedCompanySnap = {
        exists: () => true,
        id: "deleted",
        data: () => ({ name: "Deleted", normalizedName: "deleted", deletedAt: Timestamp.now() }),
      };

      (collection as jest.Mock).mockReturnValue("companies-col");
      (getDocs as jest.Mock).mockResolvedValue({ docs: [activeCompanySnap, deletedCompanySnap] });
      // Ensure we don't slice empty array

      const result = await companyRepository.getCompanies({});

      expect(result.companies).toHaveLength(1);
      expect(result.companies[0].id).toBe("active");
    });
  });
});
