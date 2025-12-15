import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./dropdown-menu";
import { Button } from "./button";

describe("DropdownMenu", () => {
  // Optional: Add global mocks if not done in setupTests.ts
  beforeAll(() => {
    // Mock PointerEvent if strictly necessary (older JSDOM versions)
    if (!window.PointerEvent) {
      class MockPointerEvent extends Event {
        button: number;
        ctrlKey: boolean;
        pointerType: string;
        constructor(type: string, props: PointerEventInit) {
          super(type, props);
          this.button = props.button || 0;
          this.ctrlKey = props.ctrlKey || false;
          this.pointerType = props.pointerType || "mouse";
        }
      }
      window.PointerEvent = MockPointerEvent as any;
    }
    
    // Mock ResizeObserver
    window.ResizeObserver = jest.fn().mockImplementation(() => ({
      observe: jest.fn(),
      unobserve: jest.fn(),
      disconnect: jest.fn(),
    }));

    // Mock scrollIntoView (Radix uses this heavily)
    window.HTMLElement.prototype.scrollIntoView = jest.fn();
    window.HTMLElement.prototype.releasePointerCapture = jest.fn();
    window.HTMLElement.prototype.hasPointerCapture = jest.fn();
  });

  it("opens menu on click", async () => {
    // 1. Setup the user event instance
    const user = userEvent.setup();

    render(
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button>Open</Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem>Item 1</DropdownMenuItem>
          <DropdownMenuItem>Item 2</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );

    const trigger = screen.getByText("Open");

    // 2. Use user.click instead of fireEvent.click
    await user.click(trigger);

    // 3. Assertions
    await waitFor(() => {
      expect(screen.getByText("Item 1")).toBeInTheDocument();
      expect(screen.getByText("Item 2")).toBeInTheDocument();
    });
  });
});