import { render, screen } from "@testing-library/react";
import Pagination from "../pagination";

describe("Pagination", () => {
  it("does not render when totalPages is less than or equal to 1", () => {
    const { container } = render(<Pagination currentPage={1} totalPages={1} />);
    expect(container.firstChild).toBeNull();
  });

  it("creates correct page URL with search term", () => {
    render(<Pagination currentPage={1} totalPages={2} searchTerm="test" />);
    const link = screen.getByText("2").closest("a");
    expect(link).toHaveAttribute("href", "/companies?search=test&page=2");
  });

  it("renders all page links when totalPages is small", () => {
    render(<Pagination currentPage={1} totalPages={5} />);
    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByText("4")).toBeInTheDocument();
    expect(screen.getByText("5")).toBeInTheDocument();
  });

  it("renders ellipsis at the end when currentPage is at the beginning", () => {
    render(<Pagination currentPage={1} totalPages={10} />);
    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByText("4")).toBeInTheDocument();
    expect(screen.getByText("5")).toBeInTheDocument();
    expect(screen.getByText("More pages")).toBeInTheDocument();
    expect(screen.getByText("10")).toBeInTheDocument();
  });

  it("renders ellipsis at the beginning when currentPage is at the end", () => {
    render(<Pagination currentPage={10} totalPages={10} />);
    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByText("More pages")).toBeInTheDocument();
    expect(screen.getByText("6")).toBeInTheDocument();
    expect(screen.getByText("7")).toBeInTheDocument();
    expect(screen.getByText("8")).toBeInTheDocument();
    expect(screen.getByText("9")).toBeInTheDocument();
    expect(screen.getByText("10")).toBeInTheDocument();
  });

  it("renders ellipsis on both sides when currentPage is in the middle", () => {
    render(<Pagination currentPage={5} totalPages={10} />);
    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getAllByText("More pages")).toHaveLength(2);
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByText("4")).toBeInTheDocument();
    expect(screen.getByText("5")).toBeInTheDocument();
    expect(screen.getByText("6")).toBeInTheDocument();
    expect(screen.getByText("7")).toBeInTheDocument();
    expect(screen.getByText("10")).toBeInTheDocument();
  });
});
