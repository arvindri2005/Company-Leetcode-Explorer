"use client";

import React, { memo } from "react";

import dynamic from "next/dynamic";

import { SearchX } from "lucide-react";

import AdPlaceholder from "@/components/ads/ad-placeholder";
import { Button } from "@/components/ui/button";
import ErrorBoundary from "@/components/ui/error-boundary";
import { Skeleton } from "@/components/ui/skeleton";
import { TooltipProvider } from "@/components/ui/tooltip";

import type { LeetCodeProblem, ProblemListFilters, ProblemStatus, SortKey } from "../../types";
import { type DifficultySchema, type LastAskedPeriodSchema, type ProblemStatusSchema } from "../../types";
import ProblemCard, { type ProblemCardProps } from "../problem-card/problem-card";
import ProblemCardErrorFallback from "../problem-card/problem-card-error-fallback";

// Lazy load controls
const ProblemListControls = dynamic(() => import("../problem-list-controls/problem-list-controls"), {
  loading: () => (
    <div className="mb-6 p-4 space-y-4 bg-card rounded-lg shadow">
      <Skeleton className="h-10 w-full rounded-md" />
      <div className="flex flex-col sm:flex-row gap-4">
        <Skeleton className="h-10 flex-1 rounded-md" />
        <Skeleton className="h-10 flex-1 rounded-md" />
        <Skeleton className="h-10 flex-1 rounded-md" />
      </div>
    </div>
  ),
});

const FALLBACK = <ProblemCardErrorFallback />;

const ProblemCardWithErrorBoundary = memo((props: ProblemCardProps & { showCompanies?: boolean; userId?: string }) => (
  <ErrorBoundary fallback={FALLBACK}>
    <ProblemCard {...props} />
  </ErrorBoundary>
));
ProblemCardWithErrorBoundary.displayName = "ProblemCardWithErrorBoundary";

interface ProblemListViewProps {
  displayedProblems: LeetCodeProblem[];
  currentFilters: ProblemListFilters;
  isLoadingMore: boolean;
  hasMore: boolean;
  observerTargetRef: React.RefObject<HTMLDivElement | null>;
  userId?: string;
  globalStats: {
    solvedProblemIds: Set<string>;
    attemptedProblemIds: Set<string>;
    bookmarkedProblemIds: Set<string>;
    areLoaded: boolean;
  };
  actions: {
    handleFilterChange: (filters: Partial<ProblemListFilters>) => void;
    handleBookmarkChange: (id: string, isBookmarked: boolean) => void;
    handleStatusChange: (id: string, status: ProblemStatus) => void;
  };
}

export const ProblemListView: React.FC<ProblemListViewProps> = ({
  displayedProblems,
  currentFilters,
  isLoadingMore,
  hasMore,
  observerTargetRef,
  userId,
  globalStats,
  actions,
}) => {
  const { solvedProblemIds, attemptedProblemIds, bookmarkedProblemIds, areLoaded } = globalStats;
  const { handleFilterChange, handleBookmarkChange, handleStatusChange } = actions;

  // -- Stable Handlers for Controls --
  const handleDifficultyChange = (value: typeof DifficultySchema.options[number][]) => 
    handleFilterChange({ difficultyFilter: value });

  const handleSortKeyChange = (value: SortKey) => 
    handleFilterChange({ sortKey: value });

  const handleLastAskedChange = (value: typeof LastAskedPeriodSchema.options[number][]) => 
    handleFilterChange({ lastAskedFilter: value });

  const handleStatusChangeFilter = (value: typeof ProblemStatusSchema.options[number][]) => 
    handleFilterChange({ statusFilter: value });

  const handleClearAll = () => 
    handleFilterChange({
      difficultyFilter: [],
      lastAskedFilter: [],
      statusFilter: [],
    });

  return (
    <TooltipProvider delayDuration={300}>
      <div>
        <h2 className="sr-only">All Problems</h2>

        <ProblemListControls
          difficultyFilter={currentFilters.difficultyFilter}
          onDifficultyFilterChange={handleDifficultyChange}
          sortKey={currentFilters.sortKey}
          onSortKeyChange={handleSortKeyChange}
          lastAskedFilter={currentFilters.lastAskedFilter}
          onLastAskedFilterChange={handleLastAskedChange}
          statusFilter={currentFilters.statusFilter}
          onStatusFilterChange={handleStatusChangeFilter}
          onClearAll={handleClearAll}
          showStatusFilter={!!userId}
        />

        {displayedProblems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4 border-2 border-dashed border-muted rounded-lg bg-muted/50 text-center animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-background p-3 rounded-full shadow-sm mb-4">
              <SearchX className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-1">
              No problems found
            </h3>
            <p className="text-sm text-muted-foreground max-w-sm mb-6">
              We couldn&apos;t find any problems matching your current filters. Try
              adjusting your criteria.
            </p>
            <Button variant="outline" onClick={handleClearAll}>
              Clear all filters
            </Button>
          </div>
        ) : (
          <ul className="space-y-4">
            {displayedProblems.map((problem, index) => {
              let computedStatus = problem.currentStatus || "none";
              let computedIsBookmarked = problem.isBookmarked;

              if (areLoaded) {
                 if (solvedProblemIds.has(problem.id)) {computedStatus = "solved";}
                 else if (attemptedProblemIds.has(problem.id)) {computedStatus = "attempted";}
                 else {computedStatus = "none";}
                 
                 computedIsBookmarked = bookmarkedProblemIds.has(problem.id);
              }

              return (
                <li key={problem.id}>
                  <ProblemCardWithErrorBoundary
                    problem={problem}
                    companySlug={problem.companySlug || "unknown"}
                    initialIsBookmarked={computedIsBookmarked}
                    onBookmarkChanged={handleBookmarkChange}
                    problemStatus={computedStatus}
                    onProblemStatusChange={handleStatusChange}
                    showCompanies={true}
                    userId={userId}
                  />
                  {(index + 1) % 25 === 0 && (
                    <div className="py-4">
                      <AdPlaceholder title="Sponsored" className="h-32 w-full" />
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
        
        {hasMore && (
          <div 
              ref={observerTargetRef}
              className="py-10 text-center text-muted-foreground"
          >
              {isLoadingMore ? "Loading more problems..." : "Scroll to load more"}
          </div>
        )}
      </div>
    </TooltipProvider>
  );
};
