
import { render, screen, fireEvent } from "@testing-library/react";
import React, { createRef } from "react";
import { Textarea } from "./textarea";

describe("Textarea", () => {
  it("renders correctly", () => {
    render(<Textarea placeholder="Enter text" />);
    const textarea = screen.getByPlaceholderText("Enter text");
    expect(textarea).toBeInTheDocument();
  });

  it("handles value changes", () => {
    render(<Textarea placeholder="Enter text" />);
    const textarea = screen.getByPlaceholderText("Enter text") as HTMLTextAreaElement;
    
    fireEvent.change(textarea, { target: { value: "Hello" } });
    expect(textarea.value).toBe("Hello");
  });

  it("is disabled when prop is true", () => {
    render(<Textarea disabled placeholder="Enter text" />);
    const textarea = screen.getByPlaceholderText("Enter text");
    expect(textarea).toBeDisabled();
  });

  it("forwards ref correctly", () => {
    const ref = createRef<HTMLTextAreaElement>();
    render(<Textarea ref={ref} placeholder="Ref test" />);
    
    expect(ref.current).toBeInstanceOf(HTMLTextAreaElement);
    expect(ref.current).toHaveAttribute("placeholder", "Ref test");
  });
});
