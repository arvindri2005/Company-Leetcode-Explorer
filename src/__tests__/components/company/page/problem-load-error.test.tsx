import { render, screen, fireEvent } from '@testing-library/react';
import ProblemLoadError from '@/features/companies/components/page/problem-load-error';
import { reloadPage } from '@/lib/utils';

// Mock utils
jest.mock('@/lib/utils', () => ({
  ...jest.requireActual('@/lib/utils'),
  reloadPage: jest.fn(),
}));

describe('ProblemLoadError', () => {
  const defaultProps = {
    companyName: 'Test Company',
    error: 'Network Error',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render error message', () => {
    render(<ProblemLoadError {...defaultProps} />);
    expect(screen.getByText('Failed to Load Problems')).toBeInTheDocument();
    expect(screen.getByText(/Test Company/)).toBeInTheDocument();
    expect(screen.getByText(/Network Error/)).toBeInTheDocument();
  });

  it('should call reloadPage when "Try Refreshing" button is clicked', () => {
    render(<ProblemLoadError {...defaultProps} />);
    const button = screen.getByRole('button', { name: /Try Refreshing/i });
    
    fireEvent.click(button);
    expect(reloadPage).toHaveBeenCalled();
  });
});
