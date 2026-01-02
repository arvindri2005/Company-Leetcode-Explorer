import React from "react";
import { render, screen } from "@testing-library/react";
import { Label } from "./label";

describe("Label", () => {
  it("renders correctly", () => {
    render(<Label htmlFor="test">Test Label</Label>);
    const label = screen.getByText("Test Label");
    expect(label).toBeInTheDocument();
  });

  it("forwards ref to the label element", () => {
    const ref = React.createRef<HTMLLabelElement>();
    render(<Label ref={ref}>Ref Label</Label>);
    expect(ref.current).toBeInstanceOf(HTMLLabelElement);
    expect(ref.current).toHaveTextContent("Ref Label");
  });
});
