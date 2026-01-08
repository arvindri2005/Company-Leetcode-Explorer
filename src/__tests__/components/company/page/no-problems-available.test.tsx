import { render, screen } from '@testing-library/react';
import NoProblemsAvailable from '@/features/companies/components/page/no-problems-available';

describe('NoProblemsAvailable', () => {
  const mockProps = {
    companyName: 'Test Company',
    companyId: '123',
  };

  it('should render the company name in the heading and message', () => {
    render(<NoProblemsAvailable {...mockProps} />);

    expect(screen.getByText('No Problems Available for Test Company')).toBeInTheDocument();
    expect(
      screen.getByText("We don't have coding problems for Test Company yet. You can help by adding some!")
    ).toBeInTheDocument();
  });

  it('should render a link to browse companies', () => {
    render(<NoProblemsAvailable {...mockProps} />);

    const browseLink = screen.getByRole('link', { name: /browse companies/i });
    expect(browseLink).toHaveAttribute('href', '/companies');
  });

  it('should render a link to add a problem with correct query params', () => {
    render(<NoProblemsAvailable {...mockProps} />);

    const addProblemLink = screen.getByRole('link', { name: /add problem/i });
    expect(addProblemLink).toHaveAttribute(
      'href',
      '/submit-problem?companyId=123&companyName=Test%20Company'
    );
  });
});
