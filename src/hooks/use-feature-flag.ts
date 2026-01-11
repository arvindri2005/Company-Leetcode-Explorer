"use client";

import { useMemo } from "react";

import { isFeatureEnabled } from "@/lib/config/feature-flags";

/**
 * React hook to check if a feature flag is enabled.
 *
 * @param flagName - The name of the feature flag to check
 * @returns boolean indicating if the feature is enabled
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const isAiEnabled = useFeatureFlag('AI_INSIGHTS');
 *
 *   if (!isAiEnabled) {
 *     return null;
 *   }
 *
 *   return <AiInsightsPanel />;
 * }
 * ```
 */
export function useFeatureFlag(flagName: string): boolean {
  return useMemo(() => isFeatureEnabled(flagName), [flagName]);
}
