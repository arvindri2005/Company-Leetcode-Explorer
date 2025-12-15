import { render, screen } from "@testing-library/react";
import TagBadge from "./tag-badge";

describe("TagBadge", () => {
  it("renders the tag text correctly", () => {
    render(<TagBadge tag="Array" />);
    const badge = screen.getByText("Array");
    expect(badge).toBeInTheDocument();
  });

  it("applies additional class names", () => {
    render(<TagBadge tag="Hash Table" className="custom-class" />);
    const badge = screen.getByText("Hash Table");
    expect(badge).toHaveClass("custom-class");
  });
});
