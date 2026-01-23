"use client";

import { AlertCircle } from "lucide-react";

/**
 * Props for the CooldownIndicator component.
 */
interface CooldownIndicatorProps {
  /** Whether cooldown is active. */
  isActive: boolean;
  /** Formatted remaining time string. */
  formattedRemainingTime: string;
}

/**
 * Renders a cooldown timer indicator.
 *
 * @param {CooldownIndicatorProps} props - The props for the component.
 * @returns {React.JSX.Element | null} The rendered cooldown indicator or null if not active.
 */
export function CooldownIndicator({
  isActive,
  formattedRemainingTime,
}: CooldownIndicatorProps): React.JSX.Element | null {
  if (!isActive) {
    return null;
  }

  return (
    <p className="text-xs text-destructive flex items-center">
      <AlertCircle size={14} className="mr-1" />
      AI on cooldown. Available in: {formattedRemainingTime}
    </p>
  );
}
