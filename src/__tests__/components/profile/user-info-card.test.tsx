import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import UserInfoCard from '@/components/profile/user-info-card';
import { FormProvider, useForm } from 'react-hook-form';
import { createMockUser } from '@/__tests__/factories/data-factories';

// Mock dependencies
jest.mock('lucide-react', () => ({
  Mail: () => <span data-testid="mail-icon" />,
  CalendarDays: () => <span data-testid="calendar-icon" />,
  Loader2: () => <span data-testid="loader-icon" />,
  Edit: () => <span data-testid="edit-icon" />,
  Save: () => <span data-testid="save-icon" />,
  X: () => <span data-testid="x-icon" />,
  LogOut: () => <span data-testid="logout-icon" />,
  CheckCircle2: () => <span data-testid="check-circle-icon" />,
}));

const mockUser = createMockUser({
  displayName: 'Test User',
  email: 'test@example.com',
  metadata: {
    creationTime: '2023-01-01T00:00:00Z',
    lastSignInTime: '2023-01-02T00:00:00Z',
  },
});

// Wrapper component to provide Form Context
const Wrapper = ({ children }: { children: React.ReactNode }) => {
  const methods = useForm({
    defaultValues: {
      displayName: 'Test User'
    }
  });
  return <FormProvider {...methods}>{children}</FormProvider>;
};

describe('UserInfoCard', () => {
  const mockProps = {
    user: mockUser as any,
    isEditingDisplayName: false,
    setIsEditingDisplayName: jest.fn(),
    onSubmitDisplayName: jest.fn(),
    isSubmittingDisplayName: false,
    handleLogout: jest.fn(),
    getInitials: (name: string | null | undefined) => 'TU',
  };

  it('renders user information correctly', () => {
    render(
      <Wrapper>
        <UserInfoCard {...mockProps} />
      </Wrapper>
    );

    // Check display name
    expect(screen.getByText('Test User')).toBeInTheDocument();
    
    // Check email
    expect(screen.getByText('test@example.com')).toBeInTheDocument();
    
    // Check verified badge
    expect(screen.getByText('Verified')).toBeInTheDocument();
    
    // Check member since
    expect(screen.getByText(/Member since January 2023/)).toBeInTheDocument();
    
    // Check logout button (it might be rendered multiple times for mobile/desktop, checking for at least one)
    const logoutButtons = screen.getAllByText('Log Out');
    expect(logoutButtons.length).toBeGreaterThan(0);
  });

  it('renders edit mode correctly', () => {
    const editProps = { ...mockProps, isEditingDisplayName: true };
    render(
      <Wrapper>
        <UserInfoCard {...editProps} />
      </Wrapper>
    );

    // Check input field
    expect(screen.getByPlaceholderText('Enter display name')).toBeInTheDocument();
    
    // Check save and cancel buttons
    expect(screen.getByText('Save')).toBeInTheDocument();
    expect(screen.getByText('Cancel')).toBeInTheDocument();
  });

  it('calls handleLogout when logout button is clicked', () => {
    render(
      <Wrapper>
        <UserInfoCard {...mockProps} />
      </Wrapper>
    );

    // Get the first logout button (desktop one usually, or just any)
    const logoutButtons = screen.getAllByText('Log Out');
    fireEvent.click(logoutButtons[0]);
    expect(mockProps.handleLogout).toHaveBeenCalled();
  });

  it('calls setIsEditingDisplayName when edit button is clicked', () => {
    render(
      <Wrapper>
        <UserInfoCard {...mockProps} />
      </Wrapper>
    );

    fireEvent.click(screen.getByLabelText('Edit display name'));
    expect(mockProps.setIsEditingDisplayName).toHaveBeenCalledWith(true);
  });
});
