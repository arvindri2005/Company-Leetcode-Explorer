import React from "react";

import { DashboardSearchInput } from "./dashboard-search-input";

/**
 * Renders the header section of the companies dashboard.
 *
 * Optimization: The search input logic (state, effects, animation) is extracted
 * to `DashboardSearchInput` to isolate re-renders. This component remains static
 * and can be a Server Component (or static client component), preventing the
 * large title/text from diffing on every tick of the typing placeholder animation.
 */
export function DashboardHeader() {
  return (
    <div className="relative py-12 sm:py-20 text-center space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-white">
          Explore Companies & Their Interview Problems
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Discover and prepare with real questions from top tech companies.
        </p>
      </div>

      <div className="max-w-2xl mx-auto relative">
        <DashboardSearchInput />
      </div>
    </div>
  );
}
