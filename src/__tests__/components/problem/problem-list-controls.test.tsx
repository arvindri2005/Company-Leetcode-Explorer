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
    problemCount: 10,
    showStatusFilter: true,
  };

  it('should render problem count', () => {
    render(<ProblemListControls {...defaultProps} />);
    expect(screen.getByText('10 Problems')).toBeInTheDocument();
  });
});
