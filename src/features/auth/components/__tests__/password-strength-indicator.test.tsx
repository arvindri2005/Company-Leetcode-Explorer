import { render, screen } from '@testing-library/react';

import { PasswordStrengthIndicator } from '../password-strength-indicator';

describe('PasswordStrengthIndicator', () => {
  it('renders with meter role and correct aria attributes', () => {
    render(<PasswordStrengthIndicator score={2} />);
    
    const meter = screen.getByRole('meter');
    expect(meter).toBeInTheDocument();
    expect(meter).toHaveAttribute('aria-valuenow', '2');
    expect(meter).toHaveAttribute('aria-valuemin', '0');
    expect(meter).toHaveAttribute('aria-valuemax', '4');
    expect(meter).toHaveAttribute('aria-label', 'Password strength');
    expect(meter).toHaveAttribute('aria-valuetext', 'Fair');
  });

  it('updates aria-valuenow and aria-valuetext based on score', () => {
    const { rerender } = render(<PasswordStrengthIndicator score={4} />);
    
    let meter = screen.getByRole('meter');
    expect(meter).toHaveAttribute('aria-valuenow', '4');
    expect(meter).toHaveAttribute('aria-valuetext', 'Strong');

    rerender(<PasswordStrengthIndicator score={0} />);
    meter = screen.getByRole('meter');
    expect(meter).toHaveAttribute('aria-valuenow', '0');
    expect(meter).toHaveAttribute('aria-valuetext', 'Enter password');
  });
});
