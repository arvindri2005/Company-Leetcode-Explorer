import { render, screen } from '@testing-library/react';

import { createMockCompany, createMockProblem,createMockProblemsResponse } from '@/__tests__/factories/data-factories';
import CompanyPageWrapper, { generateMetadata, generateStaticParams } from '@/app/company/[companySlug]/page';
import { getAllCompanySlugs, getCompanyBySlug } from '@/features/companies/services/company.service';
import { getProblemsByCompanySlug } from '@/features/problems/services/problem.service';
import { failure,success } from '@/shared/types/result';

// Mock the services
jest.mock('@/features/companies/services/company.service', () => ({
  __esModule: true,
  getCompanyBySlug: jest.fn(),
  getAllCompanySlugs: jest.fn(),
  companyService: {
    getCompanyBySlug: jest.fn(),
    getAllCompanySlugs: jest.fn(),
  },
}));

jest.mock('@/features/problems/services/problem.service', () => ({
  __esModule: true,
  getProblemsByCompanySlug: jest.fn(),
  problemService: {
    getProblemsByCompanySlug: jest.fn(),
  },
}));

// Mock Next.js navigation
const mockNotFound = jest.fn();
jest.mock('next/navigation', () => ({
  ...jest.requireActual('next/navigation'),
  notFound: () => {
    mockNotFound();
    throw new Error('NEXT_NOT_FOUND');
  },
}));

// Mock child components
jest.mock('@/features/companies/components/page/company-not-found', () => ({
  __esModule: true,
  default: ({ companySlug }: { companySlug: string }) => <div data-testid="company-not-found">{companySlug}</div>,
}));

jest.mock('@/features/companies/components/page/company-page', () => ({
  __esModule: true,
  default: ({ company }: { company: any }) => <div data-testid="company-page">{company.name}</div>,
}));

jest.mock('@/components/seo/structured-data', () => ({
  __esModule: true,
  default: ({ data }: { data: any }) => <script type="application/ld+json" data-testid="structured-data" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />,
}));

// Mock utils
jest.mock('@/lib/utils', () => ({
  getLogoUrl: jest.fn((logo) => logo ? `/images/${logo}` : null),
  capitalizeWords: jest.fn((str) => str.charAt(0).toUpperCase() + str.slice(1)),
}));

describe('Company Page', () => {
  const mockCompany = createMockCompany({
    slug: 'test-company',
    name: 'test company',
    logo: 'logo.png',
    problemCount: 10,
    website: 'https://example.com',
    commonTags: [{ tag: 'tag1', count: 10 }, { tag: 'tag2', count: 5 }],
  });

  const mockProblemsResponse = createMockProblemsResponse({
    problems: [
      createMockProblem({ id: '1', title: 'Problem 1' }),
      createMockProblem({ id: '2', title: 'Problem 2' }),
    ],
    totalProblems: 2,
    hasMore: false,
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('generateMetadata', () => {
    it('should return correct metadata for a valid company', async () => {
      (getCompanyBySlug as jest.Mock).mockResolvedValue(success(mockCompany));
      const params = Promise.resolve({ companySlug: 'test-company' });
      
      const metadata = await generateMetadata({ params });

      expect(metadata.title).toContain('Test company Interview Questions');
      expect(metadata.description).toContain('Test company');
      expect(metadata.openGraph?.title).toContain('Test company');
      expect(metadata.keywords).toContain('test company');
      expect(metadata.keywords).toContain('tag1');
    });

    it('should return "Not Found" metadata for an invalid company', async () => {
      (getCompanyBySlug as jest.Mock).mockResolvedValue(failure({ code: 'NOT_FOUND', message: 'Company not found' }));
      const params = Promise.resolve({ companySlug: 'invalid-company' });

      const metadata = await generateMetadata({ params });

      expect(metadata.title).toBe('Company Not Found');
      expect(metadata.robots).toEqual({ index: false, follow: false });
    });
  });

  describe('generateStaticParams', () => {
    it('should return a list of company slugs', async () => {
      (getAllCompanySlugs as jest.Mock).mockResolvedValue(success(['company-1', 'company-2']));

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
        (getAllCompanySlugs as jest.Mock).mockResolvedValue(success([]));
  
        const params = await generateStaticParams();
  
        expect(params).toEqual([]);
      });
  });

  describe('CompanyPageWrapper', () => {
    it('should render CompanyPage when company exists', async () => {
      (getCompanyBySlug as jest.Mock).mockResolvedValue(success(mockCompany));
      (getProblemsByCompanySlug as jest.Mock).mockResolvedValue(success(mockProblemsResponse));
      const params = Promise.resolve({ companySlug: 'test-company' });

      const ui = await CompanyPageWrapper({ params });
      render(ui);

      expect(screen.getByTestId('company-page')).toHaveTextContent('test company');
      expect(screen.getByTestId('structured-data')).toBeInTheDocument();
      expect(getCompanyBySlug).toHaveBeenCalledWith('test-company');
      expect(getProblemsByCompanySlug).toHaveBeenCalledWith('test-company', { pageSize: 40 });
    });

    it('should call notFound when company does not exist', async () => {
      (getCompanyBySlug as jest.Mock).mockResolvedValue(failure({ code: 'NOT_FOUND', message: 'Company not found' }));
      // Even if company is null, we might still call getProblems due to Promise.all, or handle it gracefully.
      // In the implementation, we do Promise.all, so both are called.
      (getProblemsByCompanySlug as jest.Mock).mockResolvedValue(success({ problems: [], totalProblems: 0 }));
      
      const params = Promise.resolve({ companySlug: 'invalid-company' });

      await expect(CompanyPageWrapper({ params })).rejects.toThrow('NEXT_NOT_FOUND');
      expect(mockNotFound).toHaveBeenCalled();
    });
  });
});
