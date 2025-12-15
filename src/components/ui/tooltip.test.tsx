
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./tooltip";
import { Button } from "./button";

describe("Tooltip", () => {
  it("renders tooltip on hover", async () => {
       // Mocking ResizeObserver for Radix UI
       window.ResizeObserver = jest.fn().mockImplementation(() => ({
          observe: jest.fn(),
          unobserve: jest.fn(),
          disconnect: jest.fn(),
       }));

    render(
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button>Hover Me</Button>
          </TooltipTrigger>
          <TooltipContent>Tooltip Content</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );

    const trigger = screen.getByText("Hover Me");
    fireEvent.mouseEnter(trigger);
    
    // Radix Tooltip has a default delay (700ms). We often need to await it or bypass it.
    // However, in JSDOM, focus might also trigger it or just wait.
     fireEvent.focus(trigger);

    await waitFor(() => {
        expect(screen.getByText("Tooltip Content")).toBeInTheDocument();
    });
  });
});
