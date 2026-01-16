"use client";

import { memo, useMemo } from "react";

import { PasswordStrengthIndicator } from "./password-strength-indicator";

interface SignupPasswordStrengthProps {
  password?: string;
}

const HAS_NUMBER = /[0-9]/;
const HAS_SPECIAL = /[^A-Za-z0-9]/;

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

  return <PasswordStrengthIndicator score={passwordScore} />;
});
