import {
  collection,
  getDocs,
  getFirestore,
  query,
  where,
} from "firebase/firestore";

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
    getDocs: jest.fn(),
    query: jest.fn(),
    where: jest.fn(),
    documentId: jest.fn(() => "documentIdField"),
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

describe("ProblemRepository Batch Operations", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (getFirestore as jest.Mock).mockReturnValue({});
  });

  describe("getProblemsByIds", () => {
    it("should return empty array if ids list is empty", async () => {
      const result = await problemRepository.getProblemsByIds([]);
      expect(result).toEqual([]);
      expect(getDocs).not.toHaveBeenCalled();
    });

    it("should fetch problems in a single batch if count <= 30", async () => {
      const ids = ["p1", "p2", "p3"];
      (collection as jest.Mock).mockReturnValue("problemsCollection");
      (where as jest.Mock).mockReturnValue("whereClause");
      (query as jest.Mock).mockReturnValue("queryObject");
      
      const mockDocs = ids.map((id) => ({
        id,
        data: () => ({ title: `Title ${id}`, difficulty: "Easy", companyIds: [] }),
      }));
      
      (getDocs as jest.Mock).mockResolvedValue({
        docs: mockDocs,
      });

      const result = await problemRepository.getProblemsByIds(ids);

      expect(where).toHaveBeenCalledWith("documentIdField", "in", ids);
      expect(getDocs).toHaveBeenCalledTimes(1);
      expect(result).toHaveLength(3);
      expect(result[0].id).toBe("p1");
    });

    it("should chunk requests when ids > 30", async () => {
      const ids = Array.from({ length: 35 }, (_, i) => `p${i + 1}`);
      (collection as jest.Mock).mockReturnValue("problemsCollection");
      
      // Mock getDocs to return docs for the current query
      (getDocs as jest.Mock).mockImplementation(() => {
          // In a real mock we would inspect q, but here we just return generic mocks
          // We can assume the implementation calls it correctly and verify arguments
          return { docs: [] };
      });

      await problemRepository.getProblemsByIds(ids);

      // Should be called 2 times (30 + 5)
      expect(getDocs).toHaveBeenCalledTimes(2);
      
      // Check arguments of where calls
      // 1st call: first 30 items
      // 2nd call: last 5 items
      expect(where).toHaveBeenCalledTimes(2);
      
      const firstCallArgs = (where as jest.Mock).mock.calls[0];
      const secondCallArgs = (where as jest.Mock).mock.calls[1];
      
      expect(firstCallArgs[1]).toBe("in");
      expect(firstCallArgs[2]).toHaveLength(30);
      
      expect(secondCallArgs[1]).toBe("in");
      expect(secondCallArgs[2]).toHaveLength(5);
    });

    it("should handle errors gracefully and return empty array", async () => {
      (getDocs as jest.Mock).mockRejectedValue(new Error("Firestore Error"));
      
      const result = await problemRepository.getProblemsByIds(["p1"]);
      
      expect(result).toEqual([]);
    });

    it("should handle mixed results from chunks", async () => {
        // 35 IDs
        const ids = Array.from({ length: 35 }, (_, i) => `p${i + 1}`);
        
        // Mock getDocs to return docs corresponding to the number of items queried?
        // Since we can't easily introspect the query object in the mock without complex logic,
        // we'll just mock the return values sequentially.
        
        const chunk1Docs = ids.slice(0, 30).map(id => ({
            id,
            data: () => ({ title: `Title ${id}`, difficulty: "Easy" })
        }));
        
        const chunk2Docs = ids.slice(30).map(id => ({
            id,
            data: () => ({ title: `Title ${id}`, difficulty: "Easy" })
        }));

        (getDocs as jest.Mock)
            .mockResolvedValueOnce({ docs: chunk1Docs })
            .mockResolvedValueOnce({ docs: chunk2Docs });

        const result = await problemRepository.getProblemsByIds(ids);
        
        expect(result).toHaveLength(35);
        expect(result.map(p => p.id)).toEqual(ids);
    });
  });
});
