
import React, { createRef } from "react";

import { fireEvent, render, screen } from "@testing-library/react";

import { PasswordInput } from "./password-input";

describe("PasswordInput", () => {
  it("renders correctly with default type password", () => {
    render(<PasswordInput placeholder="Enter password" />);
    const input = screen.getByPlaceholderText("Enter password");
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute("type", "password");
  });

  it("toggles password visibility", () => {
    render(<PasswordInput placeholder="Enter password" />);
    const input = screen.getByPlaceholderText("Enter password");
    const toggleButton = screen.getByRole("button", { name: /show password/i });

    expect(input).toHaveAttribute("type", "password");

    fireEvent.click(toggleButton);
    expect(input).toHaveAttribute("type", "text");
    expect(screen.getByRole("button", { name: /hide password/i })).toBeInTheDocument();

    fireEvent.click(toggleButton);
    expect(input).toHaveAttribute("type", "password");
  });

  it("forwards ref correctly", () => {
    const ref = createRef<HTMLInputElement>();
    render(<PasswordInput ref={ref} placeholder="Ref test" />);

    expect(ref.current).toBeInstanceOf(HTMLInputElement);
  });
});
