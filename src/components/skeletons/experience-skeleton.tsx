import React from "react";

import { Skeleton } from "@/components/ui/skeleton";

export function ExperienceItemSkeleton() {
  return (
    <div className="bg-card border border-border rounded-xl p-6 mb-8 shadow-sm">
      <Skeleton className="h-6 w-3/4 mb-2" />
      <Skeleton className="h-4 w-1/2" />
      <Skeleton className="h-3 w-1/4 mt-1" />
    </div>
  );
}

export function ExperienceListSkeleton() {
  return (
    <ul className="space-y-3 mt-4">
      {[...Array(2)].map((_, i) => (
        <ExperienceItemSkeleton key={i} />
      ))}
    </ul>
  );
}






