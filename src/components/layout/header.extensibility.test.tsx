import React from 'react';
import { render, screen } from '@testing-library/react';
import Header from './header';
import { navigationRegistry } from '@/lib/navigation-registry';
import { useAuth } from '@/contexts/auth-context';
import { usePathname } from 'next/navigation';

// Mock dependencies
jest.mock('@/contexts/auth-context');
jest.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: jest.fn() }),
}));
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn() }),
  usePathname: jest.fn(),
}));
jest.mock('next/image', () => ({
    __esModule: true,
    default: (props: any) => <img {...props} />,
}));

// Mock Sheet component parts to render children directly
jest.mock('@/components/ui/sheet', () => ({
  Sheet: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SheetContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SheetTrigger: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SheetHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SheetTitle: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SheetDescription: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

describe('Header Extensibility', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useAuth as jest.Mock).mockReturnValue({
      user: null,
      loading: false,
    });
    (usePathname as jest.Mock).mockReturnValue('/');

    // Clear existing items and re-register defaults + our test item
    // Accessing private property for testing purposes via cast
    (navigationRegistry as any).items = [];
  });

  it('renders a custom component registered via the render prop', () => {
    // Register a custom item with a render function
    navigationRegistry.register({
      key: 'custom-badge',
      label: 'Badge',
      position: 'main',
      render: ({ isMobile }) => (
        <div data-testid={`custom-badge-${isMobile ? 'mobile' : 'desktop'}`} className={isMobile ? 'mobile-badge' : 'desktop-badge'}>
          Custom Badge
        </div>
      ),
    });

    render(<Header />);

    // Check if the custom component is rendered (Desktop version should be visible as mobile menu is closed)
    // However, Header renders both but controls visibility via CSS (hidden md:flex).
    // Testing Library sees both in the DOM.
    // We can select the one we expect to be "active" or check that both exist.

    const desktopBadge = screen.getByTestId('custom-badge-desktop');
    expect(desktopBadge).toBeInTheDocument();
    expect(desktopBadge).toHaveTextContent('Custom Badge');
    expect(desktopBadge).toHaveClass('desktop-badge');

    const mobileBadge = screen.getByTestId('custom-badge-mobile');
    expect(mobileBadge).toBeInTheDocument();
  });

  it('passes the correct context to the render function', () => {
    const mockUser = { uid: '123' };
    (useAuth as jest.Mock).mockReturnValue({
      user: mockUser,
      loading: false,
    });

    let contextSpy: any = {};

    navigationRegistry.register({
      key: 'context-spy',
      label: 'Spy',
      position: 'main',
      // We only care about desktop render for this test to avoid double execution confusion
      render: (context) => {
        if (!context.isMobile) {
            contextSpy = context;
        }
        return <div data-testid="spy" />;
      },
    });

    render(<Header />);

    expect(contextSpy).toEqual({
      user: mockUser,
      isLoading: false,
      isMobile: false, // We captured the desktop render
    });
  });
});
