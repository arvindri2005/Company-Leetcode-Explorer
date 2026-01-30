import { render } from "@testing-library/react";

import { CompanyAIFeatureSkeleton, CompanyStatsSkeleton,CompanyStrategySkeleton } from "./company-ai-skeletons";

describe("Company AI Skeletons", () => {
  it("renders CompanyAIFeatureSkeleton without crashing", () => {
    const { container } = render(<CompanyAIFeatureSkeleton />);
    expect(container.firstChild).toHaveClass("animate-pulse");
    // Should contain a separator mimic
    expect(container.querySelector(".h-\\[1px\\]")).toBeInTheDocument();
  });

  it("renders CompanyStrategySkeleton without crashing", () => {
    const { container } = render(<CompanyStrategySkeleton />);
    expect(container.firstChild).toHaveClass("animate-pulse");
    // Should be a card
    expect(container.firstChild).toHaveClass("bg-card");
  });

  it("renders CompanyStatsSkeleton without crashing", () => {
    const { container } = render(<CompanyStatsSkeleton />);
    expect(container.firstChild).toHaveClass("animate-pulse");
    // Should contain grid layout
    expect(container.querySelector(".grid")).toBeInTheDocument();
  });
});






