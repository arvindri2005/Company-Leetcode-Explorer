import { render, screen } from "@testing-library/react";

import { TechCompanyCard } from "@/features/companies/components/tech-company-card";
import type { Company } from "@/features/companies/types";

// Mock OfflineImage
jest.mock("@/shared/components/ui/offline-image", () => ({
  OfflineImage: ({ alt }: { alt: string }) => <img alt={alt} />,
}));

const mockCompany: Company = {
  id: "1",
  name: "TechCorp",
  slug: "tech-corp",
  problemCount: 10,
  description: "A great company",
  commonTags: [],
};

describe("TechCompanyCard", () => {
  it("renders accessible 'View' link", () => {
    render(<TechCompanyCard company={mockCompany} />);
    
    // Check if the link has the correct accessible name
    const link = screen.getByRole("link", { name: "View details for TechCorp" });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "/company/tech-corp");
    
    // Check if visual text "View" is still there (it's part of the accessible name calculation)
    expect(link).toHaveTextContent("View");
  });
});
