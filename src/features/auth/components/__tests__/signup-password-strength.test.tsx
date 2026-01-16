import { render, screen } from '@testing-library/react';

import { SignupPasswordStrength } from '../signup-password-strength';

describe('SignupPasswordStrength', () => {
  it('renders correctly with empty password', () => {
    render(<SignupPasswordStrength password="" />);
    const meter = screen.getByRole('meter');
    expect(meter).toHaveAttribute('aria-valuenow', '0');
  });

  it('calculates score for weak password', () => {
    // Length < 6
    render(<SignupPasswordStrength password="weak" />);
    const meter = screen.getByRole('meter');
    expect(meter).toHaveAttribute('aria-valuenow', '0');
  });
  
  it('calculates score for fair password', () => {
    // Length > 6 (1 point) + numbers (1 point) = 2
    render(<SignupPasswordStrength password="password1" />); 
    const meter = screen.getByRole('meter');
    expect(meter).toHaveAttribute('aria-valuenow', '2');
  });

   it('calculates score for strong password', () => {
      // Length > 6 (1 point) 
      // Length > 10 (1 point)
      // numbers (1 point)
      // special chars (1 point)
      // Total = 4
    render(<SignupPasswordStrength password="LongPassword1!" />); 
    const meter = screen.getByRole('meter');
    expect(meter).toHaveAttribute('aria-valuenow', '4');
  });
});
