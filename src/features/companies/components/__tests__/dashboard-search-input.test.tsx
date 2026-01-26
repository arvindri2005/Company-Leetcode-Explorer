import { useRouter, useSearchParams } from "next/navigation";

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useDebouncedCallback } from "use-debounce";

import { DashboardSearchInput } from "@/features/companies/components/dashboard-search-input";

// Mock dependencies
jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn(),
}));

jest.mock("use-debounce", () => ({
  useDebouncedCallback: jest.fn(),
}));

// Mock the new hook to avoid animation logic in tests
jest.mock("@/features/companies/hooks", () => ({
  useTypingPlaceholderRef: jest.fn(),
}));

describe("DashboardSearchInput", () => {
  const mockRouter = {
    replace: jest.fn(),
  };
  const mockSearchParams = new URLSearchParams();
  const mockDebouncedSearch = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (useSearchParams as jest.Mock).mockReturnValue(mockSearchParams);
    (useDebouncedCallback as jest.Mock).mockReturnValue(mockDebouncedSearch);
    // When called, execute the callback immediately
    (useDebouncedCallback as jest.Mock).mockImplementation((fn) => {
        return ((...args: any[]) => { fn(...args); }) as any;
    });
  });

  it("renders the search input", () => {
    render(<DashboardSearchInput />);
    const input = screen.getByRole("textbox");
    expect(input).toBeInTheDocument();
  });

  it("initializes value from searchParams", () => {
    (useSearchParams as jest.Mock).mockReturnValue(new URLSearchParams("search=test"));
    render(<DashboardSearchInput />);
    const input = screen.getByRole("textbox");
    expect(input).toHaveValue("test");
  });

  it("updates URL when typing", async () => {
    render(<DashboardSearchInput />);
    const input = screen.getByRole("textbox");
    
    await userEvent.type(input, "foo");
    
    expect(mockRouter.replace).toHaveBeenCalledWith(expect.stringContaining("search=foo"));
  });

  it("clears search when X button is clicked", async () => {
    // Setup initial state
    (useSearchParams as jest.Mock).mockReturnValue(new URLSearchParams("search=initial"));
    
    render(<DashboardSearchInput />);
    
    // Check initial value
    const input = screen.getByRole("textbox");
    expect(input).toHaveValue("initial");
    
    // Find clear button
    const clearButton = screen.getByLabelText("Clear search");
    expect(clearButton).toBeInTheDocument();
    
    // Click clear
    await userEvent.click(clearButton);
    
    // Verify value cleared and router updated
    expect(input).toHaveValue("");
    expect(mockRouter.replace).toHaveBeenCalledWith(expect.stringContaining("companies?")); // Should not have search param
  });
});
