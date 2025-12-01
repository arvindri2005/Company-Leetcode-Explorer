import { render, screen } from '@testing-library/react';
import DifficultyBadge from '@/components/problem/difficulty-badge';

describe('DifficultyBadge', () => {
  it('should render Easy badge', () => {
    render(<DifficultyBadge difficulty="Easy" />);
    expect(screen.getByText('Easy')).toBeInTheDocument();
  });

  it('should render Medium badge', () => {
    render(<DifficultyBadge difficulty="Medium" />);
    expect(screen.getByText('Medium')).toBeInTheDocument();
  });

  it('should render Hard badge', () => {
    render(<DifficultyBadge difficulty="Hard" />);
    expect(screen.getByText('Hard')).toBeInTheDocument();
  });
});
