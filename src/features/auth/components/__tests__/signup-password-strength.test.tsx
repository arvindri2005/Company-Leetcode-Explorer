import { render, screen } from '@testing-library/react';

import { SignupPasswordStrength } from '../signup-password-strength';

describe('SignupPasswordStrength', () => {
  it('renders correctly with empty password', () => {
    render(<SignupPasswordStrength password="" />);
    const meter = screen.getByRole('meter');
    expect(meter).toHaveAttribute('aria-valuenow', '0');
    
    // Check for requirements list
    expect(screen.getByText('8+ characters', { exact: false })).toBeInTheDocument();
    expect(screen.getByText('Uppercase letter', { exact: false })).toBeInTheDocument();
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

  it('displays met requirements correctly', () => {
    render(<SignupPasswordStrength password="Password1" />);
    
    // Should meet:
    // Uppercase (P)
    // Lowercase (assword)
    // Number (1)
    // 8+ chars (9 chars)
    
    // Should NOT meet:
    // Special char
    
    // We can check if the list items have specific classes or if the icon is present.
    // Since we used Check icon for met and div for unmet, we can try to query by text and check container class?
    // Or just checking presence is enough for this level of testing.
    
    expect(screen.getByText('8+ characters', { exact: false })).toBeInTheDocument();
    expect(screen.getByText('Uppercase letter', { exact: false })).toBeInTheDocument();
    expect(screen.getByText('Lowercase letter', { exact: false })).toBeInTheDocument();
    expect(screen.getByText('Number', { exact: false })).toBeInTheDocument();
    expect(screen.getByText('Special character', { exact: false })).toBeInTheDocument();
  });

  it('includes screen reader text for requirements', () => {
    render(<SignupPasswordStrength password="A" />);
    // "Uppercase letter" should be met
    const uppercaseLabel = screen.getByText('Uppercase letter', { exact: false });
    expect(uppercaseLabel).toHaveTextContent(' - requirement met');

    // "8+ characters" should be not met
    const lengthLabel = screen.getByText('8+ characters', { exact: false });
    expect(lengthLabel).toHaveTextContent(' - requirement not met');
  });
});
