import { fireEvent,render, screen } from "@testing-library/react";

import { Button } from "@/shared/components/ui/button";

describe("Button", () => {
  it("renders correctly with default props", () => {
    render(<Button>Click me</Button>);
    const button = screen.getByRole("button", { name: /click me/i });
    expect(button).toBeInTheDocument();
  });

  it("applies variant classes", () => {
    render(<Button variant="destructive">Delete</Button>);
    const button = screen.getByRole("button", { name: /delete/i });
    expect(button).toHaveClass("bg-destructive");
  });

  it("applies size classes", () => {
    render(<Button size="lg">Large Button</Button>);
    const button = screen.getByRole("button", { name: /large button/i });
    expect(button).toHaveClass("h-11");
  });

  it("handles click events", () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    const button = screen.getByRole("button", { name: /click me/i });
    fireEvent.click(button);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("renders as child", () => {
    render(
      <Button asChild>
        <a href="/test">Link Button</a>
      </Button>
    );
    const link = screen.getByRole("link", { name: /link button/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "/test");
  });

  it("is disabled when disabled prop is provided", () => {
    render(<Button disabled>Disabled</Button>);
    const button = screen.getByRole("button", { name: /disabled/i });
    expect(button).toBeDisabled();
  });

  it("shows loading state", () => {
    render(<Button isLoading>Submit</Button>);
    const button = screen.getByRole("button");
    expect(button).toBeDisabled();
    // In Shadcn UI button, svg size is enforced by class
    // We check if the button contains a loading indication
    // Since we don't have visual regression here, we check for presence of disabled state
    // and ideally we could check for the loader icon if we could query by class or testid
    expect(button).toHaveAttribute("data-loading", "true");
  });

  it("hides icon children when loading in icon mode", () => {
    render(
      <Button size="icon" isLoading>
        <span data-testid="icon">Icon</span>
      </Button>
    );
    const button = screen.getByRole("button");
    expect(button).toBeDisabled();
    expect(screen.queryByTestId("icon")).not.toBeInTheDocument();
  });
  
  it("shows text children when loading in default mode", () => {
      render(
          <Button isLoading>
              <span data-testid="text">Submit</span>
          </Button>
      );
      expect(screen.getByTestId("text")).toBeInTheDocument();
  });
});






