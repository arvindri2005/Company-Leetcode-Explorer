import { render, screen } from '@testing-library/react';
import CompanyNotFound from '@/components/company/page/company-not-found';

describe('CompanyNotFound', () => {
  it('should render "Company Not Found" message', () => {
    render(<CompanyNotFound companySlug="invalid-slug" />);
    expect(screen.getByText('Company Not Found')).toBeInTheDocument();
    expect(screen.getByText(/invalid-slug/)).toBeInTheDocument();
  });

  it('should render a link back to the companies list', () => {
    render(<CompanyNotFound companySlug="invalid-slug" />);
    const link = screen.getByRole('link', { name: /Back to Companies/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/companies');
  });
});
