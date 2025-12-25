import { render, screen, waitFor } from '@testing-library/react';
import CompanyStrategyGenerator from '@/components/ai/company-strategy-generator';
import { userService } from '@/services/user.service';

jest.mock('react-markdown', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

jest.mock('remark-gfm', () => ({
  __esModule: true,
  default: () => {},
}));

// Mock child components
jest.mock('@/components/ui/card', () => ({
  Card: ({ children }: any) => <div>{children}</div>,
  CardHeader: ({ children }: any) => <div>{children}</div>,
  CardTitle: ({ children }: any) => <div>{children}</div>,
  CardDescription: ({ children }: any) => <div>{children}</div>,
  CardContent: ({ children }: any) => <div>{children}</div>,
}));

jest.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick }: any) => <button onClick={onClick}>{children}</button>,
}));

// Mock AI actions
jest.mock('@/app/actions/ai.actions', () => ({
  generateCompanyStrategyAction: jest.fn().mockResolvedValue({
    preparationStrategy: 'Strategy',
    focusTopics: [],
    todoItems: [],
  }),
}));

// Mock UserService
jest.mock('@/services/user.service', () => ({
  userService: {
    getStrategyTodoListForCompany: jest.fn().mockResolvedValue(null),
  },
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

describe('CompanyStrategyGenerator', () => {
  const defaultProps = {
    companyId: '1',
    companyName: 'Test Company',
    companySlug: 'test-company',
  };

  it('should render initial state', async () => {
    render(<CompanyStrategyGenerator {...defaultProps} />);
    expect(screen.getByText(/AI-Powered Interview Strategy/i)).toBeInTheDocument();
    
    // Verify that userService.getStrategyTodoListForCompany is called instead of the action
    await waitFor(() => expect(userService.getStrategyTodoListForCompany).toHaveBeenCalledWith('123', '1'));
  });
});
