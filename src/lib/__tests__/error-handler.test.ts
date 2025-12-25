import { handleServerActionError } from "../error-handler";
import { Logger } from "@/lib/logger";

// Mock the Logger
jest.mock("@/lib/logger", () => ({
  Logger: {
    error: jest.fn(),
  },
}));

describe("handleServerActionError", () => {
  const mockActionName = "testAction";
  const mockContext = { userId: "123" };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should log the error with context and return the error message for Error objects", () => {
    const mockError = new Error("Something went wrong");
    
    const result = handleServerActionError(mockError, mockActionName, mockContext);

    expect(Logger.error).toHaveBeenCalledWith(
      `Action failed: ${mockActionName}`,
      mockError,
      {
        ...mockContext,
        originalError: "Something went wrong",
      }
    );
    expect(result).toBe("Something went wrong");
  });

  it("should handle non-Error objects gracefully", () => {
    const mockError = "String error";
    
    const result = handleServerActionError(mockError, mockActionName, mockContext);

    expect(Logger.error).toHaveBeenCalledWith(
      `Action failed: ${mockActionName}`,
      mockError,
      {
        ...mockContext,
        originalError: "String error",
      }
    );
    expect(result).toBe("String error");
  });

  it("should work without context", () => {
    const mockError = new Error("Simple error");
    
    handleServerActionError(mockError, mockActionName);

    expect(Logger.error).toHaveBeenCalledWith(
      `Action failed: ${mockActionName}`,
      mockError,
      {
        originalError: "Simple error",
      }
    );
  });
});
