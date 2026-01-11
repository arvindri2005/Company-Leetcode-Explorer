
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "./accordion";

describe("Accordion", () => {
  it("renders correctly", () => {
    render(
      <Accordion type="single" collapsible>
        <AccordionItem value="item-1">
          <AccordionTrigger>Trigger 1</AccordionTrigger>
          <AccordionContent>Content 1</AccordionContent>
        </AccordionItem>
      </Accordion>
    );

    expect(screen.getByText("Trigger 1")).toBeInTheDocument();
    // Content should be hidden initially or available in DOM but not visible depending on implementation.
    // Radix Accordion usually keeps content in DOM but hidden.
    // However, Radix often unmounts content unless forceMount is used, or styling hides it.
    // Let's check for trigger existence primarily.
  });

  it("toggles content on click", async () => {
    render(
      <Accordion type="single" collapsible>
        <AccordionItem value="item-1">
          <AccordionTrigger>Trigger 1</AccordionTrigger>
          <AccordionContent>Content 1</AccordionContent>
        </AccordionItem>
      </Accordion>
    );

    const trigger = screen.getByText("Trigger 1");
    fireEvent.click(trigger);

    await waitFor(() => {
      expect(screen.getByText("Content 1")).toBeVisible();
    });

    fireEvent.click(trigger);
    
    // Waiting for animation/state update
    await waitFor(() => {
       // Note: Radix UI sometimes requires more complex setup for visibility testing in JSDOM due to animation reliance
       // But checking if it's visible or not is a good basic test.
       // If animation is involved, it might still be in the document.
       // We can check attributes.
       expect(trigger).toHaveAttribute("data-state", "closed");
    });
  });
});






