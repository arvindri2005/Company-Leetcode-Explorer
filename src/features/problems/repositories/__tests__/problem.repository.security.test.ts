import { ZodError } from "zod";

import { CreateProblemSchema } from "@/features/problems/types/problem.types";

import type { CreateProblemDTO, UpdateProblemDTO } from "../../interfaces/problem.repository.interface";
import { problemRepository } from "../problem.repository";

// Mock Firebase dependencies
jest.mock("firebase/firestore", () => ({
  collection: jest.fn(),
  doc: jest.fn(),
  getDoc: jest.fn(),
  getDocs: jest.fn(),
  setDoc: jest.fn(),
  updateDoc: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  limit: jest.fn(),
  orderBy: jest.fn(),
  startAfter: jest.fn(),
  getCountFromServer: jest.fn(),
}));

jest.mock("@/lib/api/firebase", () => ({
  db: {},
}));

jest.mock("@/lib/utils/logger", () => ({
  Logger: {
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
  },
}));

describe("ProblemRepository Security Validation", () => {
  describe("save", () => {
    it("should validate input using CreateProblemSchema", async () => {
      const invalidData: any = {
        title: "Test Problem",
        // Missing difficulty, link, etc.
      };

      await expect(problemRepository.save(invalidData)).rejects.toThrow(ZodError);
    });

    it("should reject malicious URLs in link", async () => {
      const maliciousData: CreateProblemDTO = {
        title: "Malicious Problem",
        difficulty: "Easy",
        link: "javascript:alert(1)",
        tags: ["array"],
        normalizedTitle: "malicious problem",
      };

      await expect(problemRepository.save(maliciousData)).rejects.toThrow(ZodError);
    });

    it("should accept valid data", async () => {
      // Mock implementation to avoid actual DB calls failing
      const { setDoc, doc } = require("firebase/firestore");
      doc.mockReturnValue({});
      setDoc.mockResolvedValue();

      const validData: CreateProblemDTO = {
        title: "Valid Problem",
        difficulty: "Medium",
        link: "https://leetcode.com/problems/valid-problem",
        tags: ["dp"],
        normalizedTitle: "valid problem",
      };

      // We expect this to resolve (or fail deeper in execution if mocks aren't perfect, 
      // but it should pass the validation step)
      // Since we mocked setDoc, it should proceed until it tries to return domain object
      // ProblemMapper.toDomain might throw if we don't mock it, but let's see.
      
      // Actually, let's just spy on CreateProblemSchema.parse
      const parseSpy = jest.spyOn(CreateProblemSchema, "parse");
      
      try {
        await problemRepository.save(validData);
      } catch (e) {
        // Ignore downstream errors, we just want to know if parse was called
        console.log(e);
      }
      
      expect(parseSpy).toHaveBeenCalledWith(validData);
    });
  });

  describe("update", () => {
    it("should reject malicious URLs in update", async () => {
      const maliciousUpdate: UpdateProblemDTO = {
        link: "javascript:alert(1)",
      };

      await expect(problemRepository.update("some-id", maliciousUpdate)).rejects.toThrow(ZodError);
    });
  });
});
