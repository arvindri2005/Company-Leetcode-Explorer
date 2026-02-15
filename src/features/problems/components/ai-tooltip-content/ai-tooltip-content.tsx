"use client";

import React from "react";

import type { User } from "@supabase/supabase-js";

import { useAICooldown } from "@/features/ai";

const AITooltipContentComponent: React.FC<{
  defaultText: string;
  user: User | null;
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






