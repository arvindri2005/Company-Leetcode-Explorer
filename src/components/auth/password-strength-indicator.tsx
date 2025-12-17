"use client";

import { motion } from "framer-motion";

interface PasswordStrengthIndicatorProps {
  score: number; // 0 to 4
}

export function PasswordStrengthIndicator({
  score,
}: PasswordStrengthIndicatorProps) {
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

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>Password Strength</span>
        <span className="font-medium">{getStrengthText(score)}</span>
      </div>
      <div className="flex gap-1 h-1.5 overflow-hidden rounded-full bg-secondary/30">
        {[1, 2, 3, 4].map((level) => (
          <motion.div
            key={level}
            initial={false}
            animate={{
              backgroundColor:
                score >= level ? getStrengthColor(score).replace("bg-", "") : "",
              opacity: score >= level ? 1 : 0.2,
            }}
            className={`flex-1 h-full rounded-full transition-colors duration-300 ${
              score >= level ? getStrengthColor(score) : "bg-muted"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
