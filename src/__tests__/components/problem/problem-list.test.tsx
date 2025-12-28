import { render, screen, waitFor } from '@testing-library/react';
import ProblemList from '@/components/problem/problem-list';
import { LeetCodeProblem } from '@/types';
import { userService } from '@/services/user.service';

// Mock child components
jest.mock('@/components/problem/problem-card', () => ({
  __esModule: true,
  default: ({ problem, problemStatus, initialIsBookmarked }: any) => (
    <div 
        data-testid="problem-card" 
        data-status={problemStatus} 
        data-bookmarked={initialIsBookmarked ? 'true' : 'false'}
    >
        {problem.title}
    </div>
  ),
}));

// Mock services
jest.mock('@/services/user.service', () => ({
    userService: {
        getUserGlobalProblemStats: jest.fn(),
    },
}));

// Mock server actions
jest.mock('@/app/actions/problem.actions', () => ({
  loadMoreProblemsAction: jest.fn(),
}));

jest.mock('@/components/problem/problem-list-controls', () => ({
  __esModule: true,
  default: () => <div data-testid="problem-list-controls">Controls</div>,
}));

jest.mock('@/components/ads/ad-placeholder', () => ({
  __esModule: true,
  default: () => <div data-testid="ad-placeholder">Ad</div>,
}));

// Mock hooks
jest.mock('@/contexts/auth-context', () => ({
  useAuth: () => ({ user: { uid: '123' } }),
}));

jest.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: jest.fn() }),
}));

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/problems',
}));

// Mock IntersectionObserver
const mockIntersectionObserver = jest.fn();
mockIntersectionObserver.mockReturnValue({
  observe: () => null,
  unobserve: () => null,
  disconnect: () => null,
});
window.IntersectionObserver = mockIntersectionObserver;

// Mock fetch
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ problems: [], hasMore: false }),
  })
) as jest.Mock;

describe('ProblemList', () => {
  const mockProblems: LeetCodeProblem[] = [
    {
      id: '1',
      title: 'Problem 1',
      difficulty: 'Easy',
      slug: 'problem-1',
      link: 'https://leetcode.com/problems/problem-1/',
      companyId: '1',
      companySlug: 'test-company',
      normalizedTitle: 'problem 1',
      tags: [],
    },
    {
        id: '2',
        title: 'Problem 2',
        difficulty: 'Medium',
        slug: 'problem-2',
        link: 'https://leetcode.com/problems/problem-2/',
        companyId: '1',
        companySlug: 'test-company',
        normalizedTitle: 'problem 2',
        tags: [],
      },
  ];

  const defaultProps = {
    companyId: '1',
    companySlug: 'test-company',
    initialProblems: mockProblems,
    initialHasMore: false,
    itemsPerPage: 10,
    initialFilters: {
      difficultyFilter: [],
      lastAskedFilter: [],
      statusFilter: [],
      searchTerm: '',
      sortKey: 'title' as const,
    },
    totalPages: 1,
    currentPage: 1,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render initial problems', async () => {
    // Setup mock return value for userService
    (userService.getUserGlobalProblemStats as jest.Mock).mockResolvedValue({
      solvedProblemIds: [],
      attemptedProblemIds: [],
      bookmarkedProblemIds: [],
    });

    render(<ProblemList {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByTestId('problem-list-controls')).toBeInTheDocument();
    });
    expect(screen.getByText('Problem 1')).toBeInTheDocument();
    expect(screen.getByText('Problem 2')).toBeInTheDocument();
  });

  it('should apply user global stats (solved, bookmarked) to problems', async () => {
    // Setup mock to return specific stats
    (userService.getUserGlobalProblemStats as jest.Mock).mockResolvedValue({
      solvedProblemIds: ['1'], // Problem 1 is solved
      attemptedProblemIds: [],
      bookmarkedProblemIds: ['2'], // Problem 2 is bookmarked
    });

    render(<ProblemList {...defaultProps} />);

    // Wait for the stats to be fetched and applied
    await waitFor(() => {
        expect(userService.getUserGlobalProblemStats).toHaveBeenCalledWith('123');
    });

    // We need to wait for the state update to propagate to the ProblemCard.
    // Since ProblemList updates displayedProblems via useMemo/state when stats load, 
    // it triggers a re-render of ProblemCard.
    
    await waitFor(() => {
         const problem1Card = screen.getByText('Problem 1').closest('div[data-testid="problem-card"]');
         expect(problem1Card).toHaveAttribute('data-status', 'solved');
    });

    const problem1Card = screen.getByText('Problem 1').closest('div[data-testid="problem-card"]');
    expect(problem1Card).toHaveAttribute('data-bookmarked', 'false');

    const problem2Card = screen.getByText('Problem 2').closest('div[data-testid="problem-card"]');
    expect(problem2Card).toHaveAttribute('data-status', 'none'); // Default status if not solved/attempted
    expect(problem2Card).toHaveAttribute('data-bookmarked', 'true');
  });

  it('should render empty state when no problems', async () => {
      // Setup mock return value for userService
      (userService.getUserGlobalProblemStats as jest.Mock).mockResolvedValue({
        solvedProblemIds: [],
        attemptedProblemIds: [],
        bookmarkedProblemIds: [],
      });
  
      render(<ProblemList {...defaultProps} initialProblems={[]} />);
  
      await waitFor(() => {
          expect(screen.getByText(/No problems match the current filters/i)).toBeInTheDocument();
      });
    });
});
