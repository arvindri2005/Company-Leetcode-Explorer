import { render } from "@testing-library/react";
import { ProblemInsightsSkeleton, SimilarProblemsSkeleton } from "./ai-skeletons";

describe("AI Skeletons", () => {
  it("renders ProblemInsightsSkeleton", () => {
    const { container } = render(<ProblemInsightsSkeleton />);
    expect(container.firstChild).toHaveAttribute("aria-busy", "true");
    expect(container.querySelectorAll(".animate-pulse")).toBeTruthy();
  });

  it("renders SimilarProblemsSkeleton", () => {
    const { container } = render(<SimilarProblemsSkeleton />);
    expect(container.firstChild).toHaveAttribute("aria-busy", "true");
    expect(container.querySelectorAll(".animate-pulse")).toBeTruthy();
  });
});
