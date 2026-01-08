import { render, screen } from "@testing-library/react";
import { ProblemStatusIcon } from "./problem-status-icon";

// Mock ResizeObserver for Radix UI Tooltip
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

describe("ProblemStatusIcon", () => {
  it("renders the solved icon correctly", () => {
    render(<ProblemStatusIcon status="solved" />);
    const iconContainer = screen.getByLabelText("Status: Solved").closest('div');
    expect(iconContainer).toHaveClass("bg-green-100");
  });

  it("renders the attempted icon correctly", () => {
    render(<ProblemStatusIcon status="attempted" />);
    const iconContainer = screen.getByLabelText("Status: Attempted").closest('div');
    expect(iconContainer).toHaveClass("bg-yellow-100");
  });

  it("renders the todo icon correctly", () => {
    render(<ProblemStatusIcon status="todo" />);
    const iconContainer = screen.getByLabelText("Status: To-Do").closest('div');
    expect(iconContainer).toHaveClass("bg-blue-100");
  });

  it("does not render anything when status is none", () => {
    const { container } = render(<ProblemStatusIcon status="none" />);
    expect(container).toBeEmptyDOMElement();
  });
});






