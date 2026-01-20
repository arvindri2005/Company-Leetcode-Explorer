import { fireEvent,render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";

import { type LeetCodeProblem } from "../../types";

import ProblemCard from "./problem-card";

// Mock hooks
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
  usePathname: () => "/problems",
}));

jest.mock("@/providers", () => ({
  useAuth: () => ({ user: { uid: "test-user" } }),
}));

jest.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: jest.fn() }),
}));

const mockHandleStatusUpdate = jest.fn();

jest.mock("@/features/problems/hooks/use-problem-interactions", () => ({
  useProblemInteractions: () => ({
    isBookmarked: false,
    isTogglingBookmark: false,
    handleToggleBookmark: jest.fn(),
    currentStatus: "none",
    isUpdatingStatus: false,
    handleStatusUpdate: mockHandleStatusUpdate,
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
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders problem title and difficulty", () => {
    render(<ProblemCard problem={mockProblem} companySlug="google" />);
    expect(screen.getByText("Two Sum")).toBeInTheDocument();
    expect(screen.getByText("Easy")).toBeInTheDocument();
  });

  it("renders tags when expanded", async () => {
    render(<ProblemCard problem={mockProblem} companySlug="google" />);
    // Initial state not expaned, but let's check if we can toggle
    // The component structure puts click handler on the container or chevron
    // Assuming the chevron button is accessible, let's try finding the collapse trigger
    // Actually the click handler is on the main div and chevron button
    fireEvent.click(screen.getByLabelText("Expand details"));
    
    expect(await screen.findByText("Array")).toBeInTheDocument();
    expect(screen.getByText("Hash Table")).toBeInTheDocument();
  });

  it("renders company tags if showCompanies is true", () => {
    render(<ProblemCard problem={mockProblem} companySlug="google" showCompanies={true} />);
    expect(screen.getByText("google")).toBeInTheDocument();
  });

  it("has accessible label for Write Code button", async () => {
    render(<ProblemCard problem={mockProblem} companySlug="google" />);
    // Expand the card first to see the button
    fireEvent.click(screen.getByLabelText("Expand details"));
    const linkButton = await screen.findByRole("link", { name: /Solve on LeetCode/i });
    expect(linkButton).toBeInTheDocument();
    expect(linkButton).toHaveAttribute("href", mockProblem.link);
  });

  it("renders status dropdown with checkbox items", async () => {
    const user = userEvent.setup();
    render(<ProblemCard problem={mockProblem} companySlug="google" />);

    // Find the status trigger button. It has an aria-label with the current status.
    // Default status in mock is "none".
    const statusButton = screen.getByRole("button", { name: /Change status. Current status: none/i });
    
    // Open dropdown
    await user.click(statusButton);

    // Check for checkbox items
    // Using getAllByRole("menuitemcheckbox") if they are checkboxes
    // DropdownMenuCheckboxItem usually has role="menuitemcheckbox"
    const checkboxItems = screen.getAllByRole("menuitemcheckbox");
    expect(checkboxItems).toHaveLength(3); // Solved, Attempted, To Do

    // Verify labels
    expect(screen.getByText("Solved")).toBeInTheDocument();
    expect(screen.getByText("Attempted")).toBeInTheDocument();
    expect(screen.getByText("To Do")).toBeInTheDocument();

    // Verify checked state
    // "none" is checked (wait, "none" maps to "To Do"? No, "To Do" is "todo" status probably? Or maybe "none" is unselected?)
    // In ProblemCard:
    // <DropdownMenuCheckboxItem checked={currentStatus === "solved"} ... > Solved
    // <DropdownMenuCheckboxItem checked={currentStatus === "attempted"} ... > Attempted
    // <DropdownMenuCheckboxItem checked={currentStatus === "none"} ... > To Do
    
    // Since mock returns "none", the "To Do" item should be checked.
    const todoItem = screen.getByRole("menuitemcheckbox", { name: /To Do/i });
    expect(todoItem).toBeChecked();
    
    const solvedItem = screen.getByRole("menuitemcheckbox", { name: /Solved/i });
    expect(solvedItem).not.toBeChecked();

    // Click Solved
    await user.click(solvedItem);
    expect(mockHandleStatusUpdate).toHaveBeenCalledWith("solved");
  });
});
