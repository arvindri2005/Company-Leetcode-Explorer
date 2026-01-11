import { render, screen } from '@testing-library/react';

import { TagBadge } from '@/features/problems';

describe('TagBadge', () => {
  it('should render tag name', () => {
    render(<TagBadge tag="Array" />);
    expect(screen.getByText('Array')).toBeInTheDocument();
  });

  it('should apply custom className', () => {
    const { container } = render(<TagBadge tag="DP" className="custom-class" />);
    expect(container.firstChild).toHaveClass('custom-class');
  });
});






