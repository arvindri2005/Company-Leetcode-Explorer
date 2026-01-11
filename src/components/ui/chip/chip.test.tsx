import React from "react";

import { render, screen } from "@testing-library/react";

import { Chip } from "./chip";

describe("Chip", () => {
  it("forwards ref to the button element", () => {
    const ref = React.createRef<HTMLButtonElement>();
    render(<Chip ref={ref}>Click me</Chip>);
    expect(ref.current).toBeInstanceOf(HTMLButtonElement);
    expect(ref.current).toHaveTextContent("Click me");
  });

  it("renders correctly", () => {
    render(<Chip>Test Chip</Chip>);
    expect(screen.getByRole("button", { name: "Test Chip" })).toBeInTheDocument();
  });
});






