import React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";

/**
 * Skeleton for AI Grouping and Flashcard Generator sections.
 * Mimics the structure:
 * - Top margin/padding
 * - Separator
 * - Centered Header (Title + Description)
 * - Centered Action Button Area
 */
export function CompanyAIFeatureSkeleton() {
  return (
    <div className="mt-12 py-8 space-y-8 animate-pulse">
      {/* Separator mimic */}
      <div className="h-[1px] w-full bg-border my-8" />
      
      {/* Header Area */}
      <div className="space-y-4 flex flex-col items-center">
        {/* Title: ~h-7 md:h-9, w-64 */}
        <Skeleton className="h-8 md:h-9 w-64 max-w-[80%]" />
        {/* Description: ~h-5, w-96 */}
        <Skeleton className="h-5 w-96 max-w-full" />
      </div>

      {/* Button Action Area */}
      <div className="flex justify-center">
        {/* Button: h-11 (lg), w-64 */}
        <Skeleton className="h-11 w-64 rounded-md" />
      </div>
    </div>
  );
}

/**
 * Skeleton for Company Strategy Generator.
 * Mimics the structure:
 * - Card Wrapper
 * - Header Area
 * - Controls Area (Select + Button)
 */
export function CompanyStrategySkeleton() {
  return (
    <div className="bg-card border border-border rounded-xl p-6 mb-8 shadow-sm animate-pulse">
      {/* Header Area (inside card) */}
      {/* Separator mimic inside card */}
       <div className="h-[1px] w-full bg-border my-8" />

      <div className="space-y-4 flex flex-col items-center mb-8">
        <Skeleton className="h-8 md:h-9 w-72 max-w-[80%]" />
        <Skeleton className="h-5 w-full max-w-lg" />
      </div>

      {/* Controls Area: Select + Button */}
      <div className="flex flex-col items-center justify-center gap-4 mb-8">
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
           {/* Select Trigger */}
           <Skeleton className="h-10 w-full sm:w-48 rounded-md" />
           {/* Generate Button */}
           <Skeleton className="h-11 w-full sm:w-48 rounded-md" />
        </div>
      </div>
    </div>
  );
}

/**
 * Skeleton for Company Problem Statistics.
 * Mimics the structure:
 * - Card Wrapper
 * - Header
 * - Grid of Charts
 */
export function CompanyStatsSkeleton() {
  return (
    <div className="bg-card border border-border rounded-xl p-6 mb-8 shadow-sm animate-pulse">
      {/* Header */}
      <div className="py-2 px-3 mb-4">
         <Skeleton className="h-6 w-48" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 px-3 pt-4">
        {/* Difficulty Chart Area */}
        <div>
          <Skeleton className="h-5 w-32 mx-auto mb-4" /> {/* Title */}
          <Skeleton className="h-[200px] w-full rounded-md" /> {/* Chart */}
        </div>

        {/* Recency Chart Area */}
        <div>
          <Skeleton className="h-5 w-32 mx-auto mb-4" /> {/* Title */}
          <Skeleton className="h-[200px] w-full rounded-md" /> {/* Chart */}
        </div>

        {/* Tags Area */}
        <div className="md:col-span-2 mt-4">
           <Skeleton className="h-5 w-40 mb-3" />
           <div className="flex flex-wrap gap-2">
             {[...Array(5)].map((_, i) => (
               <Skeleton key={i} className="h-7 w-20 rounded-full" />
             ))}
           </div>
        </div>
      </div>
    </div>
  );
}
