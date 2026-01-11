import { userService } from "@/features/profile/services/user.service";
import { appEvents } from "@/services/event-bus";
import { userRepository } from "@/features/profile/repositories/user.repository";

// Mock dependencies
jest.mock("@/features/profile/repositories/user.repository");
jest.mock("@/lib/utils/logger");

describe("UserService Event System", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    appEvents.clear();
  });

  it("should emit user:problem_status_changed when setProblemStatus succeeds", async () => {
    // Arrange
    const userId = "user123";
    const problemId = "prob123";
    const status = "solved";
    const companySlug = "google";
    const problemSlug = "two-sum";

    (userRepository.setProblemStatus as jest.Mock).mockResolvedValue({
      success: true,
    });

    const listener = jest.fn();
    userService.subscribe("user:problem_status_changed", listener);

    // Act
    await userService.setProblemStatus(
      userId,
      problemId,
      status,
      companySlug,
      problemSlug,
    );

    // Assert
    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledWith(
      expect.objectContaining({
        userId,
        problemId,
        status,
        companySlug,
        problemSlug,
        timestamp: expect.any(Date),
      }),
    );
  });

  it("should emit user:bookmark_toggled when toggleBookmarkProblem succeeds", async () => {
    // Arrange
    const userId = "user123";
    const problemId = "prob123";
    const companySlug = "google";
    const problemSlug = "two-sum";

    (userRepository.toggleBookmarkProblem as jest.Mock).mockResolvedValue({
      isBookmarked: true,
    });

    const listener = jest.fn();
    userService.subscribe("user:bookmark_toggled", listener);

    // Act
    await userService.toggleBookmarkProblem(
      userId,
      problemId,
      companySlug,
      problemSlug,
    );

    // Assert
    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledWith(
      expect.objectContaining({
        userId,
        problemId,
        isBookmarked: true,
        companySlug,
        problemSlug,
        timestamp: expect.any(Date),
      }),
    );
  });

  it("should NOT emit events if repository call fails", async () => {
    // Arrange
    (userRepository.setProblemStatus as jest.Mock).mockResolvedValue({
      success: false,
      error: "DB Error",
    });

    const listener = jest.fn();
    userService.subscribe("user:problem_status_changed", listener);

    // Act
    await userService.setProblemStatus(
      "u",
      "p",
      "solved",
      "c",
      "s",
    );

    // Assert
    expect(listener).not.toHaveBeenCalled();
  });

  it("should not crash if a listener throws an error", async () => {
    // Arrange
    (userRepository.setProblemStatus as jest.Mock).mockResolvedValue({
      success: true,
    });

    const errorListener = jest.fn().mockRejectedValue(new Error("Listener failed"));
    const successListener = jest.fn();

    userService.subscribe("user:problem_status_changed", errorListener);
    userService.subscribe("user:problem_status_changed", successListener);

    // Act
    const result = await userService.setProblemStatus("u", "p", "solved", "c", "s");
    
    // Assert - Result type now returns isSuccess/isFailure
    expect(result.isSuccess).toBe(true);
    expect(errorListener).toHaveBeenCalled();
    expect(successListener).toHaveBeenCalled();
  });
});






