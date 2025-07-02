import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeSwitcher } from '../theme-switcher';
import userEvent from '@testing-library/user-event';

const mockSetTheme = jest.fn();
const mockUseTheme = jest.fn();

jest.mock('lucide-react', () => ({
  Moon: () => <svg data-testid="moon-icon" />,
  Sun: () => <svg data-testid="sun-icon" />,
  Monitor: () => <svg data-testid="monitor-icon" />
}));

jest.mock('next-themes', () => ({
  useTheme: () => mockUseTheme()
}));

describe('ThemeSwitcher', () => {
  beforeEach(() => {
    mockSetTheme.mockClear();
    mockUseTheme.mockClear();
  });

  // Test for desktop view
  describe('Desktop View', () => {
  

    it('changes theme to light when Light is clicked', async () => {
      mockUseTheme.mockReturnValue({ setTheme: mockSetTheme, resolvedTheme: 'dark' });
      render(<ThemeSwitcher />);
      await userEvent.click(screen.getByLabelText(/toggle theme/i));
      await userEvent.click(screen.getByText('Light'));
      expect(mockSetTheme).toHaveBeenCalledWith('light');
    });

    it('changes theme to dark when Dark is clicked', async () => {
      mockUseTheme.mockReturnValue({ setTheme: mockSetTheme, resolvedTheme: 'light' });
      render(<ThemeSwitcher />);
      await userEvent.click(screen.getByLabelText(/toggle theme/i));
      await userEvent.click(screen.getByText('Dark'));
      expect(mockSetTheme).toHaveBeenCalledWith('dark');
    });

    it('changes theme to system when System is clicked', async () => {
      mockUseTheme.mockReturnValue({ setTheme: mockSetTheme, resolvedTheme: 'light' });
      render(<ThemeSwitcher />);
      await userEvent.click(screen.getByLabelText(/toggle theme/i));
      await userEvent.click(screen.getByText('System'));
      expect(mockSetTheme).toHaveBeenCalledWith('system');
    });
  });

  // Test for mobile view
  describe('Mobile View', () => {
    beforeEach(() => {
      mockUseTheme.mockReturnValue({ setTheme: mockSetTheme, resolvedTheme: 'light' });
    });

    it('renders mobile theme buttons when isMobile is true', () => {
      render(<ThemeSwitcher isMobile />);
      expect(screen.getByText('Light')).toBeInTheDocument();
      expect(screen.getByText('Dark')).toBeInTheDocument();
      expect(screen.getByText('System')).toBeInTheDocument();
    });

    it('changes theme to light when Light button is clicked in mobile view', () => {
      render(<ThemeSwitcher isMobile />);
      fireEvent.click(screen.getByRole('button', { name: /light/i }));
      expect(mockSetTheme).toHaveBeenCalledWith('light');
    });

    it('changes theme to dark when Dark button is clicked in mobile view', () => {
      render(<ThemeSwitcher isMobile />);
      fireEvent.click(screen.getByRole('button', { name: /dark/i }));
      expect(mockSetTheme).toHaveBeenCalledWith('dark');
    });

    it('changes theme to system when System button is clicked in mobile view', () => {
      render(<ThemeSwitcher isMobile />);
      fireEvent.click(screen.getByRole('button', { name: /system/i }));
      expect(mockSetTheme).toHaveBeenCalledWith('system');
    });
  });
});
