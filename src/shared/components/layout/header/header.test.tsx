import { usePathname, useRouter } from 'next/navigation';

import { render, screen } from '@testing-library/react';

import { useAuth } from '@/providers';

import Header from './header';

// Mocks
jest.mock('@/providers');
jest.mock('next/navigation', () => ({
  usePathname: jest.fn(),
  useRouter: jest.fn(),
}));
jest.mock('@/shared/lib/config/navigation', () => ({
  navigationRegistry: {
    getItems: jest.fn(() => []),
  },
}));
jest.mock('@/shared/hooks/use-toast', () => ({
  useToast: () => ({ toast: jest.fn() }),
}));

describe('Header Accessibility', () => {
  beforeEach(() => {
    (useAuth as jest.Mock).mockReturnValue({ user: null, loading: false });
    (usePathname as jest.Mock).mockReturnValue('/');
    (useRouter as jest.Mock).mockReturnValue({ push: jest.fn() });
  });

  it('renders mobile menu button with accessible label', () => {
    render(<Header />);
    // This should fail initially because the button lacks aria-label
    const menuButton = screen.getByRole('button', { name: /open menu/i }); 
    expect(menuButton).toBeInTheDocument();
  });
});






