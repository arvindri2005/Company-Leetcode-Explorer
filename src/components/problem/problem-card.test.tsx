import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import ProblemCard from "./problem-card";
import { LeetCodeProblem } from "@/types";

// Mock hooks
jest.mock("@/contexts/auth-context", () => ({
  useAuth: () => ({ user: { uid: "test-user" } }),
}));

jest.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: jest.fn() }),
}));

jest.mock("@/hooks/use-problem-interactions", () => ({
  useProblemInteractions: () => ({
    isBookmarked: false,
    isTogglingBookmark: false,
    handleToggleBookmark: jest.fn(),
    currentStatus: "none",
    handleStatusUpdate: jest.fn(),
    promptLogin: jest.fn(),
  }),
}));

jest.mock("@/hooks/use-ai-features", () => ({
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

// Mock dynamic imports
jest.mock("@/components/ai/similar-problems-dialog", () => ({
  default: () => <div data-testid="similar-problems-dialog">Similar Dialog</div>,
}));
jest.mock("@/components/ai/problem-insights-dialog", () => ({
  default: () => <div data-testid="problem-insights-dialog">Insights Dialog</div>,
}));

// Mock Framer Motion to render children immediately
jest.mock("framer-motion", () => {
  const MockDiv = ({ children, whileHover, whileTap, layout, transition, initial, animate, exit, variants, ...props }: any) => {
    return <div {...props}>{children}</div>;
  };
  return {
    motion: {
      div: MockDiv,
    },
    AnimatePresence: ({ children }: any) => <>{children}</>,
  };
});

const mockProblem: LeetCodeProblem = {
  id: "1",
  title: "Two Sum",
  difficulty: "Easy",
  acceptanceRate: 49.2,
  frequency: 5,
  url: "https://leetcode.com/problems/two-sum",
  tags: ["Array", "Hash Table"],
  companyIds: ["google"],
  link: "https://leetcode.com/problems/two-sum",
  questionId: "1",
  isPaidOnly: false,
  companySlug: "google",
};

describe("ProblemCard", () => {
  it("renders problem title and difficulty", () => {
    render(<ProblemCard problem={mockProblem} companySlug="google" />);
    expect(screen.getByText("Two Sum")).toBeInTheDocument();
    expect(screen.getByText("Easy")).toBeInTheDocument();
  });

  it("renders tags when expanded", async () => {
    render(<ProblemCard problem={mockProblem} companySlug="google" />);
    // Initial state not expaned, but let's check if we can toggle
    // The component structure puts click handler on the container or chevron
    const card = screen.getByText("Two Sum").closest(".group"); // or simply clicking the chevron
    // Assuming the chevron button is accessible, let's try finding the collapse trigger
    // Click the expand button to toggle visibility
    fireEvent.click(screen.getByLabelText("Expand"));

    // Wait for the animation frame or effect to settle
    await waitFor(() => {
      expect(screen.getByText("Array")).toBeInTheDocument();
    });

    expect(screen.getByText("Array")).toBeVisible();
    expect(screen.getByText("Hash Table")).toBeInTheDocument();
  });

  it("renders company tags if showCompanies is true", () => {
    render(<ProblemCard problem={mockProblem} companySlug="google" showCompanies={true} />);
    expect(screen.getByText("google")).toBeInTheDocument();
  });
});
