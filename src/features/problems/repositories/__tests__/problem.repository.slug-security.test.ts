import { slugify } from "@/shared/lib/utils";

import { type CreateProblemDTO } from "../../interfaces/problem.repository.interface";
import { problemRepository } from "../problem.repository";

// Mock Firebase dependencies
jest.mock("firebase/firestore", () => {
  const original = jest.requireActual("firebase/firestore");
  return {
    ...original,
    getFirestore: jest.fn(),
    collection: jest.fn(),
    doc: jest.fn((firestore: any, collectionPath: string, documentPath?: string) => {
        if (documentPath === "") {
            throw new Error("Invalid document reference. Document references must have an even number of segments, but problems has 1.");
        }
        return { id: documentPath || "auto-id", path: `${collectionPath}/${documentPath}` };
    }),
    getDoc: jest.fn(),
    setDoc: jest.fn(),
    updateDoc: jest.fn(),
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

describe("ProblemRepository Slug Security", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should fail gracefully when title results in an empty slug", async () => {
    const invalidTitleData: CreateProblemDTO = {
      title: "!!! ???", // Slugifies to empty string
      difficulty: "Easy",
      link: "https://leetcode.com/problems/test",
      tags: ["array"],
      // Use a valid normalizedTitle to bypass the initial Zod check, 
      // so we hit the slug generation logic we want to test.
      normalizedTitle: "valid-normalized-title",
    };

    // Verify slugify behavior first
    expect(slugify(invalidTitleData.title)).toBe("");

    // We expect this to fail, but currently it might throw a raw Firestore error
    // We want it to be handled more gracefully, e.g., validation error
    await expect(problemRepository.save(invalidTitleData)).rejects.toThrow("Title results in an empty slug");
  });

  it("should fail gracefully in addProblem when title results in an empty slug", async () => {
      const invalidTitleData = {
        title: "...", // Slugifies to empty string
        difficulty: "Easy" as const,
        link: "https://leetcode.com/problems/test",
        tags: ["array"],
        normalizedTitle: "...",
        lastAskedPeriod: "last_30_days" as const
      };

      const result = await problemRepository.addProblem("company-1", invalidTitleData);
      
      // Currently, it catches unknown errors and returns { error: message }
      // We want to ensure it catches it and returns a meaningful error,
      // OR validates it before calling Firestore.
      
      // If it catches the Firestore error "Invalid document reference", it will return that message.
      // But we prefer a validation error.
      
      expect(result.updated).toBe(false);
      expect(result.error).toBe("Title results in an empty slug. Please include alphanumeric characters.");
  });
});
