import { render, screen } from "@testing-library/react";

import { CompanyTable } from "@/features/companies/components/company-table";
import type { Company } from "@/features/companies/types";

// Mock Badge component
jest.mock("@/shared/components/ui/badge", () => ({
  Badge: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <span data-testid="badge" className={className}>
      {children}
    </span>
  ),
}));

// Mock OfflineImage
jest.mock("@/shared/components/ui/offline-image", () => ({
  // eslint-disable-next-line @next/next/no-img-element
  OfflineImage: ({ alt }: { alt: string }) => <img alt={alt} />,
}));

const mockCompanies: Company[] = [
  {
    id: "1",
    name: "TechCorp",
    slug: "tech-corp",
    problemCount: 10,
    commonTags: [
      { tag: "Arrays", count: 5 },
      { tag: "DP", count: 3 },
    ],
  },
  {
    id: "2",
    name: "StartupInc",
    slug: "startup-inc",
    problemCount: 5,
    commonTags: [], // Empty tags
  },
];

describe("CompanyTable", () => {
  it("renders company names", () => {
    render(<CompanyTable companies={mockCompanies} />);
    expect(screen.getByText("TechCorp")).toBeInTheDocument();
    expect(screen.getByText("StartupInc")).toBeInTheDocument();
  });

  it("renders tags as badges for companies with tags", () => {
    render(<CompanyTable companies={mockCompanies} />);
    const badges = screen.getAllByTestId("badge");
    // TechCorp has 2 tags, StartupInc has 0. But CompanyRow logic slices to 2.
    // Wait, StartupInc has empty tags, logic returns null.
    // TechCorp has 2 tags.
    // So we should see 2 badges: "Arrays" and "DP".
    expect(badges).toHaveLength(2);
    expect(screen.getByText("Arrays")).toBeInTheDocument();
    expect(screen.getByText("DP")).toBeInTheDocument();
  });

  it("renders accessible 'View Details' links", () => {
    render(<CompanyTable companies={mockCompanies} />);
    
    const link1 = screen.getByRole("link", { name: "View details for TechCorp" });
    expect(link1).toBeInTheDocument();
    expect(link1).toHaveAttribute("href", "/company/tech-corp");

    const link2 = screen.getByRole("link", { name: "View details for StartupInc" });
    expect(link2).toBeInTheDocument();
    expect(link2).toHaveAttribute("href", "/company/startup-inc");
  });

  it("renders clickable company identity links", () => {
    render(<CompanyTable companies={mockCompanies} />);
    
    // The identity link name is derived from image alt text + company name text
    // "TechCorp logo" + "TechCorp"
    const identityLink = screen.getByRole("link", { name: /TechCorp logo/i });
    expect(identityLink).toBeInTheDocument();
    expect(identityLink).toHaveAttribute("href", "/company/tech-corp");
    expect(identityLink).toHaveTextContent("TechCorp");
  });

  it("handles companies with no tags", () => {
    render(<CompanyTable companies={mockCompanies} />);
    // StartupInc should show "No tags" text
    expect(screen.getByText("No tags")).toBeInTheDocument();
  });
});
