
import { problemService } from "@/services/problem.service";
import { problemRepository } from "@/repositories/problem.repository";
import { Logger } from "@/lib/logger";

// Mock dependencies
jest.mock("@/repositories/problem.repository");
jest.mock("@/lib/logger");
jest.mock("next/cache", () => ({
  unstable_cache: (fn: Function) => fn, // Execute immediately
}));

describe("ProblemService Observability", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should log Cache MISS and duration when fetching public problems", async () => {
    // Arrange
    const mockProblems = { problems: [], totalProblems: 0 };
    (problemRepository.getProblemsByCompany as jest.Mock).mockResolvedValue(mockProblems);

    // Act
    await problemService.getPublicProblems("company-123");

    // Assert
    // 1. Verify "Cache MISS" log
    expect(Logger.info).toHaveBeenCalledWith(
      expect.stringContaining("[Cache MISS] Fetching public problems"),
      expect.objectContaining({ companyId: "company-123" })
    );

    // 2. Verify Repository Call
    expect(problemRepository.getProblemsByCompany).toHaveBeenCalled();

    // 3. Verify "Cache REFRESH" log with duration
    expect(Logger.info).toHaveBeenCalledWith(
      expect.stringContaining("[Cache REFRESH] Fetched public problems"),
      expect.objectContaining({
        companyId: "company-123",
        durationMs: expect.any(Number),
      })
    );
  });

  it("should log Cache FAIL when fetching public problems fails", async () => {
    // Arrange
    const error = new Error("Firestore Failed");
    (problemRepository.getProblemsByCompany as jest.Mock).mockRejectedValue(error);

    // Act & Assert
    await expect(problemService.getPublicProblems("company-123")).rejects.toThrow("Firestore Failed");

    // Verify "Cache FAIL" log
    expect(Logger.error).toHaveBeenCalledWith(
      expect.stringContaining("[Cache FAIL] Failed to fetch public problems"),
      error,
      expect.objectContaining({ companyId: "company-123" })
    );
  });

  it("should log Cache MISS and duration when fetching problem details", async () => {
    // Arrange
    const mockProblem = { title: "Test Problem" };
    (problemRepository.getProblemDetails as jest.Mock).mockResolvedValue(mockProblem);

    // Act
    await problemService.getProblemDetails("company-123", "problem-slug");

    // Assert
    expect(Logger.info).toHaveBeenCalledWith(
      expect.stringContaining("[Cache MISS] Fetching problem details"),
      expect.objectContaining({ companyId: "company-123", problemId: "problem-slug" })
    );

    expect(Logger.info).toHaveBeenCalledWith(
        expect.stringContaining("[Cache REFRESH] Fetched problem details"),
        expect.objectContaining({
            companyId: "company-123",
            found: true,
            durationMs: expect.any(Number)
        })
    );
  });
});
