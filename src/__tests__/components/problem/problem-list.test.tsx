import { render, screen, waitFor } from '@testing-library/react';
import ProblemList from '@/components/problem/problem-list';
import { LeetCodeProblem } from '@/types';

// Mock child components
jest.mock('@/components/problem/problem-card', () => ({
  __esModule: true,
  default: ({ problem }: { problem: any }) => <div data-testid="problem-card">{problem.title}</div>,
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

// Mock IntersectionObserver
const mockIntersectionObserver = jest.fn();
mockIntersectionObserver.mockReturnValue({
  observe: () => null,
  unobserve: () => null,
  disconnect: () => null,
});
window.IntersectionObserver = mockIntersectionObserver;

// Mock fetch
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
  ];

global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ problems: mockProblems, hasMore: false }),
  })
) as jest.Mock;

describe('ProblemList', () => {
  // mockProblems is defined globally above.

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
    render(<ProblemList {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByTestId('problem-list-controls')).toBeInTheDocument();
    });
    expect(screen.getByText('Problem 1')).toBeInTheDocument();
  });

  it('should render empty state when no problems', async () => {
    (global.fetch as jest.Mock).mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ problems: [], hasMore: false }),
      })
    );

    render(<ProblemList {...defaultProps} initialProblems={[]} />);

    // Wait for potential effects to settle, though initial render should show empty state
    // If the effect triggers a fetch that returns empty, it stays empty.
    await waitFor(() => {
        expect(screen.getByText(/No problems match the current filters/i)).toBeInTheDocument();
    });
  });
});
