import React from 'react';
import { render, screen } from '@testing-library/react';
import TypingResults from './typing-results';

// Mock dependencies
jest.mock('canvas-confetti', () => jest.fn());
jest.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  LineChart: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Line: () => <div />,
  XAxis: () => <div />,
  YAxis: () => <div />,
  Tooltip: () => <div />,
  CartesianGrid: () => <div />,
}));

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

describe('TypingResults', () => {
  const defaultProps = {
    wpm: 60,
    accuracy: 95,
    mistakes: 2,
    wpmHistory: [{ time: 1, wpm: 50 }, { time: 2, wpm: 60 }],
    onNextSnippet: jest.fn(),
    onRetry: jest.fn(),
  };

  it('renders with correct design tokens', () => {
    render(<TypingResults {...defaultProps} />);

    // Check for standard classes instead of hardcoded white/10
    expect(screen.getByText('Complete!')).toBeInTheDocument();
    expect(screen.getByText('60')).toBeInTheDocument();

    // Verify the replacement of border-white/5 with border-border/50
    const wpmLabel = screen.getByText('WPM');
    // The parent of WPM label is the container with the border class
    const wpmContainer = wpmLabel.closest('.group');
    expect(wpmContainer).toHaveClass('border-border/50');
  });
});
