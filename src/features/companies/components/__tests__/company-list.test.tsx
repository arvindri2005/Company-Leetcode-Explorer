import { act,render, screen, waitFor } from "@testing-library/react";

import { useCursorPagination } from "@/hooks/use-cursor-pagination";

import CompanyList from "../company-list";

// Mock dependencies
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn() }),
  usePathname: () => "/companies",
  useSearchParams: () => ({ 
    toString: () => "",
    get: () => null,
  }),
}));

jest.mock("@/hooks/use-cursor-pagination", () => ({
  useCursorPagination: jest.fn(),
}));

jest.mock("../company-card", () => {
    const MockCard = ({ company }: any) => <div data-testid="company-card">{company.name}</div>;
    return MockCard;
});
jest.mock("../company-search-bar", () => {
    const MockSearchBar = () => <div data-testid="search-bar">Search Bar</div>;
    return MockSearchBar;
});

// Mock IntersectionObserver
const mockIntersectionObserver = jest.fn();
mockIntersectionObserver.mockReturnValue({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
});
window.IntersectionObserver = mockIntersectionObserver;

describe("CompanyList", () => {
  const mockFetchCompanies = jest.fn();
  const initialCompanies = [
    { id: "1", name: "Company A", slug: "company-a" },
    { id: "2", name: "Company B", slug: "company-b" },
  ] as any[];

  beforeEach(() => {
    jest.clearAllMocks();
    (useCursorPagination as jest.Mock).mockReturnValue({
      fetchCompaniesWithCursor: mockFetchCompanies,
    });
  });

  it("renders initial companies", () => {
    render(
      <CompanyList
        initialCompanies={initialCompanies}
        initialHasMore={true}
        itemsPerPage={10}
      />
    );

    expect(screen.getAllByTestId("company-card")).toHaveLength(2);
    expect(screen.getByText("Company A")).toBeInTheDocument();
  });

  it("loads more companies and filters duplicates (Optimization Check)", async () => {
    // Setup intersection observer callback trigger
    let observerCallback: (entries: any[]) => void;
    (window.IntersectionObserver as jest.Mock).mockImplementation((cb) => {
      observerCallback = cb;
      return { observe: jest.fn(), disconnect: jest.fn() };
    });

    render(
      <CompanyList
        initialCompanies={initialCompanies}
        initialHasMore={true}
        itemsPerPage={10}
        initialNextCursor="cursor-1"
      />
    );

    // Mock fetch response with one new company and one DUPLICATE
    mockFetchCompanies.mockResolvedValue({
      companies: [
        { id: "2", name: "Company B", slug: "company-b" }, // Duplicate
        { id: "3", name: "Company C", slug: "company-c" }, // New
      ],
      hasMore: false,
      nextCursor: "cursor-2",
    });

    // Simulate intersection
    await act(async () => {
        if (observerCallback) {
            observerCallback([{ isIntersecting: true }]);
        }
    });

    // Wait for update
    await waitFor(() => {
        // Should have 3 cards total (A, B, C), not 4 (A, B, B, C)
        expect(screen.getAllByTestId("company-card")).toHaveLength(3);
    });

    expect(screen.getByText("Company C")).toBeInTheDocument();
    
    // Verify fetch was called correctly
    expect(mockFetchCompanies).toHaveBeenCalledWith("cursor-1", 10, "");
  });
});
