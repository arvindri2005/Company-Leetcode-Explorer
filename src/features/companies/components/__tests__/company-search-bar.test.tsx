import { useRouter } from "next/navigation";

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { fetchCompanySuggestionsAction } from "@/app/actions";
import CompanySearchBar from "@/features/companies/components/company-search-bar";

// Mock dependencies
jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
}));

jest.mock("@/app/actions", () => ({
  fetchCompanySuggestionsAction: jest.fn(),
}));

// Mock useDebounce to return the value immediately for testing
jest.mock("use-debounce", () => ({
  useDebounce: (value: string) => [value],
}));

describe("CompanySearchBar", () => {
  const mockRouter = {
    push: jest.fn(),
  };
  const mockOnSearch = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
  });

  it("renders the search input with initial value", () => {
    render(<CompanySearchBar initialSearchTerm="Initial" />);
    const input = screen.getByRole("combobox", {
      name: /search for companies/i,
    });
    expect(input).toBeInTheDocument();
    expect(input).toHaveValue("Initial");
  });

  it("updates input value on type", async () => {
    render(<CompanySearchBar />);
    const input = screen.getByRole("combobox", {
      name: /search for companies/i,
    });
    await userEvent.type(input, "Google");
    expect(input).toHaveValue("Google");
  });

  it("calls fetchCompanySuggestionsAction when typing", async () => {
    (fetchCompanySuggestionsAction as jest.Mock).mockResolvedValue({
      success: true,
      data: [{ id: "1", name: "Google", slug: "google", logo: "/google.png" }],
    });

    render(<CompanySearchBar />);
    const input = screen.getByRole("combobox", {
      name: /search for companies/i,
    });

    await userEvent.type(input, "Go");

    await waitFor(() => {
      expect(fetchCompanySuggestionsAction).toHaveBeenCalledWith("Go");
    });
  });

  it("shows suggestions and handles selection", async () => {
    (fetchCompanySuggestionsAction as jest.Mock).mockResolvedValue({
      success: true,
      data: [{ id: "1", name: "Google", slug: "google", logo: "/google.png" }],
    });

    render(<CompanySearchBar />);
    const input = screen.getByRole("combobox", {
      name: /search for companies/i,
    });

    // Type to trigger suggestions
    await userEvent.type(input, "Go");

    // Wait for suggestions to appear
    const suggestion = await screen.findByText("Google");
    expect(suggestion).toBeInTheDocument();

    // Click suggestion
    fireEvent.mouseDown(suggestion);

    // Verify navigation
    expect(mockRouter.push).toHaveBeenCalledWith("/company/google");
  });

  it("calls onSearch when form is submitted", async () => {
    render(<CompanySearchBar onSearch={mockOnSearch} />);
    const input = screen.getByRole("combobox", {
      name: /search for companies/i,
    });

    await userEvent.type(input, "Amazon");
    fireEvent.submit(input);

    expect(mockOnSearch).toHaveBeenCalledWith("Amazon");
  });

  it("calls onSearch when Enter is pressed and no suggestion is active", async () => {
    render(<CompanySearchBar onSearch={mockOnSearch} />);
    const input = screen.getByRole("combobox", {
      name: /search for companies/i,
    });

    await userEvent.type(input, "Amazon");
    fireEvent.keyDown(input, { key: "Enter", code: "Enter" });

    expect(mockOnSearch).toHaveBeenCalledWith("Amazon");
  });

  it("updates internal state when initialSearchTerm prop changes", () => {
    const { rerender } = render(
      <CompanySearchBar initialSearchTerm="Initial" />,
    );
    const input = screen.getByRole("combobox", {
      name: /search for companies/i,
    });
    expect(input).toHaveValue("Initial");

    rerender(<CompanySearchBar initialSearchTerm="Updated" />);
    expect(input).toHaveValue("Updated");
  });
});
