import React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/**
 * @function WorkExperienceSkeleton
 * @description A skeleton loader component that mimics the appearance of a Work Experience entry.
 * @returns {JSX.Element} The rendered skeleton component.
 */
export const WorkExperienceSkeleton = () => {
  return (
    <div
      className={cn(
        "bg-card border border-border rounded-xl p-6 mb-8 shadow-sm space-y-4",
      )}
      aria-hidden="true"
    >
      {/* Title Line: Job Title at Company */}
      <Skeleton className="h-6 w-1/2 rounded-md" />

      {/* Date Line: Start Date - End Date */}
      <Skeleton className="h-4 w-1/3 rounded-md" />

      {/* Responsibilities: Multiple lines */}
      <div className="space-y-2 pt-2">
        <Skeleton className="h-4 w-full rounded-md" />
        <Skeleton className="h-4 w-[90%] rounded-md" />
        <Skeleton className="h-4 w-[80%] rounded-md" />
      </div>
    </div>
  );
};

/**
 * @function EducationExperienceSkeleton
 * @description A skeleton loader component that mimics the appearance of an Education Experience entry.
 * @returns {JSX.Element} The rendered skeleton component.
 */
export const EducationExperienceSkeleton = () => {
  return (
    <div
      className={cn(
        "bg-card border border-border rounded-xl p-6 mb-8 shadow-sm space-y-3",
      )}
      aria-hidden="true"
    >
      {/* Title Line: Degree in Major */}
      <Skeleton className="h-6 w-1/2 rounded-md" />

      {/* Subtitle Line: School, Graduation Year, GPA */}
      <Skeleton className="h-4 w-2/3 rounded-md" />
    </div>
  );
};
