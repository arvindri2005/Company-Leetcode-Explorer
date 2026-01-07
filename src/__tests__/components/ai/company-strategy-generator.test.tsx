import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import CompanyStrategyGenerator from '@/components/ai/company-strategy-generator';
import { userService } from '@/services/user.service';
import { generateCompanyStrategyAction } from '@/app/actions/ai.actions';
import { useToast } from '@/hooks/use-toast';

// --- Mocks ---

// Mock React Markdown to just render text
jest.mock('react-markdown', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => <div data-testid="markdown">{children}</div>,
}));

jest.mock('remark-gfm', () => ({
  __esModule: true,
  default: () => {},
}));

// Mock UI Components
jest.mock('@/components/ui/card', () => ({
  Card: ({ children, className }: any) => <div className={className} data-testid="card">{children}</div>,
  CardHeader: ({ children }: any) => <div data-testid="card-header">{children}</div>,
  CardTitle: ({ children }: any) => <div data-testid="card-title">{children}</div>,
  CardDescription: ({ children }: any) => <div data-testid="card-description">{children}</div>,
  CardContent: ({ children }: any) => <div data-testid="card-content">{children}</div>,
}));

jest.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, disabled }: any) => (
    <button onClick={onClick} disabled={disabled} data-testid="button">
      {children}
    </button>
  ),
}));

jest.mock('@/components/ui/accordion', () => ({
  Accordion: ({ children }: any) => <div data-testid="accordion">{children}</div>,
  AccordionItem: ({ children }: any) => <div data-testid="accordion-item">{children}</div>,
  AccordionTrigger: ({ children }: any) => <div data-testid="accordion-trigger">{children}</div>,
  AccordionContent: ({ children }: any) => <div data-testid="accordion-content">{children}</div>,
}));

// Mock Actions
jest.mock('@/app/actions/ai.actions', () => ({
  generateCompanyStrategyAction: jest.fn(),
}));

// Mock Services
jest.mock('@/services/user.service', () => ({
  userService: {
    getStrategyTodoListForCompany: jest.fn(),
    saveStrategyTodoList: jest.fn(),
  },
}));

// Mock Hooks
const mockUseAuth = jest.fn();
jest.mock('@/contexts/auth-context', () => ({
  useAuth: () => mockUseAuth(),
}));

const mockUseAICooldown = jest.fn();
jest.mock('@/hooks/use-ai-cooldown', () => ({
  useAICooldown: () => mockUseAICooldown(),
}));

const mockToast = jest.fn();
jest.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: mockToast }),
}));

jest.mock('next/navigation', () => ({
  usePathname: () => '/test-path',
}));

// --- Tests ---

describe('CompanyStrategyGenerator', () => {
  const defaultProps = {
    companyId: 'company-123',
    companyName: 'Tech Corp',
    companySlug: 'tech-corp',
  };

  const mockStrategyData = {
    preparationStrategy: 'Step 1: Study algorithms.',
    focusTopics: [
      { topic: 'Dynamic Programming', reason: 'Commonly asked.' },
    ],
    todoItems: [
      { text: 'Solve 5 DP problems', isCompleted: false },
    ],
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Default Auth: Logged in
    mockUseAuth.mockReturnValue({
      user: { uid: 'user-123' },
      loading: false,
    });

    // Default Cooldown: Can use AI
    mockUseAICooldown.mockReturnValue({
      canUseAI: true,
      startCooldown: jest.fn(),
      getFormattedRemainingTime: () => '0s',
      formattedRemainingTime: '0s',
      isLoadingCooldown: false,
    });

    // Default Service: No saved strategy
    (userService.getStrategyTodoListForCompany as jest.Mock).mockResolvedValue(null);
  });

  it('should render initial state correctly', async () => {
    render(<CompanyStrategyGenerator {...defaultProps} />);

    // Check title
    expect(screen.getByText(/AI-Powered Interview Strategy/i)).toBeInTheDocument();
    
    // Check initial description
    expect(screen.getByText(/Get a personalized preparation plan/i)).toBeInTheDocument();

    // Check "Generate" button exists using explicit role
    const button = screen.getByRole('button', { name: /Generate Prep Strategy/i });
    expect(button).toBeInTheDocument();

    // Verify it tries to load saved strategy
    await waitFor(() => {
      expect(userService.getStrategyTodoListForCompany).toHaveBeenCalledWith('user-123', 'company-123');
    });
  });

  it('should handle generating a strategy successfully', async () => {
    (generateCompanyStrategyAction as jest.Mock).mockResolvedValue(mockStrategyData);

    render(<CompanyStrategyGenerator {...defaultProps} />);

    // Wait for initial load check
    await waitFor(() => expect(userService.getStrategyTodoListForCompany).toHaveBeenCalled());

    // Click Generate using role
    const generateBtn = screen.getByRole('button', { name: /Generate Prep Strategy/i });
    fireEvent.click(generateBtn);

    // Verify loading state (might be too fast to catch depending on implementation, but we can check calls)
    expect(screen.queryByText(/Generating.../i)).toBeInTheDocument();

    // Wait for generation to complete
    await waitFor(() => {
      expect(generateCompanyStrategyAction).toHaveBeenCalledWith('company-123', undefined);
    });

    // Verify results are displayed
    expect(screen.getByText('Step 1: Study algorithms.')).toBeInTheDocument();
    expect(screen.getByText('Dynamic Programming')).toBeInTheDocument();
    expect(screen.getByText('Solve 5 DP problems')).toBeInTheDocument();

    // Verify toast success
    expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({
      title: expect.stringContaining("Generated"),
    }));
  });

  it('should handle saving a strategy', async () => {
    (generateCompanyStrategyAction as jest.Mock).mockResolvedValue(mockStrategyData);
    (userService.saveStrategyTodoList as jest.Mock).mockResolvedValue({ success: true });

    render(<CompanyStrategyGenerator {...defaultProps} />);

    // Trigger generation first
    await waitFor(() => expect(userService.getStrategyTodoListForCompany).toHaveBeenCalled());
    fireEvent.click(screen.getByRole('button', { name: /Generate Prep Strategy/i }));
    await waitFor(() => expect(generateCompanyStrategyAction).toHaveBeenCalled());

    // Click Save
    const saveBtn = screen.getByRole('button', { name: /Save Strategy/i });
    fireEvent.click(saveBtn);

    // Verify save call
    await waitFor(() => {
      expect(userService.saveStrategyTodoList).toHaveBeenCalledWith(
        'user-123',
        'company-123',
        'Tech Corp',
        mockStrategyData
      );
    });

    // Verify button text changes
    expect(screen.getByText(/Update Saved Strategy/i)).toBeInTheDocument();

    // Verify success toast
    expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({
      title: "Strategy Saved!",
    }));
  });

  it('should load and display a saved strategy on mount', async () => {
    (userService.getStrategyTodoListForCompany as jest.Mock).mockResolvedValue({
      preparationStrategy: 'Saved Strategy',
      focusTopics: [],
      items: [], // Note: service returns 'items', component maps to 'todoItems'
    });

    render(<CompanyStrategyGenerator {...defaultProps} />);

    // We skip checking for "Loading saved strategy..." because it might happen too fast

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText('Saved Strategy')).toBeInTheDocument();
    });

    // Check header indicates it's saved
    expect(screen.getByText(/Your Saved Strategy for/i)).toBeInTheDocument();

    // Check button says "Regenerate"
    expect(screen.getByRole('button', { name: /Regenerate Strategy/i })).toBeInTheDocument();
  });

  it('should handle error during generation', async () => {
    (generateCompanyStrategyAction as jest.Mock).mockResolvedValue({ error: "AI Failed" });

    render(<CompanyStrategyGenerator {...defaultProps} />);
    await waitFor(() => expect(userService.getStrategyTodoListForCompany).toHaveBeenCalled());

    fireEvent.click(screen.getByRole('button', { name: /Generate Prep Strategy/i }));

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({
        title: "AI Strategy Generation Failed",
        description: "AI Failed",
        variant: "destructive",
      }));
    });
  });

  it('should disable generate button when on cooldown', async () => {
     mockUseAICooldown.mockReturnValue({
      canUseAI: false,
      startCooldown: jest.fn(),
      getFormattedRemainingTime: () => '5m',
      formattedRemainingTime: '5m',
      isLoadingCooldown: false,
    });

    render(<CompanyStrategyGenerator {...defaultProps} />);

    // Wait for initial effect
    await waitFor(() => expect(userService.getStrategyTodoListForCompany).toHaveBeenCalled());

    // Use getByRole which will only find the button
    const generateBtn = screen.getByRole('button', { name: /Generate Prep Strategy/i });
    expect(generateBtn).toBeDisabled();
    expect(generateBtn).toHaveAttribute('disabled');
  });

  it('should prompt login if user is not authenticated', async () => {
    mockUseAuth.mockReturnValue({
      user: null,
      loading: false,
    });

    render(<CompanyStrategyGenerator {...defaultProps} />);

    expect(screen.getByText(/Login to Generate Strategy/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Generate Prep Strategy/i })).not.toBeInTheDocument();
  });
});
