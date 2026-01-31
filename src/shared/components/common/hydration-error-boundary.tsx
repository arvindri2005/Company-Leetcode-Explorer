/**
 * @fileoverview Hydration Error Boundary component for catching and handling hydration mismatches.
 *
 * This component implements a React error boundary specifically designed to catch
 * hydration-related errors and provide graceful fallback UI with retry mechanisms.
 * It includes error logging and context capture for debugging purposes.
 */
"use client";

import React, { type ErrorInfo, type ReactNode } from "react";

import { Button } from "@/shared/components/ui/button";
import { hydrationMonitor } from "@/shared/lib/utils/hydration-monitor";

/**
 * Props for the HydrationErrorBoundary component
 */
export interface HydrationErrorBoundaryProps {
  /** Optional custom fallback component to render when an error occurs */
  fallback?: React.ComponentType<{ error: Error; retry: () => void; showDetails?: boolean }>;
  /** Optional error handler callback */
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  /** Child components to wrap with error boundary */
  children: ReactNode;
  /** Optional component name for error context */
  componentName?: string;
  /** Force showing error details, defaults to process.env.NODE_ENV === "development" */
  showDetails?: boolean;
}

/**
 * State interface for the HydrationErrorBoundary component
 */
export interface HydrationErrorBoundaryState {
  /** Whether an error has occurred */
  hasError: boolean;
  /** The error that occurred, if any */
  error?: Error;
  /** Number of retry attempts made */
  retryCount: number;
  /** Maximum number of retry attempts allowed */
  maxRetries: number;
}

/**
 * Context information captured when a hydration error occurs
 */
export interface HydrationErrorContext {
  componentName: string;
  errorMessage: string;
  componentStack: string;
  userAgent: string;
  timestamp: Date;
  retryAttempts: number;
  url: string;
  authState?: {
    isAuthenticated: boolean;
    isLoading: boolean;
  };
}

/**
 * Default fallback component rendered when hydration errors occur
 */
const DefaultFallback: React.FC<{ error: Error; retry: () => void; showDetails?: boolean }> = ({
  error,
  retry,
  showDetails = process.env.NODE_ENV === "development",
}) => (
  <div className="flex flex-col items-center justify-center p-6 bg-muted/50 rounded-lg border border-border">
    <div className="text-center space-y-4">
      <h3 className="text-lg font-semibold text-foreground">
        Something went wrong
      </h3>
      <p className="text-sm text-muted-foreground max-w-md">
        We encountered an issue loading this component. This might be a temporary problem.
      </p>
      <div className="flex gap-2">
        <Button
          onClick={retry}
          variant="outline"
          size="sm"
        >
          Try Again
        </Button>
        <Button
          onClick={() => window.location.reload()}
          variant="ghost"
          size="sm"
        >
          Refresh Page
        </Button>
      </div>
      {showDetails && (
        <details className="mt-4 text-left">
          <summary className="cursor-pointer text-xs text-muted-foreground">
            Error Details (Development)
          </summary>
          <pre className="mt-2 text-xs bg-muted p-2 rounded overflow-auto max-w-md">
            {error.message}
          </pre>
        </details>
      )}
    </div>
  </div>
);

/**
 * HydrationErrorBoundary - React error boundary for hydration-specific error handling
 *
 * This class component catches JavaScript errors anywhere in its child component tree,
 * with special handling for hydration-related errors. It provides:
 * - Graceful fallback UI
 * - Retry mechanism without full page reload
 * - Comprehensive error logging and context capture
 * - Development-friendly error details
 */
export class HydrationErrorBoundary extends React.Component<
  HydrationErrorBoundaryProps,
  HydrationErrorBoundaryState
> {
  constructor(props: HydrationErrorBoundaryProps) {
    super(props);

    this.state = {
      hasError: false,
      error: undefined,
      retryCount: 0,
      maxRetries: 3,
    };
  }

  /**
   * Static method called when an error occurs during rendering
   */
  static getDerivedStateFromError(error: Error): Partial<HydrationErrorBoundaryState> {
    return {
      hasError: true,
      error,
    };
  }

  /**
   * Called when an error has been caught by the error boundary
   */
  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    const { onError, componentName = "Unknown" } = this.props;
    const { retryCount } = this.state;

    // Track error with hydration monitor
    const trackingResult = hydrationMonitor.trackHydrationError(
      error,
      errorInfo.componentStack || "",
      componentName,
      retryCount
    );

    if (trackingResult.isFailure) {
      console.error("Failed to track hydration error:", trackingResult.error);
    }

    // Call custom error handler if provided
    if (onError) {
      onError(error, errorInfo);
    }
  }

  /**
   * Retry mechanism that resets the error state
   */
  private handleRetry = (): void => {
    const { retryCount, maxRetries } = this.state;

    if (retryCount < maxRetries) {
      this.setState({
        hasError: false,
        error: undefined,
        retryCount: retryCount + 1,
      });
    } else {
      // Max retries reached, suggest page refresh
      if (typeof window !== "undefined") {
        const shouldRefresh = window.confirm(
          "Maximum retry attempts reached. Would you like to refresh the page?"
        );
        if (shouldRefresh) {
          window.location.reload();
        }
      }
    }
  };

  render(): ReactNode {
    const { hasError, error } = this.state;
    const { children, fallback: CustomFallback } = this.props;

    if (hasError && error) {
      const FallbackComponent = CustomFallback || DefaultFallback;
      return <FallbackComponent error={error} retry={this.handleRetry} showDetails={this.props.showDetails} />;
    }

    return children;
  }
}

/**
 * Higher-order component for wrapping components with hydration error boundary
 */
export function withHydrationErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  componentName?: string
): React.FC<P & { errorBoundaryProps?: Partial<HydrationErrorBoundaryProps> }> {
  const WrappedComponent: React.FC<P & { errorBoundaryProps?: Partial<HydrationErrorBoundaryProps> }> = ({
    errorBoundaryProps,
    ...props
  }) => (
    <HydrationErrorBoundary
      componentName={componentName || Component.displayName || Component.name}
      {...errorBoundaryProps}
    >
      <Component {...(props as P)} />
    </HydrationErrorBoundary>
  );

  WrappedComponent.displayName = `withHydrationErrorBoundary(${
    Component.displayName || Component.name || "Component"
  })`;

  return WrappedComponent;
}