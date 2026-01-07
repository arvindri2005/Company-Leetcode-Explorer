import { render, screen } from "@testing-library/react";
import ProblemInfoCard from "./problem-info-card";
import { LeetCodeProblem } from "../../types";

// Mock hooks
jest.mock("@/contexts/auth-context", () => ({
  useAuth: () => ({ user: { uid: "test-user" } }),
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

const mockProblem: LeetCodeProblem = {
  id: "3",
  title: "Longest Substring Without Repeating Characters",
  difficulty: "Medium",
  acceptanceRate: 33.8,
  tags: ["Hash Table", "String", "Sliding Window"],
  companyIds: ["amazon", "meta"],
  link: "https://leetcode.com/problems/longest-substring-without-repeating-characters",
  lastAskedPeriod: "last_30_days",
  companyId: "amazon",
  companySlug: "amazon",
  slug: "longest-substring-without-repeating-characters",
  normalizedTitle: "longest substring without repeating characters",
};

describe("ProblemInfoCard", () => {
  it("renders problem details correctly", () => {
    render(<ProblemInfoCard problem={mockProblem} />);
    expect(screen.getByText("Longest Substring Without Repeating Characters")).toBeInTheDocument();
    expect(screen.getByText("Medium")).toBeInTheDocument();
    // Check for some tags
    expect(screen.getByText("Hash Table")).toBeInTheDocument();
    expect(screen.getByText("String")).toBeInTheDocument();
    // Check for comapnies
    expect(screen.getByText("amazon")).toBeInTheDocument();
    expect(screen.getByText("meta")).toBeInTheDocument();
  });

  it("renders last asked period", () => {
    render(<ProblemInfoCard problem={mockProblem} />);
    expect(screen.getByText("last 30 days")).toBeInTheDocument();
  });
});
