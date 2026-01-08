
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "./sheet";
import { Button } from "@/components/ui/button";

describe("Sheet", () => {
  it("opens sheet on click", async () => {
       // Mocking ResizeObserver for Radix UI
       window.ResizeObserver = jest.fn().mockImplementation(() => ({
          observe: jest.fn(),
          unobserve: jest.fn(),
          disconnect: jest.fn(),
       }));

    render(
      <Sheet>
        <SheetTrigger asChild>
          <Button>Open Sheet</Button>
        </SheetTrigger>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Sheet Title</SheetTitle>
            <SheetDescription>Sheet Description</SheetDescription>
          </SheetHeader>
        </SheetContent>
      </Sheet>
    );

    const trigger = screen.getByText("Open Sheet");
    fireEvent.click(trigger);

    await waitFor(() => {
        expect(screen.getByText("Sheet Title")).toBeInTheDocument();
        expect(screen.getByText("Sheet Description")).toBeInTheDocument();
    });
  });
});
