import { render, screen } from '@testing-library/react';
import RelatedCompanies from '@/features/companies/components/related-companies';

describe('RelatedCompanies', () => {
  it('should render nothing if companies list is empty', () => {
    const { container } = render(<RelatedCompanies companies={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('should render a list of related companies', () => {
    const companies = ['Google', 'Facebook', 'Amazon'];
    render(<RelatedCompanies companies={companies} />);

    expect(screen.getByText('Related Companies')).toBeInTheDocument();
    expect(screen.getByText('Google')).toBeInTheDocument();
    expect(screen.getByText('Facebook')).toBeInTheDocument();
    expect(screen.getByText('Amazon')).toBeInTheDocument();
  });

  it('should render correct links for companies', () => {
    const companies = ['Google', 'Microsoft'];
    render(<RelatedCompanies companies={companies} />);

    const googleLink = screen.getByText('Google').closest('a');
    expect(googleLink).toHaveAttribute('href', '/company/google');

    const microsoftLink = screen.getByText('Microsoft').closest('a');
    expect(microsoftLink).toHaveAttribute('href', '/company/microsoft');
  });
});
