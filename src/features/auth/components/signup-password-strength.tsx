"use client";

import { memo, useMemo } from "react";

import { Check } from "lucide-react";

import { cn } from "@/lib/utils";

import { PasswordStrengthIndicator } from "./password-strength-indicator";

interface SignupPasswordStrengthProps {
  password?: string;
}

const HAS_NUMBER = /[0-9]/;
const HAS_SPECIAL = /[^A-Za-z0-9]/;
const HAS_UPPER = /[A-Z]/;
const HAS_LOWER = /[a-z]/;
const MIN_LENGTH = 8;

export const SignupPasswordStrength = memo(function SignupPasswordStrength({
  password = "",
}: SignupPasswordStrengthProps) {
  const passwordScore = useMemo(() => {
    let score = 0;
    if (!password) {
      return 0;
    }
    if (password.length > 6) {
      score += 1;
    }
    if (password.length > 10) {
      score += 1;
    }
    if (HAS_NUMBER.test(password)) {
      score += 1;
    }
    if (HAS_SPECIAL.test(password)) {
      score += 1;
    }
    return score;
  }, [password]);

  const requirements = useMemo(() => [
    { label: "8+ characters", met: password.length >= MIN_LENGTH },
    { label: "Uppercase letter", met: HAS_UPPER.test(password) },
    { label: "Lowercase letter", met: HAS_LOWER.test(password) },
    { label: "Number", met: HAS_NUMBER.test(password) },
    { label: "Special character", met: HAS_SPECIAL.test(password) },
  ], [password]);

  return (
    <div className="space-y-3">
      <PasswordStrengthIndicator score={passwordScore} />
      
      <ul className="grid grid-cols-2 gap-2 text-xs text-muted-foreground" aria-label="Password requirements">
        {requirements.map((req) => (
          <li 
            key={req.label} 
            className={cn(
              "flex items-center gap-1.5 transition-colors duration-200", 
              req.met ? "text-green-600 dark:text-green-500 font-medium" : "text-muted-foreground"
            )}
          >
            {req.met ? (
              <Check className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
            ) : (
              <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/30 ml-1 shrink-0" aria-hidden="true" />
            )}
            <span>
              {req.label}
              <span className="sr-only">
                {req.met ? " - requirement met" : " - requirement not met"}
              </span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
});
