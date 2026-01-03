"use client";

import React from "react";
import TypingTestGame from "@/components/tools/typing-test/typing-test-game";
import ErrorBoundary from "@/components/ui/error-boundary";
import TypingTestErrorFallback from "@/components/tools/typing-test/typing-test-error-fallback";

export default function TypingTestContainer() {
  return (
    <ErrorBoundary fallbackRender={(props) => <TypingTestErrorFallback {...props} />}>
      <TypingTestGame />
    </ErrorBoundary>
  );
}
