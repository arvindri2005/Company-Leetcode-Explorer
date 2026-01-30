/**
 * @fileoverview Hydration monitoring service for detecting and reporting hydration issues.
 *
 * This service provides comprehensive monitoring of hydration errors, performance metrics,
 * and context capture for debugging purposes. It integrates with the existing logging
 * infrastructure and can be extended to work with external monitoring services.
 */

import { failure, type Result,success } from "@/shared/types/result";
import { type ServiceError } from "@/shared/types/service-error";

import { Logger } from "./logger";

/**
 * Hydration error context information
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
  performanceMetrics?: {
    hydrationStartTime?: number;
    hydrationEndTime?: number;
    duration?: number;
  };
}

/**
 * Hydration performance metrics
 */
export interface HydrationMetrics {
  errorCount: number;
  successCount: number;
  averageHydrationTime: number;
  errorRate: number;
  lastErrorTimestamp?: number;
  totalHydrationAttempts: number;
}

/**
 * Hydration event types
 */
export type HydrationEventType = 'error' | 'success' | 'timing' | 'warning';

/**
 * Hydration monitoring event
 */
export interface HydrationEvent {
  type: HydrationEventType;
  timestamp: Date;
  componentPath: string;
  duration?: number;
  errorDetails?: HydrationErrorContext;
  metadata: Record<string, unknown>;
}

/**
 * Configuration for the hydration monitor
 */
export interface HydrationMonitorConfig {
  /** Whether to enable performance tracking */
  enablePerformanceTracking: boolean;
  /** Whether to report to external services */
  enableExternalReporting: boolean;
  /** Maximum number of events to keep in memory */
  maxEventHistory: number;
  /** Error rate threshold for alerts */
  errorRateThreshold: number;
  /** Sample rate for performance metrics (0-1) */
  performanceSampleRate: number;
}

/**
 * Default configuration for the hydration monitor
 */
const DEFAULT_CONFIG: HydrationMonitorConfig = {
  enablePerformanceTracking: true,
  enableExternalReporting: process.env.NODE_ENV === "production",
  maxEventHistory: 100,
  errorRateThreshold: 0.1, // 10% error rate threshold
  performanceSampleRate: 0.1, // Sample 10% of hydrations for performance
};

/**
 * Hydration monitoring service
 */
class HydrationMonitorService {
  private config: HydrationMonitorConfig;
  private events: HydrationEvent[] = [];
  private metrics: HydrationMetrics = {
    errorCount: 0,
    successCount: 0,
    averageHydrationTime: 0,
    errorRate: 0,
    totalHydrationAttempts: 0,
  };
  private hydrationTimings: Map<string, number> = new Map();

  constructor(config: Partial<HydrationMonitorConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Starts tracking hydration timing for a component
   */
  startHydrationTiming(componentPath: string): void {
    if (!this.config.enablePerformanceTracking) {return;}
    
    // Sample based on configured rate
    if (Math.random() > this.config.performanceSampleRate) {return;}

    this.hydrationTimings.set(componentPath, performance.now());
  }

  /**
   * Ends tracking hydration timing for a component
   */
  endHydrationTiming(componentPath: string): number | undefined {
    if (!this.config.enablePerformanceTracking) {return;}

    const startTime = this.hydrationTimings.get(componentPath);
    if (!startTime) {return;}

    const endTime = performance.now();
    const duration = endTime - startTime;
    
    this.hydrationTimings.delete(componentPath);
    
    // Record timing event
    this.recordEvent({
      type: 'timing',
      timestamp: new Date(),
      componentPath,
      duration,
      metadata: {
        startTime,
        endTime,
      },
    });

    // Update metrics
    this.updateTimingMetrics(duration);

    return duration;
  }

  /**
   * Tracks a hydration error with comprehensive context
   */
  trackHydrationError(
    error: Error, 
    componentStack: string, 
    componentName: string = "Unknown",
    retryAttempts: number = 0
  ): Result<void, ServiceError> {
    try {
      const errorContext = this.captureErrorContext(
        error,
        componentStack,
        componentName,
        retryAttempts
      );

      // Record error event
      this.recordEvent({
        type: 'error',
        timestamp: new Date(),
        componentPath: componentName,
        errorDetails: errorContext,
        metadata: {
          isHydrationError: this.isHydrationError(error),
          errorType: error.name,
          userAgent: errorContext.userAgent,
        },
      });

      // Update error metrics
      this.metrics.errorCount++;
      this.metrics.totalHydrationAttempts++;
      this.metrics.lastErrorTimestamp = Date.now();
      this.updateErrorRate();

      // Log the error
      Logger.error("Hydration error tracked", error, {
        componentName,
        errorContext,
        metrics: this.getMetricsSummary(),
      });

      // Report to external services if enabled
      if (this.config.enableExternalReporting) {
        this.reportToExternalServices(errorContext);
      }

      // Check if error rate exceeds threshold
      if (this.metrics.errorRate > this.config.errorRateThreshold) {
        this.triggerErrorRateAlert();
      }

      return success();
    } catch (monitoringError) {
      Logger.error("Failed to track hydration error", monitoringError);
      return failure({
        code: "INTERNAL_ERROR",
        message: "Failed to track hydration error",
        cause: monitoringError instanceof Error ? monitoringError : new Error(String(monitoringError)),
      });
    }
  }

  /**
   * Tracks a successful hydration
   */
  trackHydrationSuccess(componentPath: string, duration?: number): void {
    this.recordEvent({
      type: 'success',
      timestamp: new Date(),
      componentPath,
      duration,
      metadata: {},
    });

    this.metrics.successCount++;
    this.metrics.totalHydrationAttempts++;
    this.updateErrorRate();

    if (duration !== undefined) {
      this.updateTimingMetrics(duration);
    }
  }

  /**
   * Gets current hydration metrics
   */
  getMetrics(): HydrationMetrics {
    return { ...this.metrics };
  }

  /**
   * Gets a summary of key metrics
   */
  getMetricsSummary(): Record<string, unknown> {
    return {
      errorRate: this.metrics.errorRate,
      totalAttempts: this.metrics.totalHydrationAttempts,
      errorCount: this.metrics.errorCount,
      successCount: this.metrics.successCount,
      averageHydrationTime: this.metrics.averageHydrationTime,
    };
  }

  /**
   * Gets recent events (for debugging)
   */
  getRecentEvents(limit: number = 10): HydrationEvent[] {
    return this.events.slice(-limit);
  }

  /**
   * Clears all tracked data (useful for testing)
   */
  reset(): void {
    this.events = [];
    this.metrics = {
      errorCount: 0,
      successCount: 0,
      averageHydrationTime: 0,
      errorRate: 0,
      totalHydrationAttempts: 0,
    };
    this.hydrationTimings.clear();
  }

  /**
   * Records an event and manages event history
   */
  private recordEvent(event: HydrationEvent): void {
    this.events.push(event);
    
    // Maintain event history limit
    if (this.events.length > this.config.maxEventHistory) {
      this.events = this.events.slice(-this.config.maxEventHistory);
    }
  }

  /**
   * Captures comprehensive error context
   */
  private captureErrorContext(
    error: Error,
    componentStack: string,
    componentName: string,
    retryAttempts: number
  ): HydrationErrorContext {
    const context: HydrationErrorContext = {
      componentName,
      errorMessage: error.message,
      componentStack,
      userAgent: typeof window !== "undefined" ? window.navigator.userAgent : "SSR",
      timestamp: new Date(),
      retryAttempts,
      url: typeof window !== "undefined" ? window.location.href : "SSR",
    };

    // Capture auth state if available
    if (typeof window !== "undefined") {
      context.authState = {
        isAuthenticated: document.cookie.includes("auth_status=authenticated"),
        isLoading: false, // We can't easily determine loading state here
      };
    }

    // Capture performance metrics if available
    const startTime = this.hydrationTimings.get(componentName);
    if (startTime) {
      context.performanceMetrics = {
        hydrationStartTime: startTime,
        hydrationEndTime: performance.now(),
        duration: performance.now() - startTime,
      };
    }

    return context;
  }

  /**
   * Checks if an error is likely related to hydration
   */
  private isHydrationError(error: Error): boolean {
    const hydrationKeywords = [
      "hydration",
      "server-rendered HTML",
      "client-side",
      "mismatch",
      "expected server HTML",
      "suppressHydrationWarning",
    ];

    const errorMessage = error.message.toLowerCase();
    const errorStack = error.stack?.toLowerCase() || "";

    return hydrationKeywords.some(
      (keyword) =>
        errorMessage.includes(keyword) || errorStack.includes(keyword)
    );
  }

  /**
   * Updates timing metrics with new duration
   */
  private updateTimingMetrics(duration: number): void {
    const totalTime = this.metrics.averageHydrationTime * (this.metrics.successCount - 1) + duration;
    this.metrics.averageHydrationTime = totalTime / this.metrics.successCount;
  }

  /**
   * Updates error rate calculation
   */
  private updateErrorRate(): void {
    this.metrics.errorRate = this.metrics.totalHydrationAttempts === 0 ? 0 : this.metrics.errorCount / this.metrics.totalHydrationAttempts;
  }

  /**
   * Triggers an alert when error rate exceeds threshold
   */
  private triggerErrorRateAlert(): void {
    Logger.warn("Hydration error rate exceeded threshold", {
      errorRate: this.metrics.errorRate,
      threshold: this.config.errorRateThreshold,
      metrics: this.getMetricsSummary(),
    });

    // In a real application, this would trigger alerts via external services
    if (this.config.enableExternalReporting) {
      console.warn("ALERT: Hydration error rate exceeded threshold", {
        errorRate: this.metrics.errorRate,
        threshold: this.config.errorRateThreshold,
      });
    }
  }

  /**
   * Reports error context to external monitoring services
   */
  private reportToExternalServices(errorContext: HydrationErrorContext): void {
    // This would integrate with services like Sentry, LogRocket, DataDog, etc.
    // For now, we'll prepare the data structure for integration
    const reportData = {
      error: {
        message: errorContext.errorMessage,
        component: errorContext.componentName,
      },
      context: errorContext,
      tags: {
        component: errorContext.componentName,
        isHydrationError: true,
        retryAttempts: errorContext.retryAttempts,
        environment: process.env.NODE_ENV,
      },
      level: "error",
      fingerprint: [errorContext.componentName, errorContext.errorMessage],
    };

    // TODO: Integrate with actual monitoring service
    Logger.info("Would report to external monitoring service", { reportData });
  }
}

// Singleton instance
const hydrationMonitor = new HydrationMonitorService();

export { hydrationMonitor,HydrationMonitorService };