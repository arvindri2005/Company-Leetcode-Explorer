import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import CompanyStrategyGenerator from '@/components/ai/company-strategy-generator';
import { userService } from '@/services/user.service';
import { generateCompanyStrategyAction } from '@/app/actions/ai.actions';
import { useAuth } from '@/contexts/auth-context';
import { useAICooldown } from '@/hooks/use-ai-cooldown';
import { useToast } from '@/hooks/use-toast';

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
  Card: ({ children }: any) => <div data-testid="card">{children}</div>,
  CardHeader: ({ children }: any) => <div data-testid="card-header">{children}</div>,
  CardTitle: ({ children }: any) => <div data-testid="card-title">{children}</div>,
  CardDescription: ({ children }: any) => <div data-testid="card-description">{children}</div>,
  CardContent: ({ children }: any) => <div data-testid="card-content">{children}</div>,
}));

jest.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, disabled }: any) => (
    <button onClick={onClick} disabled={disabled}>
      {children}
    </button>
  ),
}));

jest.mock('@/components/ui/select', () => ({
  Select: ({ children, onValueChange, value }: any) => (
    <div data-testid="select" data-value={value} onChange={(e: any) => onValueChange(e.target.value)}>
      {children}
    </div>
  ),
  SelectTrigger: ({ children }: any) => <button>{children}</button>,
  SelectValue: () => <span>Select Value</span>,
  SelectContent: ({ children }: any) => <div>{children}</div>,
  SelectItem: ({ children, value, onClick }: any) => (
    <div data-testid={`select-item-${value}`} onClick={() => onClick && onClick(value)}>
      {children}
    </div>
  ),
}));

jest.mock('@/components/ui/accordion', () => ({
  Accordion: ({ children }: any) => <div>{children}</div>,
  AccordionItem: ({ children }: any) => <div>{children}</div>,
  AccordionTrigger: ({ children }: any) => <div>{children}</div>,
  AccordionContent: ({ children }: any) => <div>{children}</div>,
}));

// Mock AI actions
jest.mock('@/app/actions/ai.actions', () => ({
  generateCompanyStrategyAction: jest.fn(),
}));

// Mock UserService
jest.mock('@/services/user.service', () => ({
  userService: {
    getStrategyTodoListForCompany: jest.fn().mockResolvedValue(null),
    saveStrategyTodoList: jest.fn().mockResolvedValue({ success: true }),
  },
}));

// Mock hooks
jest.mock('@/contexts/auth-context', () => ({
  useAuth: jest.fn(),
}));

jest.mock('@/hooks/use-ai-cooldown', () => ({
  useAICooldown: jest.fn(),
}));

jest.mock('@/hooks/use-toast', () => ({
  useToast: jest.fn(),
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

  const mockToast = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useAuth as jest.Mock).mockReturnValue({ user: { uid: '123' }, loading: false });
    (useAICooldown as jest.Mock).mockReturnValue({
      canUseAI: true,
      startCooldown: jest.fn(),
      getFormattedRemainingTime: () => '0s',
      isLoadingCooldown: false,
    });
    (useToast as jest.Mock).mockReturnValue({ toast: mockToast });

    (generateCompanyStrategyAction as jest.Mock).mockResolvedValue({
      preparationStrategy: '## Strategy\nThis is a plan.',
      focusTopics: [{ topic: 'Topic 1', reason: 'Reason 1' }],
      todoItems: [{ text: 'Do this', isCompleted: false }],
    });
  });

  it('should render initial state', async () => {
    render(<CompanyStrategyGenerator {...defaultProps} />);
    expect(screen.getByText(/AI-Powered Interview Strategy/i)).toBeInTheDocument();
    
    await waitFor(() => expect(userService.getStrategyTodoListForCompany).toHaveBeenCalledWith('123', '1'));
  });

  it('should generate strategy when button is clicked', async () => {
    render(<CompanyStrategyGenerator {...defaultProps} />);

    await waitFor(() => expect(userService.getStrategyTodoListForCompany).toHaveBeenCalled());

    const generateBtn = screen.getByText('Generate Prep Strategy');
    expect(generateBtn).not.toBeDisabled();

    fireEvent.click(generateBtn);

    expect(screen.getByText('Generating...')).toBeInTheDocument();

    expect(generateCompanyStrategyAction).toHaveBeenCalledWith('1', undefined);

    await waitFor(() => {
      expect(screen.getByText(/AI-Generated Strategy for/i)).toBeInTheDocument();
    }, { timeout: 3000 });

    expect(screen.getByText('Overall Preparation Strategy')).toBeInTheDocument();
  });

  it('should save strategy when save button is clicked', async () => {
    (userService.getStrategyTodoListForCompany as jest.Mock).mockResolvedValue(null);

    render(<CompanyStrategyGenerator {...defaultProps} />);

    await waitFor(() => expect(userService.getStrategyTodoListForCompany).toHaveBeenCalled());

    const generateBtn = screen.getByText('Generate Prep Strategy');
    fireEvent.click(generateBtn);

    await waitFor(() => {
      expect(screen.getByText(/AI-Generated Strategy for/i)).toBeInTheDocument();
    });

    const saveBtn = screen.getByText('Save Strategy');
    fireEvent.click(saveBtn);

    expect(userService.saveStrategyTodoList).toHaveBeenCalledWith(
      '123',
      '1',
      'Test Company',
      expect.objectContaining({
        preparationStrategy: expect.any(String),
        focusTopics: expect.any(Array),
        todoItems: expect.any(Array),
      })
    );

    // Wait for the success toast to appear, which implies state updates are finished
    await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({
            title: 'Strategy Saved!',
        }));
    });
  });
});
