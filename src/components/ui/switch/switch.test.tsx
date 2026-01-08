
import { render, screen, fireEvent } from "@testing-library/react";
import { Switch } from "./switch";

describe("Switch", () => {
  it("renders correctly", () => {
    render(<Switch aria-label="switch" />);
    const switchElement = screen.getByRole("switch");
    expect(switchElement).toBeInTheDocument();
  });

  it("toggles state", () => {
    render(<Switch aria-label="switch" />);
    const switchElement = screen.getByRole("switch");
    
    expect(switchElement).not.toBeChecked();
    
    fireEvent.click(switchElement);
    expect(switchElement).toBeChecked();
    
    fireEvent.click(switchElement);
    expect(switchElement).not.toBeChecked();
  });

  it("is disabled when prop is present", () => {
    render(<Switch aria-label="switch" disabled />);
    const switchElement = screen.getByRole("switch");
    expect(switchElement).toBeDisabled();
  });
});






