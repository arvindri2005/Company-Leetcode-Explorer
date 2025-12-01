import { render, screen, waitFor } from '@testing-library/react';
import CompanyTabs from '@/components/company/page/company-tabs';
import { getAIProblems } from '@/actions/problem.actions';

// Mock actions
jest.mock('@/actions/problem.actions', () => ({
  getAIProblems: jest.fn(),
}));

// Mock child components
jest.mock('@/components/problem/problem-list', () => ({
  __esModule: true,
  default: () => <div data-testid="problem-list">Problem List</div>,
}));

jest.mock('@/components/ui/tabs', () => ({
  Tabs: ({ children }: any) => <div>{children}</div>,
  TabsList: ({ children }: any) => <div>{children}</div>,
  TabsTrigger: ({ children, onClick }: any) => <button onClick={onClick}>{children}</button>,
  TabsContent: ({ children }: any) => <div>{children}</div>,
}));

jest.mock('@/components/ai/ai-grouping-section', () => ({
  __esModule: true,
  default: () => <div data-testid="ai-grouping-section">AI Grouping Section</div>,
}));

jest.mock('@/components/ai/flashcard-generator', () => ({
  __esModule: true,
  default: () => <div data-testid="flashcard-generator">Flashcard Generator</div>,
}));

jest.mock('@/components/ai/company-strategy-generator', () => ({
  __esModule: true,
  default: () => <div data-testid="company-strategy-generator">Strategy Generator</div>,
}));

jest.mock('@/components/company/company-problem-stats', () => ({
  __esModule: true,
  default: () => <div data-testid="company-problem-stats">Problem Stats</div>,
}));

describe('CompanyTabs', () => {
  const mockCompany = {
    id: '1',
    slug: 'test-company',
    name: 'Test Company',
    logo: 'logo.png',
    problemCount: 10,
    website: 'https://example.com',
    commonTags: [],
    relatedCompanies: [],
  };

  const defaultProps = {
    company: mockCompany,
    displayProblemCount: 10,
    initialProblems: [],
    initialHasMore: false,
    initialNextCursor: null,
    initialFilters: {
      difficultyFilter: [],
      lastAskedFilter: [],
      statusFilter: [],
      searchTerm: "",
      sortKey: "title" as const,
    },
    itemsPerPage: 15,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render all tabs triggers', async () => {
    (getAIProblems as jest.Mock).mockResolvedValue([]);
    render(<CompanyTabs {...defaultProps} />);

    expect(screen.getByText('Problems')).toBeInTheDocument();
    expect(screen.getByText('Statistics')).toBeInTheDocument();
    expect(screen.getByText('AI Groups')).toBeInTheDocument();
    expect(screen.getByText('Flashcards')).toBeInTheDocument();
    expect(screen.getByText('Strategy')).toBeInTheDocument();
    
    await waitFor(() => expect(getAIProblems).toHaveBeenCalled());
  });

  it('should render all content components (mocked tabs show all)', async () => {
    (getAIProblems as jest.Mock).mockResolvedValue([]);
    render(<CompanyTabs {...defaultProps} />);

    // Since we mocked Tabs to render all children, we expect all contents to be present
    // This verifies that CompanyTabs is correctly composing the children
    expect(screen.getByTestId('problem-list')).toBeInTheDocument();
    
    // Use findBy because dynamic imports might take a tick
    expect(await screen.findByTestId('company-problem-stats')).toBeInTheDocument();
    expect(await screen.findByTestId('ai-grouping-section')).toBeInTheDocument();
    expect(await screen.findByTestId('flashcard-generator')).toBeInTheDocument();
    expect(await screen.findByTestId('company-strategy-generator')).toBeInTheDocument();

    await waitFor(() => expect(getAIProblems).toHaveBeenCalled());
  });

  it('should fetch AI problems on mount', async () => {
    (getAIProblems as jest.Mock).mockResolvedValue([]);
    render(<CompanyTabs {...defaultProps} />);

    await waitFor(() => {
      expect(getAIProblems).toHaveBeenCalledWith(mockCompany.id);
    });
  });
});
