import { limit } from "firebase/firestore";

import { problemRepository } from "../problem.repository";

// Mock Firebase dependencies
jest.mock("firebase/firestore", () => ({
  collection: jest.fn(),
  doc: jest.fn(),
  getDoc: jest.fn(),
  getDocs: jest.fn(() => Promise.resolve({ docs: [] })),
  setDoc: jest.fn(),
  updateDoc: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  limit: jest.fn(),
  orderBy: jest.fn(),
  startAfter: jest.fn(),
  getCountFromServer: jest.fn(() => Promise.resolve({ data: () => ({ count: 100 }) })),
}));

jest.mock("@/shared/lib/api/firebase", () => ({
  db: {},
}));

jest.mock("@/shared/lib/utils/logger", () => ({
  Logger: {
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
  },
}));

jest.mock("@/features/companies/repositories/company.repository", () => ({
    companyRepository: {
        getCompanyById: jest.fn().mockResolvedValue({ id: "test", slug: "test" }),
    }
}));

describe("ProblemRepository DoS Prevention", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("should reject large pageSize in getProblemsByCompany", async () => {
        const largePageSize = 10000;
        await expect(problemRepository.getProblemsByCompany("company-123", {
            pageSize: largePageSize
        })).rejects.toThrow("Page size exceeds limit");
        
        expect(limit).not.toHaveBeenCalled();
    });

    it("should reject large offset in getAllProblemsPaginated", async () => {
        // use safe pageSize but large page
        const pageSize = 20;
        const page = 1000;
        // Total offset = 20,000 > 2,000 limit
        
        await expect(problemRepository.getAllProblemsPaginated({
            page,
            pageSize
        })).rejects.toThrow("Deep pagination limit exceeded");

        expect(limit).not.toHaveBeenCalled();
    });

    it("should allow safe pagination parameters", async () => {
        const page = 1;
        const pageSize = 50;
        
        await problemRepository.getAllProblemsPaginated({
            page,
            pageSize
        });

        // Safe calls should proceed to Firestore
        expect(limit).toHaveBeenCalled();
    });
});
