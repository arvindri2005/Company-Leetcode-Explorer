import React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export function ProblemCardSkeleton() {
  return (
    <div className="flex flex-col bg-card border border-border/40 rounded-lg overflow-hidden">
      <div className="flex items-center gap-3 p-3 md:p-4">
        {/* Status Toggle Skeleton */}
        <Skeleton className="h-8 w-8 rounded-full flex-shrink-0" />

        {/* Title & Key Info Skeleton */}
        <div className="flex-1 min-w-0 flex flex-col gap-2">
          <div className="flex items-center gap-2">
            {/* Title */}
            <Skeleton className="h-6 w-3/4 md:w-1/2" />
            {/* Difficulty Badge */}
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>
          {/* Companies List Skeleton (Optional) */}
          <div className="flex items-center gap-1.5 flex-wrap">
             <Skeleton className="h-5 w-20 rounded-sm" />
             <Skeleton className="h-5 w-24 rounded-sm" />
          </div>
        </div>

        {/* Right Actions Skeleton */}
        <div className="flex items-center gap-1 flex-shrink-0">
            {/* Time Skeleton - Hidden on small screens to match real component */}
           <div className="hidden sm:flex items-center gap-1 mr-3">
               <Skeleton className="h-4 w-16" />
           </div>

           {/* Bookmark Button */}
           <Skeleton className="h-8 w-8 rounded-md" />
           {/* Expand Button */}
           <Skeleton className="h-8 w-8 rounded-md" />
        </div>
      </div>
    </div>
  );
}

export function ProblemListControlsSkeleton() {
  return (
    <div className="mb-6 p-4 space-y-4 bg-card rounded-lg shadow-sm border border-border/40">
      {/* Search Bar */}
      <Skeleton className="h-10 w-full rounded-md" />
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Skeleton className="h-10 flex-1 rounded-md" />
        <Skeleton className="h-10 flex-1 rounded-md" />
        <Skeleton className="h-10 flex-1 rounded-md" />
      </div>
    </div>
  );
}

export function ProblemsPageSkeleton() {
  return (
    <div className="w-full" aria-busy="true" role="status">
      <span className="sr-only">Loading problems...</span>
      <ProblemListControlsSkeleton />
      <div className="space-y-4">
        {[...Array(10)].map((_, i) => (
          <React.Fragment key={i}>
            <ProblemCardSkeleton />
            {/* Mimic Ad Placeholder spacing every 5 items for visual balance in skeleton (real list does every 25) */}
             {/* We don't necessarily need to mimic ad placeholder in skeleton unless strictly necessary,
                 but matching the spacing is good. Real list does it every 25, so unlikely to be seen in initial viewport.
                 I'll omit specific ad skeletons in the initial load list for simplicity unless user scrolls deep.
             */}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}






