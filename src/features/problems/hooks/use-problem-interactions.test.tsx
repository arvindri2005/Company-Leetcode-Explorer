import { act, renderHook } from "@testing-library/react";

import { userService } from "@/features/profile/services/user.service";
import { type LeetCodeProblem } from "@/shared/types";

import { useProblemInteractions } from "./use-problem-interactions";

// Mock dependencies
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
  usePathname: () => "/problems",
}));

jest.mock("@/shared/hooks/use-toast", () => ({
  useToast: () => ({ toast: jest.fn() }),
}));

jest.mock("@/features/profile/services/user.service", () => ({
  userService: {
    toggleBookmarkProblem: jest.fn(),
    setProblemStatus: jest.fn(),
  },
}));

const mockProblem: LeetCodeProblem = {
  id: "1",
  title: "Two Sum",
  difficulty: "Easy",
  acceptanceRate: 49.2,
  tags: ["Array"],
  companyIds: [],
  link: "link",
  companySlug: "company",
  slug: "two-sum",
  normalizedTitle: "two sum",
  companyId: "company-id-1",
};

describe("useProblemInteractions", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should handle optimistic bookmark toggling correctly", async () => {
    // Setup mock success
    (userService.toggleBookmarkProblem as jest.Mock).mockResolvedValue({
      isSuccess: true,
      value: { isBookmarked: true },
    });

    const onBookmarkChanged = jest.fn();

    const { result, rerender } = renderHook(
      (props) =>
        useProblemInteractions(
          mockProblem,
          "company",
          props.initialIsBookmarked,
          "none",
          "user-1",
          onBookmarkChanged
        ),
      {
        initialProps: { initialIsBookmarked: false },
      }
    );

    // Initial state
    expect(result.current.isBookmarked).toBe(false);

    // Toggle
    await act(async () => {
      // We don't await the result inside act usually if we want to check intermediate state,
      // but here the toggle is async.
      // However, optimistic update should happen *synchronously* before the await.
      // To test optimistic state, we need to split the promise resolution?
      // Since handleToggleBookmark is async, checking state strictly "during" execution is hard.
      // But typically React batched updates mean we see the optimistic state immediately after the call returns a promise.
      
      const promise = result.current.handleToggleBookmark();
      // Check optimistic state immediately? 
      // Need to verify if re-render happened.
      // renderHook does not expose intermediate renders easily without custom wrapper.
      // But we can check result.current if it updated.
      
      return promise;
    });

    // After resolution (but before prop update)
    // The optimistic state should persist because props haven't updated yet.
    // wait, if promise resolved, we are in "success" state.
    // Logic: "Keep optimistic status until prop updates"
    expect(result.current.isBookmarked).toBe(true);
    expect(onBookmarkChanged).toHaveBeenCalledWith("1", true);

    // Now simulate Parent prop update
    rerender({ initialIsBookmarked: true });

    // Should still be true, and optimistic state should be cleared (internal implementation detail)
    expect(result.current.isBookmarked).toBe(true);
  });

  it("should revert optimistic bookmark on failure", async () => {
    // Setup mock failure
    (userService.toggleBookmarkProblem as jest.Mock).mockResolvedValue({
      isSuccess: false,
      error: { message: "Failed" },
    });

    const { result } = renderHook(() =>
      useProblemInteractions(
        mockProblem,
        "company",
        false, // initial false
        "none",
        "user-1"
      )
    );

    await act(async () => {
      await result.current.handleToggleBookmark();
    });

    // Should be false (reverted)
    expect(result.current.isBookmarked).toBe(false);
  });

  it("should handle status update with slugs correctly", async () => {
    // Setup mock success
    (userService.setProblemStatus as jest.Mock).mockResolvedValue({
      isSuccess: true,
      value: undefined,
    });

    const onProblemStatusChange = jest.fn();

    const { result } = renderHook(() =>
      useProblemInteractions(
        mockProblem,
        "company-fallback",
        false,
        "none",
        "user-1",
        undefined,
        onProblemStatusChange,
      ),
    );

    // Initial status
    expect(result.current.currentStatus).toBe("none");

    // Update status
    await act(async () => {
      await result.current.handleStatusUpdate("solved");
    });

    // Check status
    expect(result.current.currentStatus).toBe("solved");

    // Check callback arguments: (id, status, companySlug, problemSlug)
    // mockProblem.companySlug is "company"
    // mockProblem.slug is "two-sum"
    expect(onProblemStatusChange).toHaveBeenCalledWith(
      "1",
      "solved",
      "company",
      "two-sum",
    );
  });
});
