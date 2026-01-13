"use client";

import { useMemo } from "react";
import { useFormContext } from "react-hook-form";

import { PasswordStrengthIndicator } from "./password-strength-indicator";

export function SignupPasswordStrength() {
  const { watch } = useFormContext();
  const password = watch("password");

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
    if (/[0-9]/.test(password)) {
      score += 1;
    }
    if (/[^A-Za-z0-9]/.test(password)) {
      score += 1;
    }
    return score;
  }, [password]);

  return <PasswordStrengthIndicator score={passwordScore} />;
}
