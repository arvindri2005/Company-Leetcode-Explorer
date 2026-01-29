"use client";

import { useEffect } from "react";

import { Button } from "@/components/ui/button";

export default function ContactError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Contact page error:", error);
  }, [error]);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
      <h2 className="text-2xl font-bold text-destructive mb-4">
        Something went wrong
      </h2>
      <p className="text-muted-foreground mb-6">
        {error.message || "Failed to load the contact page"}
      </p>
      <Button onClick={reset}>Try Again</Button>
    </div>
  );
}
