"use client";

import React from "react";
import { useAICooldown } from "@/hooks/use-ai-cooldown";
import type { User as FirebaseUser } from "firebase/auth";

const AITooltipContentComponent: React.FC<{
  defaultText: string;
  user: FirebaseUser | null;
}> = ({ defaultText, user }) => {
  const { canUseAI, isLoadingCooldown, getFormattedRemainingTime } =
    useAICooldown();
  const isAIButtonCurrentlyDisabled = isLoadingCooldown || !canUseAI;

  let content = defaultText;
  if (!user) {
    content = "Login to use AI features";
  } else if (isAIButtonCurrentlyDisabled && !isLoadingCooldown) {
    content = `AI on cooldown: ${getFormattedRemainingTime()}`;
  }
  return <p>{content}</p>;
};

export const AITooltipContent = React.memo(AITooltipContentComponent);






