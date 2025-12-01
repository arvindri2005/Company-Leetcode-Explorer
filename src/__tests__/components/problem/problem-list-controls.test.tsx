import { render, screen, fireEvent } from '@testing-library/react';
import ProblemListControls from '@/components/problem/problem-list-controls';

describe('ProblemListControls', () => {
  const defaultProps = {
    difficultyFilter: [],
    onDifficultyFilterChange: jest.fn(),
    sortKey: 'title' as const,
    onSortKeyChange: jest.fn(),
    lastAskedFilter: [],
    onLastAskedFilterChange: jest.fn(),
    statusFilter: [],
    onStatusFilterChange: jest.fn(),
    searchTerm: '',
    onSearchTermChange: jest.fn(),
    problemCount: 10,
    showStatusFilter: true,
  };

  it('should render search input', () => {
    render(<ProblemListControls {...defaultProps} />);
    const input = screen.getByPlaceholderText('Search problems...');
    expect(input).toBeInTheDocument();
  });

  it('should call onSearchTermChange when typing', () => {
    render(<ProblemListControls {...defaultProps} />);
    const input = screen.getByPlaceholderText('Search problems...');
    fireEvent.change(input, { target: { value: 'test' } });
    expect(defaultProps.onSearchTermChange).toHaveBeenCalledWith('test');
  });

  it('should render problem count', () => {
    render(<ProblemListControls {...defaultProps} />);
    expect(screen.getByText('10 Problems')).toBeInTheDocument();
  });
});
