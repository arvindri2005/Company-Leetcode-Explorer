import { render, screen } from '@testing-library/react';
import CompanyPageWrapper, { generateMetadata, generateStaticParams } from '@/app/company/[companySlug]/page';
import { getCompanyBySlug, getAllCompanySlugs } from '@/lib/data';

// Mock the data fetching functions
jest.mock('@/lib/data', () => ({
  getCompanyBySlug: jest.fn(),
  getAllCompanySlugs: jest.fn(),
}));

// Mock child components to avoid testing their implementation details
jest.mock('@/components/company/page/company-not-found', () => ({
  __esModule: true,
  default: ({ companySlug }: { companySlug: string }) => <div data-testid="company-not-found">{companySlug}</div>,
}));

jest.mock('@/components/company/page/company-page', () => ({
  __esModule: true,
  default: ({ company }: { company: any }) => <div data-testid="company-page">{company.name}</div>,
}));

jest.mock('@/components/seo/structured-data', () => ({
  __esModule: true,
  default: ({ data }: { data: any }) => <script type="application/ld+json" data-testid="structured-data">{JSON.stringify(data)}</script>,
}));

// Mock utils
jest.mock('@/lib/utils', () => ({
  getLogoUrl: jest.fn((logo) => logo ? `/images/${logo}` : null),
  capitalizeWords: jest.fn((str) => str.charAt(0).toUpperCase() + str.slice(1)),
}));

describe('Company Page', () => {
  const mockCompany = {
    slug: 'test-company',
    name: 'test company',
    logo: 'logo.png',
    problemCount: 10,
    website: 'https://example.com',
    commonTags: [{ tag: 'tag1' }, { tag: 'tag2' }],
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('generateMetadata', () => {
    it('should return correct metadata for a valid company', async () => {
      (getCompanyBySlug as jest.Mock).mockResolvedValue(mockCompany);
      const params = Promise.resolve({ companySlug: 'test-company' });
      
      const metadata = await generateMetadata({ params });

      expect(metadata.title).toContain('Test company Interview Questions');
      expect(metadata.description).toContain('Test company');
      expect(metadata.openGraph?.title).toContain('Test company');
      expect(metadata.keywords).toContain('test company');
      expect(metadata.keywords).toContain('tag1');
    });

    it('should return "Not Found" metadata for an invalid company', async () => {
      (getCompanyBySlug as jest.Mock).mockResolvedValue(null);
      const params = Promise.resolve({ companySlug: 'invalid-company' });

      const metadata = await generateMetadata({ params });

      expect(metadata.title).toBe('Company Not Found');
      expect(metadata.robots).toEqual({ index: false, follow: false });
    });
  });

  describe('generateStaticParams', () => {
    it('should return a list of company slugs', async () => {
      (getAllCompanySlugs as jest.Mock).mockResolvedValue(['company-1', 'company-2']);

      const params = await generateStaticParams();

      expect(params).toEqual([
        { companySlug: 'company-1' },
        { companySlug: 'company-2' },
      ]);
    });

    it('should return an empty array if fetching fails', async () => {
      (getAllCompanySlugs as jest.Mock).mockRejectedValue(new Error('Fetch error'));
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      const params = await generateStaticParams();

      expect(params).toEqual([]);
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
    
    it('should return an empty array if no slugs are found', async () => {
        (getAllCompanySlugs as jest.Mock).mockResolvedValue([]);
  
        const params = await generateStaticParams();
  
        expect(params).toEqual([]);
      });
  });

  describe('CompanyPageWrapper', () => {
    it('should render CompanyPage when company exists', async () => {
      (getCompanyBySlug as jest.Mock).mockResolvedValue(mockCompany);
      const params = Promise.resolve({ companySlug: 'test-company' });

      const ui = await CompanyPageWrapper({ params });
      render(ui);

      expect(screen.getByTestId('company-page')).toHaveTextContent('test company');
      expect(screen.getByTestId('structured-data')).toBeInTheDocument();
    });

    it('should render CompanyNotFound when company does not exist', async () => {
      (getCompanyBySlug as jest.Mock).mockResolvedValue(null);
      const params = Promise.resolve({ companySlug: 'invalid-company' });

      const ui = await CompanyPageWrapper({ params });
      render(ui);

      expect(screen.getByTestId('company-not-found')).toHaveTextContent('invalid-company');
      expect(screen.queryByTestId('company-page')).not.toBeInTheDocument();
    });
  });
});
