import { render, screen, waitFor } from "@testing-library/react";
import ProblemList from "./problem-list";
import { LeetCodeProblem } from "@/types";

// Mock Next.js hooks
const mockPush = jest.fn();
// Mock default search params
const mockSearchParams = new URLSearchParams();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
  useSearchParams: () => mockSearchParams,
  usePathname: () => "/company/google",
}));

// Mock server actions
jest.mock("@/app/actions/user.actions", () => ({
  getUserGlobalProblemStatsAction: jest.fn().mockResolvedValue({
      solvedProblemIds: [],
      attemptedProblemIds: [],
      bookmarkedProblemIds: []
  }),
}));

jest.mock("@/app/actions/problem.actions", () => ({
  loadMoreProblemsAction: jest.fn(),
}));

// Mock auth
jest.mock("@/contexts/auth-context", () => ({
  useAuth: () => ({ user: { uid: "test-user" } }),
}));

// Mock toast
jest.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: jest.fn() }),
}));

// Mock IntersectionObserver
global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock ProblemCard
jest.mock("./problem-card", () => ({
  __esModule: true,
  default: ({ problem }: { problem: LeetCodeProblem }) => (
    <div data-testid="problem-card">{problem.title}</div>
  ),
}));

const mockProblems: LeetCodeProblem[] = [
  {
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
  },
];

describe("ProblemList", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

  it("renders the list of problems", () => {
    render(
      <ProblemList
        companyId="1"
        companySlug="google"
        initialProblems={mockProblems}
        initialHasMore={false}
        initialNextCursor={undefined}
        itemsPerPage={10}
        initialFilters={{
            difficultyFilter: [],
            lastAskedFilter: [],
            statusFilter: [],
            searchTerm: "",
            sortKey: "title"
        }}
        totalPages={1}
        currentPage={1}
      />
    );
    expect(screen.getByText("Two Sum")).toBeInTheDocument();
  });

  it("shows no problems message when empty", () => {
    render(
        <ProblemList
          companyId="1"
          companySlug="google"
          initialProblems={[]}
          initialHasMore={false}
          initialNextCursor={undefined}
          itemsPerPage={10}
          initialFilters={{
              difficultyFilter: [],
              lastAskedFilter: [],
              statusFilter: [],
              searchTerm: "",
              sortKey: "title"
          }}
          totalPages={1}
          currentPage={1}
        />
      );
      expect(screen.getByText(/No problems match/)).toBeInTheDocument();
  });
});
