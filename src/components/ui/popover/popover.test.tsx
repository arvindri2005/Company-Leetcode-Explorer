
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";
import { Button } from "@/components/ui/button";

describe("Popover", () => {
  it("opens content on click", async () => {
         // Mocking ResizeObserver for Radix UI
       window.ResizeObserver = jest.fn().mockImplementation(() => ({
          observe: jest.fn(),
          unobserve: jest.fn(),
          disconnect: jest.fn(),
       }));

    render(
      <Popover>
        <PopoverTrigger asChild>
          <Button>Open Popover</Button>
        </PopoverTrigger>
        <PopoverContent>Popover Content</PopoverContent>
      </Popover>
    );

    const trigger = screen.getByText("Open Popover");
    fireEvent.click(trigger);

    await waitFor(() => {
        expect(screen.getByText("Popover Content")).toBeInTheDocument();
    });
  });
});






