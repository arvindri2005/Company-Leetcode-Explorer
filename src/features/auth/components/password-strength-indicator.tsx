"use client";

import { memo } from "react";

interface PasswordStrengthIndicatorProps {
  score: number; // 0 to 4
}

const getStrengthColor = (score: number) => {
  switch (score) {
    case 0:
      return "bg-muted";
    case 1:
      return "bg-red-500";
    case 2:
      return "bg-orange-500";
    case 3:
      return "bg-yellow-500";
    case 4:
      return "bg-green-500";
    default:
      return "bg-muted";
  }
};

const getStrengthText = (score: number) => {
  switch (score) {
    case 0:
      return "Enter password";
    case 1:
      return "Weak";
    case 2:
      return "Fair";
    case 3:
      return "Good";
    case 4:
      return "Strong";
    default:
      return "";
  }
};

// Performance: Define constants outside component to avoid allocation on every render
const LEVELS = [1, 2, 3, 4];
const ACTIVE_STYLE = { opacity: 1 };
const INACTIVE_STYLE = { opacity: 0.2 };

export const PasswordStrengthIndicator = memo(function PasswordStrengthIndicator({
  score,
}: PasswordStrengthIndicatorProps) {
  return (
    <div
      className="space-y-2"
      role="meter"
      aria-label="Password strength"
      aria-valuenow={score}
      aria-valuemin={0}
      aria-valuemax={4}
      aria-valuetext={getStrengthText(score)}
    >
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>Password Strength</span>
        <span className="font-medium">{getStrengthText(score)}</span>
      </div>
      <div
        className="flex gap-1 h-1.5 overflow-hidden rounded-full bg-secondary/30"
        aria-hidden="true"
      >
        {LEVELS.map((level) => (
          <div
            key={level}
            style={score >= level ? ACTIVE_STYLE : INACTIVE_STYLE}
            className={`flex-1 h-full rounded-full transition-all duration-300 ${
              score >= level ? getStrengthColor(score) : "bg-muted"
            }`}
          />
        ))}
      </div>
    </div>
  );
});
