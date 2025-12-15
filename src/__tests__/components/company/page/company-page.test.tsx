import { render, screen } from '@testing-library/react';
import CompanyPage from '@/components/company/page/company-page';

// Mock child components
jest.mock('@/components/company/company-header', () => ({
  __esModule: true,
  default: () => <div data-testid="company-header">Company Header</div>,
}));

jest.mock('@/components/company/page/company-tabs', () => ({
  __esModule: true,
  default: () => <div data-testid="company-tabs">Company Tabs</div>,
}));

jest.mock('@/components/company/page/problem-load-error', () => ({
  __esModule: true,
  default: ({ error }: { error: string }) => <div data-testid="problem-load-error">{error}</div>,
}));

jest.mock('@/components/company/page/no-problems-available', () => ({
  __esModule: true,
  default: () => <div data-testid="no-problems-available">No Problems Available</div>,
}));

jest.mock('@/components/company/related-companies', () => ({
  __esModule: true,
  default: () => <div data-testid="related-companies">Related Companies</div>,
}));

jest.mock('@/components/company/company-preparation-guide', () => ({
  __esModule: true,
  default: () => <div data-testid="company-preparation-guide">Preparation Guide</div>,
}));

jest.mock('@/components/ads/ad-placeholder', () => ({
  __esModule: true,
  default: () => <div data-testid="ad-placeholder">Ad Placeholder</div>,
}));

jest.mock('@/services/company.service', () => ({
  companyService: {},
}));

describe('CompanyPage', () => {
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

  const mockProblemsData = {
    problems: [{ id: '1', title: 'Problem 1' }],
    hasMore: false,
    nextCursor: null,
    totalProblems: 1,
    totalPages: 1,
    currentPage: 1,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render company page with problems', async () => {
    // Pass the mock data directly as a prop
    const Page = await CompanyPage({ 
      company: mockCompany,
      initialPaginatedProblems: mockProblemsData
    });
    render(Page);

    expect(screen.getByTestId('company-header')).toBeInTheDocument();
    expect(screen.getByTestId('company-tabs')).toBeInTheDocument();
  });

  it('should render no problems available when count is 0', async () => {
    const emptyProblemsData = {
      ...mockProblemsData,
      problems: [],
      totalProblems: 0,
    };

    const Page = await CompanyPage({ 
      company: mockCompany, 
      initialPaginatedProblems: emptyProblemsData 
    });
    render(Page);

    expect(screen.getByTestId('no-problems-available')).toBeInTheDocument();
    expect(screen.queryByTestId('company-tabs')).not.toBeInTheDocument();
  });

  it('should render error state when fetching fails', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    
    // Pass the error object as the prop
    const Page = await CompanyPage({ 
      company: mockCompany,
      initialPaginatedProblems: { error: 'Failed to fetch' }
    });
    
    render(Page);

    expect(screen.getByTestId('problem-load-error')).toBeInTheDocument();
    expect(screen.getByText('Failed to fetch')).toBeInTheDocument();
    expect(screen.getByTestId('company-header')).toBeInTheDocument();
    expect(screen.queryByTestId('company-tabs')).not.toBeInTheDocument();

    consoleErrorSpy.mockRestore();
  });
});
