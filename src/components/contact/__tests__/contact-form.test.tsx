import { render, screen } from '@testing-library/react';
import { ContactForm } from '../contact-form';

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

describe('ContactForm', () => {
  it('renders inputs with correct attributes', () => {
    render(<ContactForm />);
    
    const nameInput = screen.getByLabelText('Name');
    expect(nameInput).toHaveAttribute('autoComplete', 'name');
    expect(nameInput).toBeRequired();
    
    const emailInput = screen.getByLabelText('Email');
    expect(emailInput).toHaveAttribute('autoComplete', 'email');
    expect(emailInput).toBeRequired();
    
    const messageInput = screen.getByLabelText('Message');
    expect(messageInput).toBeRequired();
  });
});
