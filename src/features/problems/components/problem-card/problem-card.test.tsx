import { fireEvent,render, screen } from "@testing-library/react";

import { type LeetCodeProblem } from "../../types";

import ProblemCard from "./problem-card";

// Mock hooks
jest.mock("@/providers", () => ({
  useAuth: () => ({ user: { uid: "test-user" } }),
}));

jest.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: jest.fn() }),
}));

jest.mock("@/features/problems/hooks/use-problem-interactions", () => ({
  useProblemInteractions: () => ({
    isBookmarked: false,
    isTogglingBookmark: false,
    handleToggleBookmark: jest.fn(),
    currentStatus: "none",
    handleStatusUpdate: jest.fn(),
    promptLogin: jest.fn(),
  }),
}));

jest.mock("@/features/ai/hooks/use-ai-features", () => ({
  useAIFeatures: () => ({
    isLoadingSimilar: false,
    similarProblems: [],
    isSimilarDialogSharedOpen: false,
    setIsSimilarDialogSharedOpen: jest.fn(),
    handleFindSimilar: jest.fn(),
    isLoadingInsights: false,
    problemInsights: [],
    isInsightsDialogOpen: false,
    setIsInsightsDialogOpen: jest.fn(),
    handleGenerateInsights: jest.fn(),
  }),
}));

// Mock Lucide icons to avoid rendering issues in tests if any (usually fine, but safe)
// Mocking dynamic imports
jest.mock("@/features/ai/components/similar-problems-dialog", () => ({
  default: () => <div data-testid="similar-problems-dialog">Similar Dialog</div>,
}));
jest.mock("@/features/ai/components/problem-insights-dialog", () => ({
  default: () => <div data-testid="problem-insights-dialog">Insights Dialog</div>,
}));


const mockProblem: LeetCodeProblem = {
  id: "1",
  title: "Two Sum",
  difficulty: "Easy",
  acceptanceRate: 49.2,
  tags: ["Array", "Hash Table"],
  companyIds: ["google"],
  link: "https://leetcode.com/problems/two-sum",
  companySlug: "google",
  companyId: "1",
  slug: "two-sum",
  normalizedTitle: "two sum",
};

describe("ProblemCard", () => {
  it("renders problem title and difficulty", () => {
    render(<ProblemCard problem={mockProblem} companySlug="google" />);
    expect(screen.getByText("Two Sum")).toBeInTheDocument();
    expect(screen.getByText("Easy")).toBeInTheDocument();
  });

  it("renders tags when expanded", () => {
    render(<ProblemCard problem={mockProblem} companySlug="google" />);
    // Initial state not expaned, but let's check if we can toggle
    // The component structure puts click handler on the container or chevron
    // Assuming the chevron button is accessible, let's try finding the collapse trigger
    // Actually the click handler is on the main div and chevron button
    fireEvent.click(screen.getByText("Two Sum"));
    
    expect(screen.getByText("Array")).toBeInTheDocument();
    expect(screen.getByText("Hash Table")).toBeInTheDocument();
  });

  it("renders company tags if showCompanies is true", () => {
    render(<ProblemCard problem={mockProblem} companySlug="google" showCompanies={true} />);
    expect(screen.getByText("google")).toBeInTheDocument();
  });

  it("has accessible label for Write Code button", () => {
    render(<ProblemCard problem={mockProblem} companySlug="google" />);
    // Expand the card first to see the button
    fireEvent.click(screen.getByText("Two Sum"));
    const linkButton = screen.getByRole("link", { name: /Solve on LeetCode/i });
    expect(linkButton).toBeInTheDocument();
    expect(linkButton).toHaveAttribute("href", mockProblem.link);
  });
});






