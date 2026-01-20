import React from "react";

import { render, screen } from "@testing-library/react";

import { type ProblemStatus } from "@/types";

import ProfileProblemList from "../profile-problem-list";

// Mock ProblemCard since it's an external dependency and we just want to verify list rendering
jest.mock("@/features/problems", () => ({
  ProblemCard: ({ problem }: { problem: any }) => (
    <div data-testid="problem-card">{problem.title}</div>
  ),
}));

// Mock skeletons
jest.mock("@/components/skeletons/problem-skeletons", () => ({
  ProblemCardSkeleton: () => <div data-testid="problem-skeleton" />,
}));

describe("ProfileProblemList", () => {
  const mockProblems = [
    {
      id: "1",
      title: "Two Sum",
      titleSlug: "two-sum",
      difficulty: "Easy",
      companySlug: "google",
      currentStatus: "solved" as ProblemStatus,
      isBookmarked: true,
      tags: [],
    },
    {
      id: "2",
      title: "Add Two Numbers",
      titleSlug: "add-two-numbers",
      difficulty: "Medium",
      companySlug: "facebook",
      currentStatus: "attempted" as ProblemStatus,
      isBookmarked: false,
      tags: [],
    },
  ];

  it("renders loading skeletons when isLoading is true", () => {
    render(
      <ProfileProblemList
        title="Test List"
        problems={[]}
        isLoading={true}
        listType="bookmarks"
      />,
    );

    const skeletons = screen.getAllByTestId("problem-skeleton");
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it("renders empty state when problems list is empty", () => {
    render(
      <ProfileProblemList
        title="Test List"
        problems={[]}
        isLoading={false}
        listType="bookmarks"
      />,
    );

    expect(screen.getByText("No problems found")).toBeInTheDocument();
    
    const browseLink = screen.getByRole("link", { name: /browse problems/i });
    expect(browseLink).toBeInTheDocument();
    expect(browseLink).toHaveAttribute("href", "/problems");
  });

  it("renders list of problems", () => {
    render(
      <ProfileProblemList
        title="Test List"
        problems={mockProblems}
        isLoading={false}
        listType="bookmarks"
      />,
    );

    const cards = screen.getAllByTestId("problem-card");
    expect(cards).toHaveLength(2);
    expect(screen.getByText("Two Sum")).toBeInTheDocument();
    expect(screen.getByText("Add Two Numbers")).toBeInTheDocument();
  });

  it("renders custom empty state message and description", () => {
    const customMessage = "Custom Message";
    const customDescription = "Custom Description";

    render(
      <ProfileProblemList
        title="Test List"
        problems={[]}
        isLoading={false}
        listType="bookmarks"
        emptyStateMessage={customMessage}
        emptyStateDescription={customDescription}
      />,
    );

    expect(screen.getByText(customMessage)).toBeInTheDocument();
    expect(screen.getByText(customDescription)).toBeInTheDocument();
  });
});
