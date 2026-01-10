import { render, screen } from '@testing-library/react';
import FlashcardGenerator from '@/features/ai/components/flashcard-generator';

jest.mock('react-markdown', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

jest.mock('remark-gfm', () => ({
  __esModule: true,
  default: () => {},
}));

// Mock child components
jest.mock('@/components/ui/card', () => ({
  Card: ({ children }: any) => <div>{children}</div>,
  CardHeader: ({ children }: any) => <div>{children}</div>,
  CardTitle: ({ children }: any) => <div>{children}</div>,
  CardDescription: ({ children }: any) => <div>{children}</div>,
  CardContent: ({ children }: any) => <div>{children}</div>,
  CardFooter: ({ children }: any) => <div>{children}</div>,
}));

jest.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick }: any) => <button onClick={onClick}>{children}</button>,
}));

// Mock AI actions
jest.mock('@/app/actions', () => ({
  generateFlashcardsAction: jest.fn().mockResolvedValue({
    flashcards: [
      {
        front: 'Front 1',
        back: 'Back 1',
      },
    ],
  }),
}));

// Mock hooks
jest.mock('@/providers', () => ({
  useAuth: () => ({ user: { uid: '123' }, loading: false }),
}));

jest.mock('@/features/ai/hooks/use-ai-cooldown', () => ({
  useAICooldown: () => ({
    canUseAI: true,
    startCooldown: jest.fn(),
    formattedRemainingTime: '0s',
    isLoadingCooldown: false,
  }),
}));

jest.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: jest.fn() }),
}));

jest.mock('next/navigation', () => ({
  usePathname: () => '/test-path',
}));

describe('FlashcardGenerator', () => {
  const defaultProps = {
    companyId: '1',
    companyName: 'Test Company',
    companySlug: 'test-company',
  };

  it('should render initial state', () => {
    render(<FlashcardGenerator {...defaultProps} />);
    expect(screen.getByText(/AI-Powered Study Flashcards/i)).toBeInTheDocument();
  });
});






