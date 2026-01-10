import { render, screen, waitFor } from "@testing-library/react";
import AllProblemsList from "./all-problems-list";
import { LeetCodeProblem } from "../../types";

// Mock Next.js hooks
const mockPush = jest.fn();
const mockSearchParams = new URLSearchParams();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
  useSearchParams: () => mockSearchParams,
  usePathname: () => "/problems",
}));

// Mock user service
jest.mock("@/features/profile/services/user.service", () => ({
  userService: {
    getUserGlobalProblemStats: jest.fn().mockResolvedValue({
      solvedProblemIds: [],
      attemptedProblemIds: [],
      bookmarkedProblemIds: []
    })
  }
}));

// Mock dynamic imports or actions used inside
jest.mock("@/app/actions/problem.actions", () => ({
  fetchProblemsAction: jest.fn(),
  loadMoreAllProblemsAction: jest.fn(),
}));

jest.mock("../problem-list-controls/problem-list-controls", () => ({
  __esModule: true,
  default: () => <div data-testid="problem-list-controls">Controls</div>,
}));

jest.mock("@/components/ads/ad-placeholder", () => ({
  __esModule: true,
  default: () => <div data-testid="ad-placeholder">Ad</div>,
}));

// Mock auth
jest.mock("@/providers", () => ({
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
  default: ({ problem }: { problem: LeetCodeProblem }) => (
    <div data-testid="problem-card">{problem.title}</div>
  ),
}));

const mockProblems: LeetCodeProblem[] = [
  {
    id: "1",
    title: "Two Sum",
    difficulty: "Easy",
    tags: ["Array", "Hash Table"],
    companyIds: ["google"],
    link: "https://leetcode.com/problems/two-sum",
    companyId: "google",
    companySlug: "unknown",
    slug: "two-sum",
    normalizedTitle: "Two Sum",
  },
];

describe("AllProblemsList", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

  it("renders the list of problems", async () => {
    render(
      <AllProblemsList
        initialProblems={mockProblems}
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
        hasMore={false}
        initialNextCursor={undefined}
      />
    );

    
    // Wait for the async getUserGlobalProblemStats to be called and processed
    await waitFor(() => {
        expect(screen.getByText("Two Sum")).toBeInTheDocument();
    });
  });

   it("shows no problems message when empty", async () => {
      render(
        <AllProblemsList
          initialProblems={[]}
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
          hasMore={false}
          initialNextCursor={undefined}
        />
      );
      
      await waitFor(() => {
          expect(screen.getByText(/No problems match/)).toBeInTheDocument();
      });
    });
});






