import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { Button } from "@/components/ui/button";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./tooltip";

describe("Tooltip", () => {
  it("renders tooltip on hover", async () => {
    // Mocking ResizeObserver for Radix UI
    global.ResizeObserver = jest.fn().mockImplementation(() => ({
      observe: jest.fn(),
      unobserve: jest.fn(),
      disconnect: jest.fn(),
    }));

    // Mocking matchMedia for Radix UI
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: jest.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: jest.fn(), // deprecated
        removeListener: jest.fn(), // deprecated
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      })),
    });

    const user = userEvent.setup();

    render(
      <TooltipProvider delayDuration={0} skipDelayDuration={0}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button>Hover Me</Button>
          </TooltipTrigger>
          <TooltipContent>Tooltip Content</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );

    const trigger = screen.getByText("Hover Me");
    await user.hover(trigger);

    await waitFor(() => {
        // Radix renders two elements: one visible, one hidden for a11y.
        // getAllByText returns an array, resolving the "multiple elements" error.
        const tooltips = screen.getAllByText("Tooltip Content");
        expect(tooltips.length).toBeGreaterThan(0);
        expect(tooltips[0]).toBeInTheDocument();
    });
  });
});





