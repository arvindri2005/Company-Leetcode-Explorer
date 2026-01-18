import { render, screen } from "@testing-library/react";

import type { Company } from "@/features/companies/types";

import CompanyProblemStats from "../company-problem-stats";

// Mock Recharts components completely to avoid issues with JSDOM/ResizeObserver/ActualModule
jest.mock("recharts", () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
    <div className="recharts-responsive-container" style={{ width: 800, height: 800 }}>
      {children}
    </div>
  ),
  BarChart: ({ children }: { children: React.ReactNode }) => <div data-testid="bar-chart">{children}</div>,
  Bar: ({ children }: { children: React.ReactNode }) => <div data-testid="bar">{children}</div>,
  Cell: () => <div data-testid="cell" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  Tooltip: () => <div data-testid="tooltip" />,
}));

describe("CompanyProblemStats", () => {
  const mockCompany: Company = {
    id: "1",
    name: "Google",
    slug: "google",
    logo: "/google.png",
    problemCount: 100,
    difficultyCounts: { Easy: 30, Medium: 50, Hard: 20 },
    recencyCounts: {
      last_30_days: 10,
      within_3_months: 20,
      within_6_months: 30,
      older_than_6_months: 40,
    },
    commonTags: [{ tag: "DP", count: 50 }, { tag: "Arrays", count: 40 }],
    statsLastUpdatedAt: new Date("2023-01-01"),
  };

  it("renders correctly with valid company data", () => {
    render(<CompanyProblemStats company={mockCompany} />);
    
    expect(screen.getByText("Problem Statistics")).toBeInTheDocument();
    expect(screen.getByText("Difficulty Distribution")).toBeInTheDocument();
    expect(screen.getByText("Recency Distribution")).toBeInTheDocument();
    
    // Check tags
    expect(screen.getByText("DP (50)")).toBeInTheDocument();
    expect(screen.getByText("Arrays (40)")).toBeInTheDocument();
  });

  it("renders null if stats are missing", () => {
    const incompleteCompany = { ...mockCompany, difficultyCounts: undefined } as any;
    const { container } = render(<CompanyProblemStats company={incompleteCompany} />);
    
    expect(container).toBeEmptyDOMElement();
  });
});
