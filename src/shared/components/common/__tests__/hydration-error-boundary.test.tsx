/**
 * @fileoverview Tests for HydrationErrorBoundary component
 */

import React from "react";

import { fireEvent,render, screen } from "@testing-library/react";

import { HydrationErrorBoundary } from "../hydration-error-boundary";

// Mock the hydration monitor
jest.mock("@/shared/lib/utils/hydration-monitor", () => ({
  hydrationMonitor: {
    trackHydrationError: jest.fn().mockReturnValue({ isFailure: false }),
  },
}));

// Component that throws an error for testing
const ThrowError: React.FC<{ shouldThrow?: boolean }> = ({ shouldThrow = true }) => {
  if (shouldThrow) {
    throw new Error("Test error");
  }
  return <div>No error</div>;
};

describe("HydrationErrorBoundary", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Suppress console.error for cleaner test output
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("renders children when there is no error", () => {
    render(
      <HydrationErrorBoundary>
        <ThrowError shouldThrow={false} />
      </HydrationErrorBoundary>
    );

    expect(screen.getByText("No error")).toBeInTheDocument();
  });

  it("renders fallback UI when an error occurs", () => {
    render(
      <HydrationErrorBoundary>
        <ThrowError />
      </HydrationErrorBoundary>
    );

    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
    expect(screen.getByText("Try Again")).toBeInTheDocument();
    expect(screen.getByText("Refresh Page")).toBeInTheDocument();
  });

  it("calls onError callback when an error occurs", () => {
    const onError = jest.fn();
    
    render(
      <HydrationErrorBoundary onError={onError}>
        <ThrowError />
      </HydrationErrorBoundary>
    );

    expect(onError).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({
        componentStack: expect.any(String),
      })
    );
  });

  it("renders custom fallback component when provided", () => {
    const CustomFallback: React.FC<{ error: Error; retry: () => void }> = () => (
      <div>Custom error message</div>
    );

    render(
      <HydrationErrorBoundary fallback={CustomFallback}>
        <ThrowError />
      </HydrationErrorBoundary>
    );

    expect(screen.getByText("Custom error message")).toBeInTheDocument();
  });

  it("shows error details when enabled", () => {
    render(
      <HydrationErrorBoundary showDetails={true}>
        <ThrowError />
      </HydrationErrorBoundary>
    );

    expect(screen.getByText("Error Details (Development)")).toBeInTheDocument();
  });

  it("handles retry functionality", () => {
    let shouldThrow = true;
    
    const TestComponent = () => {
      if (shouldThrow) {
        throw new Error("Test error");
      }
      return <div>No error</div>;
    };

    const {  } = render(
      <HydrationErrorBoundary>
        <TestComponent />
      </HydrationErrorBoundary>
    );

    // Error should be displayed
    expect(screen.getByText("Something went wrong")).toBeInTheDocument();

    // Change the condition so component won't throw on next render
    shouldThrow = false;

    // Click retry button
    fireEvent.click(screen.getByText("Try Again"));

    // The error boundary should reset and re-render the component
    // Since shouldThrow is now false, it should render successfully
    expect(screen.getByText("No error")).toBeInTheDocument();
  });
});