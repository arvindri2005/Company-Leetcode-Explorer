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
global.fetch = jest.fn();

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

  it('should render empty state when no problems', () => {
    render(<ProblemList {...defaultProps} initialProblems={[]} />);

    expect(screen.getByText(/No problems match the current filters/i)).toBeInTheDocument();
  });
});
