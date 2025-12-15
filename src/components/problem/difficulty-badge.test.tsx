import { render, screen } from "@testing-library/react";

import DifficultyBadge from "./difficulty-badge";

describe("DifficultyBadge", () => {
  it("renders the Easy badge correctly", () => {
    render(<DifficultyBadge difficulty="Easy" />);
    const badge = screen.getByText("Easy");
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass("bg-green-500");
  });

  it("renders the Medium badge correctly", () => {
    render(<DifficultyBadge difficulty="Medium" />);
    const badge = screen.getByText("Medium");
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass("bg-yellow-500");
  });

  it("renders the Hard badge correctly", () => {
    render(<DifficultyBadge difficulty="Hard" />);
    const badge = screen.getByText("Hard");
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass("bg-red-500");
  });

  it("applies additional class names", () => {
    render(<DifficultyBadge difficulty="Easy" className="custom-class" />);
    const badge = screen.getByText("Easy");
    expect(badge).toHaveClass("custom-class");
  });
});
