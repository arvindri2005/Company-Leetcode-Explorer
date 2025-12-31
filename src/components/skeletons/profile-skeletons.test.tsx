import React from "react";
import { render } from "@testing-library/react";
import {
  UserInfoCardSkeleton,
  ProgressStatsSkeleton,
  ProfilePageSkeleton,
} from "./profile-skeletons";

describe("Profile Skeletons", () => {
  it("renders UserInfoCardSkeleton", () => {
    const { container } = render(<UserInfoCardSkeleton />);
    expect(container.querySelector(".animate-pulse")).toBeInTheDocument();
    expect(container.querySelector(".bg-card")).toBeInTheDocument();
  });

  it("renders ProgressStatsSkeleton", () => {
    const { container } = render(<ProgressStatsSkeleton />);
    expect(container.querySelector(".animate-pulse")).toBeInTheDocument();
    expect(container.querySelector(".grid")).toBeInTheDocument();
  });

  it("renders ProfilePageSkeleton", () => {
    const { container } = render(<ProfilePageSkeleton />);
    expect(container.querySelector(".animate-in")).toBeInTheDocument();
    // Check if sub-components are rendered implicitly by checking for their structure
    expect(container.querySelectorAll(".bg-card").length).toBeGreaterThan(1);
    expect(container.querySelectorAll(".animate-pulse").length).toBeGreaterThan(5);
  });
});
