import React from "react";

import { Skeleton } from "@/components/ui/skeleton";

export function DashboardHeaderSkeleton() {
  return (
    <div className="relative py-12 sm:py-20 text-center space-y-6">
      <div className="space-y-2 flex flex-col items-center">
        {/* Title skeleton: responsive height and width */}
        <Skeleton className="h-10 sm:h-12 md:h-14 w-3/4 sm:w-2/3 md:w-1/2 max-w-2xl" />
        {/* Description skeleton */}
        <Skeleton className="h-6 w-5/6 sm:w-2/3 md:w-1/2 max-w-2xl mx-auto" />
      </div>

      <div className="max-w-2xl mx-auto relative w-full">
        {/* Search input skeleton: match height of py-6 input */}
        <Skeleton className="h-[76px] w-full rounded-full" />
      </div>
    </div>
  );
}

export function TechCompanyCardSkeleton() {
  return (
    <div className="bg-brand-surface border border-white/5 rounded-xl p-6 flex items-start gap-4">
      <Skeleton className="w-16 h-16 rounded-xl flex-shrink-0" />
      <div className="flex-1 min-w-0 space-y-2">
        <div>
          <Skeleton className="h-6 w-32 mb-2" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3 mt-1" />
        </div>
        <Skeleton className="h-8 w-16 rounded-md" />
      </div>
    </div>
  );
}

export function CompanyTableSkeleton() {
  return (
    <div className="w-full overflow-hidden rounded-xl border border-white/5 bg-brand-surface">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-white/5">
              <th className="p-4"><Skeleton className="h-4 w-20" /></th>
              <th className="p-4 hidden md:table-cell"><Skeleton className="h-4 w-20" /></th>
              <th className="p-4 hidden sm:table-cell"><Skeleton className="h-4 w-20" /></th>
              <th className="p-4 text-right"><Skeleton className="h-4 w-16 ml-auto" /></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {[...Array(10)].map((_, i) => (
              <tr key={i}>
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <Skeleton className="w-10 h-10 rounded-lg flex-shrink-0" />
                    <Skeleton className="h-5 w-24 sm:w-32" />
                  </div>
                </td>
                <td className="p-4 hidden md:table-cell">
                  <Skeleton className="h-4 w-24" />
                </td>
                <td className="p-4 hidden sm:table-cell">
                  <Skeleton className="h-4 w-12" />
                </td>
                <td className="p-4 text-right">
                  <Skeleton className="h-8 w-24 ml-auto rounded-lg" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}






