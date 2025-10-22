import { render, screen, waitFor } from '@testing-library/react';
import CompaniesPage, { generateMetadata } from '../page';
import { getCompaniesWithTotalCount } from '@/lib/data';
import { Company } from '@/types';

// Mock react.cache
jest.mock('react', () => ({
  ...jest.requireActual('react'),
  cache: (fn) => fn,
}));

// Mock the getCompaniesWithTotalCount function
jest.mock('@/lib/data', () => ({
  getCompaniesWithTotalCount: jest.fn(),
}));

// Mock the CompanyList component
jest.mock('@/components/company/company-list', () => {
  return function DummyCompanyList({ initialCompanies, initialSearchTerm }: { initialCompanies: Company[], initialSearchTerm: string }) {
    return (
      <div data-testid="company-list">
        <div data-testid="search-term">{initialSearchTerm}</div>
        {initialCompanies.map((company) => (
          <div key={company.id} data-testid={`company-card-${company.id}`}>{company.name}</div>
        ))}
      </div>
    );
  };
});

describe('CompaniesPage', () => {
  beforeEach(() => {
    // Clear mock history before each test
    (getCompaniesWithTotalCount as jest.Mock).mockClear();
  });

  it('renders the page with initial companies', async () => {
    const mockCompanies = [
      { id: '1', name: 'Google', slug: 'google', problemCount: 10 },
      { id: '2', name: 'Facebook', slug: 'facebook', problemCount: 5 },
    ];

    (getCompaniesWithTotalCount as jest.Mock).mockResolvedValue({
      companies: mockCompanies,
      hasMore: false,
      nextCursor: null,
      totalCompanies: 2,
    });

    const Page = await CompaniesPage({ searchParams: {} });
    render(Page);

    expect(screen.getByText('Explore Companies')).toBeInTheDocument();
    expect(screen.getByText('& Their Interview Problems')).toBeInTheDocument();
    expect(screen.getByTestId('company-list')).toBeInTheDocument();
    expect(screen.getByTestId('company-card-1')).toHaveTextContent('Google');
    expect(screen.getByTestId('company-card-2')).toHaveTextContent('Facebook');
  });

  it('displays a message when no companies are found', async () => {
    (getCompaniesWithTotalCount as jest.Mock).mockResolvedValue({
      companies: [],
      hasMore: false,
      nextCursor: null,
      totalCompanies: 0,
    });

    const Page = await CompaniesPage({ searchParams: {} });
    render(Page);

    expect(screen.queryByTestId(/company-card-/)).not.toBeInTheDocument();
  });

  it('renders the page with search results', async () => {
    const mockCompanies = [
      { id: '1', name: 'Apple', slug: 'apple', problemCount: 10 },
    ];

    (getCompaniesWithTotalCount as jest.Mock).mockResolvedValue({
      companies: mockCompanies,
      hasMore: false,
      nextCursor: null,
      totalCompanies: 1,
    });

    const Page = await CompaniesPage({ searchParams: { search: 'Apple' } });
    render(Page);

    expect(screen.getByText('Explore Companies')).toBeInTheDocument();
    expect(screen.getByTestId('search-term')).toHaveTextContent('Apple');
    expect(screen.getByTestId('company-card-1')).toHaveTextContent('Apple');
  });

  describe('generateMetadata', () => {
    it('generates correct metadata for the default page', async () => {
      const metadata = await generateMetadata({ searchParams: {} });
      expect(metadata.title).toBe('Explore Companies ');
      expect(metadata.description).toBe('Browse and filter companies to find coding problems asked in their technical interviews. Prepare for your next coding interview with ByteToOffer.');
    });

    it('generates correct metadata for a search query', async () => {
      const metadata = await generateMetadata({ searchParams: { search: 'Google' } });
      expect(metadata.title).toBe('Explore Companies ');
      expect(metadata.description).toBe('Browse and filter companies to find coding problems asked in their technical interviews. Prepare for your next coding interview with ByteToOffer.');
    });
  });
});