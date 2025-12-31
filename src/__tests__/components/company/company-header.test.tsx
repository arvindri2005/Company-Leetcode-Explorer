import { render, screen } from '@testing-library/react';
import CompanyHeader from '@/components/company/company-header';

// Mock next/image
jest.mock('next/image', () => ({
  __esModule: true,
  default: ({ fill, unoptimized,...props }: any) => <img {...props} />,
}));

// Mock utils
jest.mock('@/lib/utils', () => ({
  getLogoUrl: jest.fn((logo) => logo ? `/images/${logo}` : null),
}));

// Mock Breadcrumb components
jest.mock('@/components/ui/breadcrumb', () => ({
  Breadcrumb: ({ children }: { children: React.ReactNode }) => <nav>{children}</nav>,
  BreadcrumbList: ({ children }: { children: React.ReactNode }) => <ol>{children}</ol>,
  BreadcrumbItem: ({ children }: { children: React.ReactNode }) => <li>{children}</li>,
  BreadcrumbLink: ({ children, asChild, ...props }: any) => {
    if (asChild) return <>{children}</>;
    return <a {...props}>{children}</a>;
  },
  BreadcrumbPage: ({ children }: { children: React.ReactNode }) => <span aria-current="page">{children}</span>,
  BreadcrumbSeparator: () => <span aria-hidden="true">/</span>,
}));

describe('CompanyHeader', () => {
  const mockCompany = {
    id: '1',
    slug: 'test-company',
    name: 'Test Company',
    logo: 'logo.png',
    problemCount: 10,
    website: 'https://example.com',
    description: 'A test company description.',
    commonTags: [],
    relatedCompanies: [],
  };

  it('should render company name, logo, and description', () => {
    render(<CompanyHeader company={mockCompany} />);

    expect(screen.getByRole('heading', { name: 'Test Company' })).toBeInTheDocument();
    expect(screen.getByText('A test company description.')).toBeInTheDocument();
    expect(screen.getByAltText('Test Company Logo')).toBeInTheDocument();
  });

  it('should render website link if provided', () => {
    render(<CompanyHeader company={mockCompany} />);

    const link = screen.getByText('https://example.com');
    expect(link).toBeInTheDocument();
    expect(link.closest('a')).toHaveAttribute('href', 'https://example.com');
  });

  it('should render fallback icon if no logo is provided', () => {
    const companyWithoutLogo = { ...mockCompany, logo: undefined };
    render(<CompanyHeader company={companyWithoutLogo} />);

    expect(screen.queryByAltText('Test Company Logo')).not.toBeInTheDocument();
    // Check for the fallback container or icon logic if possible, 
    // but since Lucide icons render as SVGs, we can check for the container class
    // or just ensure no image is rendered.
  });
});
