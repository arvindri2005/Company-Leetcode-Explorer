import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Header from './header';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';
import { useRouter, usePathname } from 'next/navigation';
import { signOut } from 'firebase/auth';

// Mock dependencies
jest.mock('@/contexts/auth-context');
jest.mock('@/hooks/use-toast');
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  usePathname: jest.fn(),
}));
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => <img {...props} />,
}));
jest.mock('firebase/auth', () => ({
  signOut: jest.fn(),
}));
jest.mock('@/lib/firebase', () => ({
  auth: {},
}));

// Mock Navigation Registry to avoid empty lists
jest.mock('@/lib/navigation-registry', () => ({
  navigationRegistry: {
    getItems: jest.fn((section) => {
      if (section === 'auth') return [];
      return [{ key: 'home', label: 'Home', href: '/' }];
    }),
  },
}));

describe('Header Component', () => {
  const mockUser = { uid: '123', email: 'test@example.com' };
  const mockToast = jest.fn();
  const mockPush = jest.fn();

  beforeEach(() => {
    (useAuth as jest.Mock).mockReturnValue({ user: mockUser, loading: false });
    (useToast as jest.Mock).mockReturnValue({ toast: mockToast });
    (useRouter as jest.Mock).mockReturnValue({ push: mockPush });
    (usePathname as jest.Mock).mockReturnValue('/');
    jest.clearAllMocks();
  });

  it('renders Logout button when user is logged in', () => {
    render(<Header />);
    const logoutButton = screen.getByRole('button', { name: /logout/i });
    expect(logoutButton).toBeInTheDocument();
  });

  it('renders mobile menu button with accessible label', () => {
    render(<Header />);
    const menuButton = screen.getByRole('button', { name: /open menu/i });
    expect(menuButton).toBeInTheDocument();
  });

  it('shows loading state on Logout button when clicked', async () => {
    let resolveSignOut: (value: void) => void;
    (signOut as jest.Mock).mockImplementation(() => new Promise((resolve) => { resolveSignOut = resolve; }));

    render(<Header />);

    const logoutButton = screen.getByRole('button', { name: /logout/i });
    fireEvent.click(logoutButton);

    // Wait for the button to show loading state
    await waitFor(() => {
        expect(logoutButton).toHaveAttribute('aria-busy', 'true');
    });
    expect(logoutButton).toBeDisabled();

    // Finish the sign out
    if (resolveSignOut!) resolveSignOut();

    await waitFor(() => {
        expect(signOut).toHaveBeenCalled();
    });
  });
});
