/**
 * Feature Flag System
 *
 * Provides environment-aware feature toggles for gradual rollout
 * and feature gating without deployments.
 */

type Environment = "development" | "staging" | "production";

interface FeatureFlagConfig {
  defaultValue: boolean;
  environments?: Partial<Record<Environment, boolean>>;
  description: string;
}

const featureFlags: Record<string, FeatureFlagConfig> = {
  AI_INSIGHTS: {
    defaultValue: true,
    environments: { production: true },
    description: "Enable AI-powered problem insights",
  },
  FLASHCARD_GENERATOR: {
    defaultValue: true,
    description: "Enable AI flashcard generation",
  },
  JOB_TRACKER: {
    defaultValue: false,
    environments: { development: true, staging: true },
    description: "Enable job application tracker feature",
  },
  MOCK_INTERVIEW: {
    defaultValue: false,
    environments: { development: true },
    description: "Enable mock interview mode",
  },
  SIMILAR_QUESTIONS: {
    defaultValue: true,
    description: "Enable similar questions feature",
  },
  COMPANY_STRATEGY: {
    defaultValue: true,
    description: "Enable AI company strategy generation",
  },
};

function getEnvironment(): Environment {
  return (process.env.NEXT_PUBLIC_ENV as Environment) || "development";
}

/**
 * Check if a feature flag is enabled for the current environment.
 *
 * @param flagName - The name of the feature flag to check
 * @returns boolean indicating if the feature is enabled
 */
export function isFeatureEnabled(flagName: string): boolean {
  const config = featureFlags[flagName];
  if (!config) {
    console.warn(`Unknown feature flag: ${flagName}`);
    return false;
  }

  const env = getEnvironment();
  return config.environments?.[env] ?? config.defaultValue;
}

/**
 * Get all feature flags with their current enabled state.
 *
 * @returns Record of flag names to their enabled state
 */
export function getAllFeatureFlags(): Record<string, boolean> {
  return Object.fromEntries(
    Object.keys(featureFlags).map((key) => [key, isFeatureEnabled(key)])
  );
}

/**
 * Get the configuration for a specific feature flag.
 *
 * @param flagName - The name of the feature flag
 * @returns The feature flag configuration or undefined if not found
 */
export function getFeatureFlagConfig(
  flagName: string
): FeatureFlagConfig | undefined {
  return featureFlags[flagName];
}

export type { Environment, FeatureFlagConfig };
