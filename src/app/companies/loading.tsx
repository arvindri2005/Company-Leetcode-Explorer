
import { Skeleton } from "@/components/ui/skeleton";
import { Search } from "lucide-react";

export default function CompaniesLoading() {
  return (
    <section className="space-y-8">
      <div>
        <Skeleton className="h-10 w-3/4 md:w-1/2 mb-2" /> {/* Title Skeleton */}
        <Skeleton className="h-6 w-1/2 md:w-1/3" />      {/* Subtitle Skeleton */}
      </div>
      <Skeleton className="h-px w-full" /> {/* Separator Skeleton */}

      {/* Search Input Skeleton */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Skeleton className="h-12 w-full pl-10 rounded-lg" />
      </div>

      {/* Company Cards Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="rounded-lg border bg-card text-card-foreground shadow-sm flex flex-col">
            <div className="flex flex-row items-start gap-4 p-6">
              <Skeleton className="h-12 w-12 rounded-md border" /> {/* Logo */}
              <div className="flex-1 space-y-2">
                <Skeleton className="h-6 w-3/4" /> {/* Title */}
                <Skeleton className="h-4 w-full" /> {/* Description Line 1 */}
                <Skeleton className="h-4 w-2/3" /> {/* Description Line 2 */}
              </div>
            </div>
            <div className="flex-grow p-6 pt-0" /> {/* Spacer */}
            <div className="flex flex-col sm:flex-row gap-2 p-6 pt-4 border-t">
              <Skeleton className="h-10 w-full sm:flex-1" /> {/* Button 1 */}
              <Skeleton className="h-10 w-full sm:flex-1" /> {/* Button 2 */}
            </div>
          </div>
        ))}
      </div>
      
      {/* Load More Trigger Skeleton (optional, if you want to hint at infinite scroll) */}
      <div className="h-10 flex items-center justify-center">
        <Skeleton className="h-8 w-8 rounded-full" />
      </div>
    </section>
  );
}
