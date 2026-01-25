import { doc, runTransaction } from "firebase/firestore";

import { CompanyRepository } from "../company.repository";

// Mock Firebase dependencies
jest.mock("@/lib/api/firebase", () => ({
  db: {}, // Mock db object
}));

jest.mock("@/lib/utils", () => ({
  slugify: (str: string) =>
    str
      .toLowerCase()
      .trim()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, ""),
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
    collection: jest.fn(() => ({})),
    doc: jest.fn(),
    updateDoc: jest.fn(),
    setDoc: jest.fn(),
    getDoc: jest.fn(() => ({ exists: () => false })), // Default: doesn't exist
    limit: jest.fn((n) => ({ type: "limit", value: n })),
    query: jest.fn(),
    where: jest.fn((field, op, val) => ({ type: "where", field, op, val })),
    orderBy: jest.fn(),
    getDocs: jest.fn(() => ({ docs: [] })),
    runTransaction: jest.fn(async (db, callback) => {
        // Create a mock transaction object that will be passed to the callback
        const transactionMock = {
            get: jest.fn(),
            set: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
        };
        return callback(transactionMock);
    }),
  };
});

describe("CompanyRepository Race Condition Protection", () => {
  let repository: CompanyRepository;
  const mockRunTransaction = runTransaction as jest.Mock;
  const mockDoc = doc as jest.Mock;

  beforeEach(() => {
    repository = new CompanyRepository();
    jest.clearAllMocks();
  });

  it("should use runTransaction to prevent race conditions during company creation", async () => {
    // Setup
    const newCompanyData = {
      name: "New Company",
      description: "Description",
    };
    
    mockDoc.mockReturnValue("mock-doc-ref");

    // Act
    await repository.addCompany(newCompanyData as any);

    // Assert
    expect(mockRunTransaction).toHaveBeenCalled();
    
    // Check that we are using the transaction's get/set instead of global ones
    // We can do this by inspecting the callback passed to runTransaction
    const transactionCallback = mockRunTransaction.mock.calls[0][1];
    
    // Create a spy transaction object to verify interactions inside the callback
    const transactionSpy = {
        get: jest.fn().mockResolvedValue({ exists: () => false }), // Simulate company not existing
        set: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
    };

    // Execute the callback with our spy
    await transactionCallback(transactionSpy);

    // Verify transaction.get was called (existence check)
    expect(transactionSpy.get).toHaveBeenCalledWith("mock-doc-ref");

    // Verify transaction.set was called (creation)
    expect(transactionSpy.set).toHaveBeenCalled();
  });
});
