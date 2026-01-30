import { render, screen } from "@testing-library/react";

import { Avatar, AvatarFallback, AvatarImage } from "./avatar";

describe("Avatar", () => {
  beforeAll(() => {
    // Correctly mock the Image constructor with addEventListener
    global.Image = class {
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;
      src: string = "";
      
      // Radix relies on this to detect loading success
      addEventListener(event: string, callback: () => void) {
        if (event === "load") {
          // Simulate a successful load slightly async
          setTimeout(() => {
            callback();
            if (this.onload) {this.onload();}
          }, 10);
        }
      }
      
      removeEventListener() {
        // No-op cleanup
      }
    } as any;
  });

  it("renders image when src provided", async () => {
    render(
      <Avatar>
        <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
        <AvatarFallback>CN</AvatarFallback>
      </Avatar>
    );

    // Wait for the mock to fire the load event
    const img = await screen.findByRole("img");
    
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute("src", "https://github.com/shadcn.png");
  });
});





