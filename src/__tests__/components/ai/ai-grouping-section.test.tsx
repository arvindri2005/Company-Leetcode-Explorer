import { render, screen } from '@testing-library/react';
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

// Mock AI actions
jest.mock('@/app/actions', () => ({
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
  }),
}));

jest.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: jest.fn() }),
}));

jest.mock('next/navigation', () => ({
  usePathname: () => '/test-path',
}));

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
    problems: mockProblems,
    companyName: 'Test Company',
    companySlug: 'test-company',
  };

  it('should render initial state', () => {
    render(<AIGroupingSection {...defaultProps} />);
    expect(screen.getByText(/AI-Powered Question Grouping/i)).toBeInTheDocument();
  });
});
