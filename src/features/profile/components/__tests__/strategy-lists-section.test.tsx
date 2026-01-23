import React from "react";

import { render, screen } from "@testing-library/react";

import StrategyListsSection from "../strategy-lists-section";

// Mock Lucide icons
jest.mock("lucide-react", () => ({
  Brain: () => <div data-testid="brain-icon" />,
  FolderKanban: () => <div data-testid="folder-kanban-icon" />,
  ListChecks: () => <div data-testid="list-checks-icon" />,
  Loader2: () => <div data-testid="loader2-icon" />,
  Target: () => <div data-testid="target-icon" />,
}));

// Mock Next.js Link
jest.mock("next/link", () => {
  const MockLink = ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  );
  MockLink.displayName = "MockLink";
  return MockLink;
});

describe("StrategyListsSection", () => {
  const defaultProps = {
    strategyTodoLists: [],
    isLoadingStrategyTodoLists: false,
    updatingTodoItemId: null,
    handleToggleTodoItem: jest.fn(),
  };

  it("renders empty state when no lists and not loading", () => {
    render(<StrategyListsSection {...defaultProps} />);

    expect(screen.getByText("No strategies saved")).toBeInTheDocument();
    expect(screen.getByText("You haven't saved any AI-generated company strategies yet.")).toBeInTheDocument();
    
    // Check for the CTA
    const link = screen.getByRole("link", { name: /browse companies/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "/companies");
  });

  it("renders loading skeleton when loading", () => {
    render(<StrategyListsSection {...defaultProps} isLoadingStrategyTodoLists={true} />);
    // Verify the empty state text is NOT present when loading
    expect(screen.queryByText("No strategies saved")).not.toBeInTheDocument();
  });
});
