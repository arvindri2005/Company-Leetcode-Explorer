import { render, screen } from "@testing-library/react";
import { Separator } from "./separator";

describe("Separator", () => {
  it("renders correctly", () => {
    // Set decorative={false} to force the element to have role="separator"
    render(<Separator decorative={false} data-testid="separator" />);
    
    const separator = screen.getByRole("separator");
    expect(separator).toBeInTheDocument();
  });

  it("renders vertical separator", () => {
    // Set decorative={false} here as well
    render(<Separator decorative={false} orientation="vertical" data-testid="separator-vertical" />);
    
    const separator = screen.getByRole("separator");
    expect(separator).toHaveAttribute("aria-orientation", "vertical");
  });
});





