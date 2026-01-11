import { render, screen } from '@testing-library/react';

import { ContactForm } from './contact-form';

// Just mock things to avoid errors, we can't easily run real tests in this environment
jest.mock('react-dom', () => ({
  ...jest.requireActual('react-dom'),
  useFormStatus: () => ({ pending: false }),
  useFormState: () => [null, jest.fn()],
}));

jest.mock('@/app/actions/contact.actions', () => ({
  sendContactMessage: jest.fn(),
}));

jest.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: jest.fn() }),
}));

// Mock useOnlineStatus
jest.mock('@/hooks/use-online-status', () => ({
  useOnlineStatus: jest.fn(),
}));

import { useOnlineStatus } from '@/hooks/use-online-status';

describe('ContactForm', () => {
  it('renders inputs with correct attributes', () => {
    (useOnlineStatus as jest.Mock).mockReturnValue(true);
    render(<ContactForm />);
    
    const nameInput = screen.getByLabelText('Name');
    expect(nameInput).toHaveAttribute('autoComplete', 'name');
    expect(nameInput).toBeRequired();
    
    const emailInput = screen.getByLabelText('Email');
    expect(emailInput).toHaveAttribute('autoComplete', 'email');
    expect(emailInput).toHaveAttribute('inputMode', 'email');
    expect(emailInput).toBeRequired();
    
    const messageInput = screen.getByLabelText('Message');
    expect(messageInput).toBeRequired();
  });

  it('renders "Send Message" when online', () => {
    (useOnlineStatus as jest.Mock).mockReturnValue(true);
    render(<ContactForm />);
    
    const button = screen.getByRole('button', { name: /send message/i });
    expect(button).toBeEnabled();
  });

  it('renders "You are offline" and disabled when offline', () => {
    (useOnlineStatus as jest.Mock).mockReturnValue(false);
    render(<ContactForm />);
    
    const button = screen.getByRole('button', { name: /you are offline/i });
    expect(button).toBeDisabled();
  });
});






