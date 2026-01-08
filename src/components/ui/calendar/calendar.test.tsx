
import { render, screen } from "@testing-library/react";
import { Calendar } from "./calendar";

describe("Calendar", () => {
    // Testing calendar can be tricky with current date.
    // We'll mock the date or just check if it renders.
  it("renders correctly", () => {
    render(<Calendar mode="single" className="rounded-md border" />);
    // Just check for a grid or generic calendar element
    const calendar = screen.getByRole("grid");
    expect(calendar).toBeInTheDocument();
  });
});






