import React from "react";
import { render } from "@testing-library/react";
import {
  ProblemCardSkeleton,
  ProblemListControlsSkeleton,
  ProblemsPageSkeleton,
} from "./problem-skeletons";

describe("Problem Skeletons", () => {
  it("renders ProblemCardSkeleton", () => {
    const { container } = render(<ProblemCardSkeleton />);
    const skeletons = container.querySelectorAll(".animate-pulse");
    // Should have multiple skeleton parts (avatar, title, badge, etc.)
    expect(skeletons.length).toBeGreaterThan(5);
  });

  it("renders ProblemListControlsSkeleton", () => {
    const { container } = render(<ProblemListControlsSkeleton />);
    const skeletons = container.querySelectorAll(".animate-pulse");
    // Search bar + 3 filters = 4 major skeleton blocks
    expect(skeletons.length).toBeGreaterThanOrEqual(4);
  });

  it("renders ProblemsPageSkeleton", () => {
    const { container } = render(<ProblemsPageSkeleton />);
    const controls = container.querySelectorAll(".mb-6"); // Controls container
    const cards = container.querySelectorAll(".flex-col.bg-card"); // Card containers (approx)

    expect(controls.length).toBe(1);
    // Should render 10 cards
    expect(cards.length).toBeGreaterThanOrEqual(10);
  });

  it("has accessibility attributes", () => {
    const { container, getByText } = render(<ProblemsPageSkeleton />);
    const root = container.firstChild as HTMLElement;

    expect(root).toHaveAttribute("aria-busy", "true");
    expect(root).toHaveAttribute("role", "status");
    expect(getByText("Loading problems...")).toHaveClass("sr-only");
  });
});
