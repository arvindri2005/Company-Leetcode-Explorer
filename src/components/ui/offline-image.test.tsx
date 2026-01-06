import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { OfflineImage } from "./offline-image";
import { useOnlineStatus } from "@/hooks/use-online-status";

// Mock dependencies
jest.mock("@/hooks/use-online-status");
jest.mock("next/image", () => ({
  __esModule: true,
  default: (props: any) => {
    // We intentionally filter out props that cause React DOM warnings in tests
     
    const { fill, priority, loading, sizes, quality, onError, loader, placeholder, blurDataURL, unoptimized, onLoadingComplete, alt, ...rest } = props;
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        data-testid="next-image"
        data-fill={fill}
        data-priority={priority}
        onError={onError}
        alt={alt || ""}
        {...rest}
      />
    );
  },
}));

describe("OfflineImage", () => {
  const mockUseOnlineStatus = useOnlineStatus as jest.Mock;

  beforeEach(() => {
    mockUseOnlineStatus.mockReturnValue(true);
    jest.clearAllMocks();
  });

  it("renders the primary image initially", () => {
    render(<OfflineImage src="/test.jpg" alt="Test Image" />);
    const img = screen.getByTestId("next-image");
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute("src", "/test.jpg");
    expect(img).toHaveAttribute("alt", "Test Image");
  });

  it("renders with fallback src on primary image error", () => {
    render(<OfflineImage src="/test.jpg" fallbackSrc="/fallback.jpg" alt="Test Image" />);
    const img = screen.getByTestId("next-image");
    
    // Simulate error
    fireEvent.error(img);

    const fallbackImg = screen.getByTestId("next-image");
    expect(fallbackImg).toHaveAttribute("src", "/fallback.jpg");
  });

  it("renders fallback icon if fallback src fails", () => {
    render(<OfflineImage src="/test.jpg" fallbackSrc="/fallback.jpg" alt="Test Image" />);
    
    // First error (primary)
    let img = screen.getByTestId("next-image");
    fireEvent.error(img);

    // Second error (fallback)
    img = screen.getByTestId("next-image"); // This should be the fallback image now
    fireEvent.error(img);

    // Should now show div with fallback content
    const fallbackDiv = screen.getByRole("img");
    expect(fallbackDiv.tagName).toBe("DIV");
    expect(screen.queryByTestId("next-image")).not.toBeInTheDocument();
  });

  it("applies opacity class when offline", () => {
    mockUseOnlineStatus.mockReturnValue(false);
    render(<OfflineImage src="/test.jpg" alt="Test Image" />);
    const img = screen.getByTestId("next-image");
    expect(img).toHaveClass("opacity-90");
  });

  it("handles fill prop correctly", () => {
    render(<OfflineImage src="/test.jpg" fill alt="Test Image" />);
    const img = screen.getByTestId("next-image");
    expect(img).toHaveAttribute("data-fill", "true");
  });

  it("applies absolute positioning to fallback div when fill is true", () => {
    render(<OfflineImage src="/test.jpg" fallbackSrc="/fallback.jpg" fill alt="Test Image" />);
    
    // Fail both images to get to div
    const img = screen.getByTestId("next-image");
    fireEvent.error(img);
    const fallbackImg = screen.getByTestId("next-image");
    fireEvent.error(fallbackImg);

    const fallbackDiv = screen.getByRole("img");
    expect(fallbackDiv).toHaveClass("absolute");
    expect(fallbackDiv).toHaveClass("inset-0");
    expect(fallbackDiv).toHaveClass("h-full");
    expect(fallbackDiv).toHaveClass("w-full");
  });

  it("does not pass image-specific props to the fallback div", () => {
     render(
      <OfflineImage 
        src="/test.jpg" 
        fallbackSrc="/fallback.jpg" 
        priority 
        sizes="100vw" 
        quality={75} 
        alt="Test Image" 
      />
    );

    // Fail both images
    const img = screen.getByTestId("next-image");
    fireEvent.error(img);
    const fallbackImg = screen.getByTestId("next-image");
    fireEvent.error(fallbackImg);

    const fallbackDiv = screen.getByRole("img");
    // These should NOT be attributes on the div
    expect(fallbackDiv).not.toHaveAttribute("priority");
    expect(fallbackDiv).not.toHaveAttribute("sizes");
    expect(fallbackDiv).not.toHaveAttribute("quality");
  });
});
