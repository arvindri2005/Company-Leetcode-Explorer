
import { fireEvent,render, screen } from "@testing-library/react";

import { RadioGroup, RadioGroupItem } from "./radio-group";

describe("RadioGroup", () => {
  it("renders correctly", () => {
    render(
      <RadioGroup defaultValue="default">
        <RadioGroupItem value="default" aria-label="Default" />
        <RadioGroupItem value="other" aria-label="Other" />
      </RadioGroup>
    );

    const radio1 = screen.getByRole("radio", { name: "Default" });
    const radio2 = screen.getByRole("radio", { name: "Other" });

    expect(radio1).toBeInTheDocument();
    expect(radio2).toBeInTheDocument();
    expect(radio1).toBeChecked();
    expect(radio2).not.toBeChecked();
  });

  it("changes selection on click", () => {
    render(
      <RadioGroup>
        <RadioGroupItem value="1" aria-label="Option 1" />
        <RadioGroupItem value="2" aria-label="Option 2" />
      </RadioGroup>
    );

    const radio1 = screen.getByRole("radio", { name: "Option 1" });
    const radio2 = screen.getByRole("radio", { name: "Option 2" });

    fireEvent.click(radio1);
    expect(radio1).toBeChecked();
    expect(radio2).not.toBeChecked();

    fireEvent.click(radio2);
    expect(radio2).toBeChecked();
    expect(radio1).not.toBeChecked();
  });
});






