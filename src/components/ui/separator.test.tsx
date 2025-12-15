
import { render, screen } from "@testing-library/react";
import { Separator } from "./separator";

describe("Separator", () => {
  it("renders correctly", () => {
    render(<Separator data-testid="separator" />);
    // Separator usually has role 'separator'
    const separator = screen.getByRole("separator");
    expect(separator).toBeInTheDocument();
  });

  it("renders vertical separator", () => {
    render(<Separator orientation="vertical" data-testid="separator-vertical" />);
    const separator = screen.getByRole("separator");
    expect(separator).toHaveAttribute("aria-orientation", "vertical");
  });
});
