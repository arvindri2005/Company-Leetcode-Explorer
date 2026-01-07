import { render, screen, waitFor } from '@testing-library/react';
import AIGroupingSection from '@/components/ai/ai-grouping-section';
import { LeetCodeProblem } from '@/types';

// Mock child components
jest.mock('@/components/ui/card', () => ({
  Card: ({ children }: any) => <div>{children}</div>,
  CardHeader: ({ children }: any) => <div>{children}</div>,
  CardTitle: ({ children }: any) => <div>{children}</div>,
  CardDescription: ({ children }: any) => <div>{children}</div>,
  CardContent: ({ children }: any) => <div>{children}</div>,
}));

jest.mock('@/components/ui/accordion', () => ({
  Accordion: ({ children }: any) => <div>{children}</div>,
  AccordionItem: ({ children }: any) => <div>{children}</div>,
  AccordionTrigger: ({ children }: any) => <div>{children}</div>,
  AccordionContent: ({ children }: any) => <div>{children}</div>,
}));

jest.mock('@/components/ai/problem-insights-dialog', () => ({
  __esModule: true,
  default: () => <div data-testid="problem-insights-dialog">Insights Dialog</div>,
}));

jest.mock('@/components/ai/similar-problems-dialog', () => ({
  __esModule: true,
  default: () => <div data-testid="similar-problems-dialog">Similar Problems Dialog</div>,
}));

jest.mock('@/features/problems', () => ({
  ProblemCard: () => <div data-testid="problem-card">Problem Card</div>,
}));

// Mock AI actions
jest.mock('@/app/actions/ai.actions', () => ({
  performQuestionGrouping: jest.fn().mockResolvedValue({
    groups: [
      {
        groupName: 'Group 1',
        description: 'Description 1',
        questions: [
          {
            title: 'Problem 1',
            difficulty: 'Easy',
            slug: 'problem-1',
            reasoning: 'Reasoning 1',
          },
        ],
      },
    ],
  }),
}));

// Mock hooks
jest.mock('@/contexts/auth-context', () => ({
  useAuth: () => ({ user: { uid: '123' }, loading: false }),
}));

jest.mock('@/hooks/use-ai-cooldown', () => ({
  useAICooldown: () => ({
    canUseAI: true,
    startCooldown: jest.fn(),
    formattedRemainingTime: '0s',
    isLoadingCooldown: false,
    getFormattedRemainingTime: () => '0s',
  }),
}));

jest.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: jest.fn() }),
}));

jest.mock('next/navigation', () => ({
  usePathname: () => '/test-path',
}));

// Mock global fetch
global.fetch = jest.fn();

describe('AIGroupingSection', () => {
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
    companyName: 'Test Company',
    companySlug: 'test-company',
  };

  beforeEach(() => {
    (global.fetch as jest.Mock).mockClear();
  });

  it('should render initial state after fetching problems', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockProblems,
    });

    render(<AIGroupingSection {...defaultProps} />);

    // Initially it shows loading
    expect(screen.getByText(/Loading problems.../i)).toBeInTheDocument();

    // Wait for content to appear
    await waitFor(() => {
        expect(screen.getByText(/AI-Powered Question Grouping/i)).toBeInTheDocument();
    });
  });

  it('should render nothing if fetch fails', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Failed'));

      render(<AIGroupingSection {...defaultProps} />);
      
      await waitFor(() => {
          expect(screen.queryByText(/AI-Powered Question Grouping/i)).not.toBeInTheDocument();
          expect(screen.queryByText(/Loading problems.../i)).not.toBeInTheDocument();
      });
  });

  it('should render nothing if no problems returned', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: async () => [],
      });

      render(<AIGroupingSection {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.queryByText(/AI-Powered Question Grouping/i)).not.toBeInTheDocument();
        expect(screen.queryByText(/Loading problems.../i)).not.toBeInTheDocument();
      });
  });
});
