import { render, screen, waitFor } from "@testing-library/react";
import ProblemList from "./problem-list";
import { LeetCodeProblem } from "../../types";
import { userService } from "@/services/user.service";

// Mock Next.js hooks
const mockPush = jest.fn();
const mockSearchParams = new URLSearchParams();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
  useSearchParams: () => mockSearchParams,
  usePathname: () => "/company/google",
}));

// Mock userService
jest.mock("@/services/user.service", () => ({
  userService: {
    getUserGlobalProblemStats: jest.fn(),
  },
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
jest.mock("../problem-card/problem-card", () => ({
  __esModule: true,
  default: ({ problem, problemStatus, initialIsBookmarked }: any) => (
    <div 
        data-testid="problem-card" 
        data-status={problemStatus || "none"}
        data-bookmarked={initialIsBookmarked ? "true" : "false"}
    >
        {problem.title}
    </div>
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
        // Default mock implementation
        (userService.getUserGlobalProblemStats as jest.Mock).mockResolvedValue({
            solvedProblemIds: [],
            attemptedProblemIds: [],
            bookmarkedProblemIds: []
        });
    });

  it("renders the list of problems and syncs status", async () => {
    // Setup specific mock for this test to verify state sync
    (userService.getUserGlobalProblemStats as jest.Mock).mockResolvedValue({
        solvedProblemIds: ["1"], // "Two Sum" is solved
        attemptedProblemIds: [],
        bookmarkedProblemIds: []
    });

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

    // Initial render verification
    expect(screen.getByText("Two Sum")).toBeInTheDocument();

    // Wait for async status sync (Integration Check)
    await waitFor(() => {
        const card = screen.getByTestId("problem-card");
        expect(card).toHaveAttribute("data-status", "solved");
    });
  });

  it("shows no problems message when empty", async () => {
    // Prevent state updates by returning a pending promise
    (userService.getUserGlobalProblemStats as jest.Mock).mockReturnValue(new Promise(() => {}));

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
      
      // Verify service was called (triggers the pending promise)
      expect(userService.getUserGlobalProblemStats).toHaveBeenCalled();
  });
});
