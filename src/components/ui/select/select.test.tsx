import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./select";

// Setup mocks for Radix UI
beforeAll(() => {
  window.ResizeObserver = jest.fn().mockImplementation(() => ({
    observe: jest.fn(),
    unobserve: jest.fn(),
    disconnect: jest.fn(),
  }));

  window.HTMLElement.prototype.scrollIntoView = jest.fn();
  
  window.HTMLElement.prototype.setPointerCapture = jest.fn();
  window.HTMLElement.prototype.releasePointerCapture = jest.fn();
  window.HTMLElement.prototype.hasPointerCapture = jest.fn(() => false);
});

describe("Select", () => {
  it("renders trigger", () => {
    render(
      <Select>
        <SelectTrigger aria-label="Select one">
          <SelectValue placeholder="Theme" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="light">Light</SelectItem>
          <SelectItem value="dark">Dark</SelectItem>
        </SelectContent>
      </Select>
    );

    // It's okay to check text existence, just don't click it
    expect(screen.getByText("Theme")).toBeInTheDocument();
  });

  it("opens content on click", async () => {
    const user = userEvent.setup();

    render(
      <Select>
        <SelectTrigger aria-label="Select one">
          <SelectValue placeholder="Theme" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="light">Light</SelectItem>
          <SelectItem value="dark">Dark</SelectItem>
        </SelectContent>
      </Select>
    );

    // FIX: Select the button (combobox) instead of the inner text span
    // Radix Trigger always has the role "combobox"
    const trigger = screen.getByRole("combobox");

    await user.click(trigger);

    await waitFor(() => {
      expect(screen.getByText("Light")).toBeInTheDocument();
    });

    expect(screen.getByText("Dark")).toBeInTheDocument();
  });
});





