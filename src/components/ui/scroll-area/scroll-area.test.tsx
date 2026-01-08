
import { render, screen } from "@testing-library/react";
import { ScrollArea } from "./scroll-area";

describe("ScrollArea", () => {
  it("renders correctly", () => {
    // Radix Scroll Area has complex DOM structure.
    render(
      <ScrollArea className="h-[200px] w-[350px]">
        <div>Content</div>
      </ScrollArea>
    );

    expect(screen.getByText("Content")).toBeInTheDocument();
  });
});






