"use client";

import { useEffect } from "react";

import { Button } from "@/shared/components/ui/button";

export default function ProblemsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Problems page error:", error);
  }, [error]);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center space-y-4">
        <h2 className="text-2xl font-bold text-destructive">
          Failed to load problems
        </h2>
        <p className="text-muted-foreground">
          {error.message || "An unexpected error occurred"}
        </p>
        <Button onClick={reset}>Try Again</Button>
      </div>
    </div>
  );
}
