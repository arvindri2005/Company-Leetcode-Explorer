import { Skeleton } from "@/components/ui/skeleton";

/**
 * Loading skeleton for the single company page.
 * Displays a layout matching the CompanyPage structure while data loads.
 */
export function CompanyPageSkeleton() {
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Company Header */}
      <div className="flex items-center gap-4 mb-8">
        <Skeleton className="h-16 w-16 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>

      {/* Company Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-lg" />
        ))}
      </div>

      {/* Problems Section Header */}
      <div className="flex items-center justify-between mb-6">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-10 w-32" />
      </div>

      {/* Problems List */}
      <div className="space-y-4">
        {[...Array(10)].map((_, i) => (
          <Skeleton key={i} className="h-16 w-full rounded-lg" />
        ))}
      </div>

      {/* Pagination */}
      <div className="flex justify-center mt-8">
        <Skeleton className="h-10 w-64" />
      </div>
    </div>
  );
}
