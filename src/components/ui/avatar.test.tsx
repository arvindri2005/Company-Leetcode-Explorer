
import { render, screen } from "@testing-library/react";
import { Avatar, AvatarFallback, AvatarImage } from "./avatar";

describe("Avatar", () => {
  it("renders image when src provided", () => {
    render(
      <Avatar>
        <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
        <AvatarFallback>CN</AvatarFallback>
      </Avatar>
    );
    
    // Radix Avatar Image renders an img tag
    const img = screen.getByRole("img");
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute("src", "https://github.com/shadcn.png");
  });

  it("renders fallback when image fails or missing", () => {
     // Since we can't easily simulate image load failure in simple JSDOM test without avoiding implementation details,
     // we can test fallback rendering if we don't provide image or if we just test the fallback component existence.
     // However, Radix handles show/hide based on loading state.
     
     // Let's just render Fallback inside Avatar to see if it renders correctly as text
     render(
      <Avatar>
        <AvatarFallback>CN</AvatarFallback>
      </Avatar>
    );
    
    expect(screen.getByText("CN")).toBeInTheDocument();
  });
});
