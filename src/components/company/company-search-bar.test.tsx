
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import CompanySearchBar from "@/components/company/company-search-bar";
import "@testing-library/jest-dom";

// Mock hooks and components
jest.mock("@/hooks/use-typing-placeholder", () => ({
  useTypingPlaceholder: () => "Google",
}));

// Mock Next/Image since it's not supported in JSDOM
// eslint-disable-next-line @next/next/no-img-element
jest.mock("next/image", () => ({
  __esModule: true,
  // eslint-disable-next-line jsx-a11y/alt-text
  default: (props: any) => <img {...props} />,
}));

describe("CompanySearchBar", () => {
  const defaultProps = {
    searchTermInput: "",
    setSearchTermInput: jest.fn(),
    isLoadingSuggestions: false,
    suggestions: [],
    showSuggestions: false,
    setShowSuggestions: jest.fn(),
    handleSuggestionClick: jest.fn(),
    suggestionsRef: { current: null },
    onSearch: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders search input correctly", () => {
    render(<CompanySearchBar {...defaultProps} />);
    const input = screen.getByTestId("search-input");
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute("type", "search");
  });

  it("does not show clear button when input is empty", () => {
    render(<CompanySearchBar {...defaultProps} searchTermInput="" />);
    const clearButton = screen.queryByLabelText("Clear search");
    expect(clearButton).not.toBeInTheDocument();
  });

  it("shows clear button when input has text", () => {
    render(<CompanySearchBar {...defaultProps} searchTermInput="Google" />);
    const clearButton = screen.getByLabelText("Clear search");
    expect(clearButton).toBeInTheDocument();
  });

  it("clears input and focuses when clear button is clicked", () => {
    render(<CompanySearchBar {...defaultProps} searchTermInput="Google" />);
    const clearButton = screen.getByLabelText("Clear search");

    fireEvent.click(clearButton);

    expect(defaultProps.setSearchTermInput).toHaveBeenCalledWith("");
    expect(defaultProps.setShowSuggestions).toHaveBeenCalledWith(false);
    expect(screen.getByTestId("search-input")).toHaveFocus();
  });

  it("applies correct padding when input has text (and clear button is visible)", () => {
    render(<CompanySearchBar {...defaultProps} searchTermInput="Google" />);
    const input = screen.getByTestId("search-input");
    expect(input).toHaveClass("pr-28");
  });

  it("applies default padding when input is empty", () => {
    render(<CompanySearchBar {...defaultProps} searchTermInput="" />);
    const input = screen.getByTestId("search-input");
    expect(input).toHaveClass("pr-17");
  });
});
