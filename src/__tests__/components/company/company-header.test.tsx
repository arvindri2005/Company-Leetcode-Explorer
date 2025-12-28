import { render, screen } from '@testing-library/react';
import CompanyHeader from '@/components/company/company-header';
import { createMockCompany } from '@/__tests__/factories/data-factories';

// Mock next/image
jest.mock('next/image', () => ({
  __esModule: true,
  default: ({ fill, unoptimized,...props }: any) => <img {...props} />,
}));

// Mock utils
jest.mock('@/lib/utils', () => ({
  getLogoUrl: jest.fn((logo) => logo ? `/images/${logo}` : null),
}));

describe('CompanyHeader', () => {
  const mockCompany = createMockCompany({
    id: '1',
    slug: 'test-company',
    name: 'Test Company',
    logo: 'logo.png',
    description: 'A test company description.',
    website: 'https://example.com',
  });

  it('should render company name, logo, and description', () => {
    render(<CompanyHeader company={mockCompany} />);

    expect(screen.getByText('Test Company')).toBeInTheDocument();
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
    const companyWithoutLogo = createMockCompany({
      ...mockCompany,
      logo: undefined,
    });
    render(<CompanyHeader company={companyWithoutLogo} />);

    expect(screen.queryByAltText('Test Company Logo')).not.toBeInTheDocument();
    // Check for the fallback container or icon logic if possible, 
    // but since Lucide icons render as SVGs, we can check for the container class
    // or just ensure no image is rendered.
  });
});
