import { render, screen, fireEvent } from '@testing-library/react';
import ProblemCard from '@/components/problem/problem-card';
import { LeetCodeProblem } from '@/types';

// Mock child components
jest.mock('@/components/problem/difficulty-badge', () => ({
  __esModule: true,
  default: ({ difficulty }: { difficulty: string }) => <div data-testid="difficulty-badge">{difficulty}</div>,
}));

jest.mock('@/components/problem/tag-badge', () => ({
  __esModule: true,
  default: ({ tag }: { tag: string }) => <div data-testid="tag-badge">{tag}</div>,
}));

jest.mock('@/components/problem/problem-status-icon', () => ({
  __esModule: true,
  default: ({ status }: { status: string }) => <div data-testid="status-icon">{status}</div>,
}));

jest.mock('@/hooks/use-problem-interactions', () => ({
  useProblemInteractions: () => ({
    isBookmarked: false,
    isTogglingBookmark: false,
    handleToggleBookmark: jest.fn(),
    currentStatus: 'none',
    isUpdatingStatus: false,
    handleStatusUpdate: jest.fn(),
    promptLogin: jest.fn(),
  }),
}));

jest.mock('@/hooks/use-ai-features', () => ({
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

jest.mock('@/contexts/auth-context', () => ({
  useAuth: () => ({ user: { uid: '123' } }),
}));

jest.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: jest.fn() }),
}));

describe('ProblemCard', () => {
  const mockProblem: LeetCodeProblem = {
    id: '1',
    title: 'Two Sum',
    difficulty: 'Easy',
    slug: 'two-sum',
    link: 'https://leetcode.com/problems/two-sum/',
    companyId: '1',
    companySlug: 'google',
    normalizedTitle: 'two sum',
    tags: ['Array'],
  };

  const defaultProps = {
    problem: mockProblem,
    companySlug: 'google',
    initialIsBookmarked: false,
    onBookmarkChanged: jest.fn(),
    problemStatus: 'none' as const,
    onProblemStatusChange: jest.fn(),
  };

  it('should render problem details', () => {
    render(<ProblemCard {...defaultProps} />);

    expect(screen.getByText('Two Sum')).toBeInTheDocument();
    expect(screen.getByText('Easy')).toBeInTheDocument();
    expect(screen.getByText('Array')).toBeInTheDocument();
  });

  it('should render external link to LeetCode and action buttons', () => {
    render(<ProblemCard {...defaultProps} />);

    // The link has an aria-label that includes "(opens in a new tab)" for accessibility
    const titleLink = screen.getByRole('link', { name: 'Two Sum (opens in a new tab)' });
    expect(titleLink).toHaveAttribute('href', 'https://leetcode.com/problems/two-sum/');

    // Simulate clicking the card (e.g., via the difficulty badge) to expand it
    fireEvent.click(screen.getByText('Easy'));

    // Updated expectation: Look for "Write Code" instead of "Solve"
    const writeCodeButton = screen.getByRole('button', { name: /write code/i });
    expect(writeCodeButton).toBeInTheDocument();
  });
});