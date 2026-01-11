import { render, screen } from '@testing-library/react';

import { createMockCompany } from '@/__tests__/factories/data-factories';
import CompanyProblemStats from '@/features/companies/components/company-problem-stats';

// Mock Recharts
jest.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: any) => <div>{children}</div>,
  BarChart: ({ children }: any) => <div>{children}</div>,
  Bar: () => <div>Bar</div>,
  XAxis: () => <div>XAxis</div>,
  YAxis: () => <div>YAxis</div>,
  Tooltip: () => <div>Tooltip</div>,
  Cell: () => <div>Cell</div>,
}));

// Mock Lucide Icons
jest.mock('lucide-react', () => ({
  ListChecks: () => <div data-testid="list-checks-icon" />,
  CalendarClock: () => <div data-testid="calendar-clock-icon" />,
  TagsIcon: () => <div data-testid="tags-icon" />,
}));

// Mock TagBadge
jest.mock('@/features/problems', () => ({
  TagBadge: ({ tag }: { tag: string }) => <div data-testid="tag-badge">{tag}</div>,
}));

describe('CompanyProblemStats', () => {
  const mockCompany = createMockCompany({
    id: '1',
    name: 'Test Company',
    statsLastUpdatedAt: new Date(),
    difficultyCounts: {
      Easy: 5,
      Medium: 3,
      Hard: 2,
    },
    recencyCounts: {
      last_30_days: 1,
      within_3_months: 2,
      within_6_months: 3,
      older_than_6_months: 4,
    },
    commonTags: [
      { tag: 'Array', count: 5 },
      { tag: 'String', count: 3 },
    ],
  });

  it('should render problem statistics when data is available', () => {
    render(<CompanyProblemStats company={mockCompany} />);

    expect(screen.getByText('Problem Statistics')).toBeInTheDocument();
    expect(screen.getByText('Difficulty Distribution')).toBeInTheDocument();
    expect(screen.getByText('Recency Distribution')).toBeInTheDocument();
    expect(screen.getByText('Most Common Tags')).toBeInTheDocument();
  });

  it('should render common tags', () => {
    render(<CompanyProblemStats company={mockCompany} />);

    expect(screen.getByText('Array (5)')).toBeInTheDocument();
    expect(screen.getByText('String (3)')).toBeInTheDocument();
  });

  it('should return null if stats are missing', () => {
    const companyWithoutStats = createMockCompany({
      ...mockCompany,
      statsLastUpdatedAt: undefined,
    });
    const { container } = render(<CompanyProblemStats company={companyWithoutStats} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('should return null if difficulty counts are missing', () => {
    const companyWithoutDifficulty = createMockCompany({
      ...mockCompany,
      difficultyCounts: undefined,
    });
    // @ts-ignore
    const { container } = render(<CompanyProblemStats company={companyWithoutDifficulty} />);
    expect(container).toBeEmptyDOMElement();
  });
});






