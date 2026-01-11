"use client";

import React from "react";

import ErrorBoundary from "@/components/ui/error-boundary";

import TypingTestErrorFallback from "./typing-test-error-fallback";
import TypingTestGame from "./typing-test-game";

export default function TypingTestContainer() {
  return (
    <ErrorBoundary fallbackRender={(props) => <TypingTestErrorFallback {...props} />}>
      <TypingTestGame />
    </ErrorBoundary>
  );
}






