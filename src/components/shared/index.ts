/**
 * @fileoverview Barrel exports for shared components
 */

export type { 
  HydrationErrorBoundaryProps, 
  HydrationErrorBoundaryState,
  HydrationErrorContext 
} from "./hydration-error-boundary";
export { HydrationErrorBoundary, withHydrationErrorBoundary } from "./hydration-error-boundary";