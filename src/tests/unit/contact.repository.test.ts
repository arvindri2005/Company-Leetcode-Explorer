import { contactMessageSchema,ContactRepository } from "@/features/contact/repositories/contact.repository";

// Mock Firebase
jest.mock("@/shared/lib/api/firebase", () => ({
  db: {},
}));

jest.mock("firebase/firestore", () => ({
  collection: jest.fn(),
  addDoc: jest.fn(),
  serverTimestamp: jest.fn(() => "mock-timestamp"),
}));

describe("ContactRepository", () => {
  let repository: ContactRepository;

  beforeEach(() => {
    repository = new ContactRepository();
    jest.clearAllMocks();
  });

  it("should validate valid contact data", async () => {
    const validData = {
      name: "John Doe",
      email: "john@example.com",
      message: "Hello, this is a valid message.",
    };

    const result = contactMessageSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it("should reject invalid email", async () => {
    const invalidData = {
      name: "John Doe",
      email: "not-an-email",
      message: "Hello",
    };

    const result = contactMessageSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });

  it("should reject empty name", async () => {
    const invalidData = {
      name: "",
      email: "john@example.com",
      message: "Hello",
    };

    const result = contactMessageSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });

  it("should reject overly long message", async () => {
    const invalidData = {
      name: "John Doe",
      email: "john@example.com",
      message: "a".repeat(2001),
    };

    const result = contactMessageSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });

  it("should throw error when creating message with invalid data", async () => {
    const invalidData = {
      name: "",
      email: "john@example.com",
      message: "Hello",
    };

    await expect(repository.createContactMessage(invalidData)).rejects.toThrow("Invalid contact message data");
  });
});






