import { render, screen } from '@testing-library/react';

import { createMockCompany } from '@/__tests__/factories/data-factories';
import CompanyHeader from '@/features/companies/components/company-header';

// Mock next/image
jest.mock('next/image', () => ({
  __esModule: true,
  // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
  default: ({ ...props }: React.ImgHTMLAttributes<HTMLImageElement>) => <img {...props} />,
}));

// Mock utils
// Mock utils
jest.mock('@/lib/utils', () => {
  const actual = jest.requireActual('@/lib/utils');
  return {
    ...actual,
    getLogoUrl: jest.fn((logo) => logo ? `/images/${logo}` : null),
  };
});

// Mock Breadcrumb components
jest.mock('@/components/ui/breadcrumb', () => ({
  Breadcrumb: ({ children }: { children: React.ReactNode }) => <nav>{children}</nav>,
  BreadcrumbList: ({ children }: { children: React.ReactNode }) => <ol>{children}</ol>,
  BreadcrumbItem: ({ children }: { children: React.ReactNode }) => <li>{children}</li>,
  BreadcrumbLink: ({ children, asChild, ...props }: any) => {
    if (asChild) {return <>{children}</>;}
    return <a {...props}>{children}</a>;
  },
  BreadcrumbPage: ({ children }: { children: React.ReactNode }) => <span aria-current="page">{children}</span>,
  BreadcrumbSeparator: () => <span aria-hidden="true">/</span>,
}));

describe('CompanyHeader', () => {
  const mockCompany = createMockCompany({
    name: 'Test Company',
    logo: 'logo.png',
    website: 'https://example.com',
    description: 'A test company description.',
  });

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

  it('should render default image if no logo is provided', () => {
    const companyWithoutLogo = createMockCompany({
      ...mockCompany,
      logo: undefined,
    });
    render(<CompanyHeader company={companyWithoutLogo} />);

    // Expect the default image (fallbackSrc) to be rendered
    const img = screen.getByAltText('Test Company Logo');
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', '/icon.png');
  });
});






