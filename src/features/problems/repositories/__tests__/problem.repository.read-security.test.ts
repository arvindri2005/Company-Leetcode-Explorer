import {
  doc,
  getDoc,
  getFirestore,
} from "firebase/firestore";

import { companyRepository } from "@/features/companies/repositories/company.repository";

import { problemRepository } from "../problem.repository";

// Mock Firebase dependencies
jest.mock("firebase/firestore", () => {
  const original = jest.requireActual("firebase/firestore");
  return {
    ...original,
    getFirestore: jest.fn(),
    collection: jest.fn(),
    doc: jest.fn(),
    getDoc: jest.fn(),
  };
});

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

// Mock company repository since getProblemDetails uses it
jest.mock("@/features/companies/repositories/company.repository", () => ({
  companyRepository: {
    getCompanyById: jest.fn(),
  },
}));

describe("ProblemRepository Read Security", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (getFirestore as jest.Mock).mockReturnValue({});
  });

  describe("getProblemDetails", () => {
    it("should sanitize malicious links in getProblemDetails", async () => {
      const maliciousLink = "javascript:alert(1)";
      const problemId = "malicious-problem";
      const companyId = "company-1";

      (doc as jest.Mock).mockReturnValue({});
      (getDoc as jest.Mock).mockResolvedValue({
        exists: () => true,
        id: problemId,
        data: () => ({
          title: "Malicious Problem",
          difficulty: "Easy",
          link: maliciousLink,
          tags: ["array"],
          normalizedTitle: "malicious problem",
          companyIds: [companyId],
        }),
      });

      (companyRepository.getCompanyById as jest.Mock).mockResolvedValue({
        id: companyId,
        name: "Test Company",
        slug: "test-company",
      });

      const result = await problemRepository.getProblemDetails(companyId, problemId);

      expect(result).toBeDefined();
      expect(result?.title).toBe("Malicious Problem");
      // New behavior: It returns an empty string (neutralized)
      expect(result?.link).toBe("");
    });
  });
});
