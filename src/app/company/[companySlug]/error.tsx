"use client";

import { useEffect } from "react";

import Link from "next/link";

import { Button } from "@/shared/components/ui/button";

export default function CompanyError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Company page error:", error);
  }, [error]);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center space-y-4">
        <h2 className="text-2xl font-bold text-destructive">
          Failed to load company
        </h2>
        <p className="text-muted-foreground">
          {error.message || "An unexpected error occurred"}
        </p>
        <div className="flex gap-4 justify-center">
          <Button onClick={reset}>Try Again</Button>
          <Button variant="outline" asChild>
            <Link href="/companies">Browse Companies</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
