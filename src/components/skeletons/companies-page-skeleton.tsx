import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

import {
  CompanyTableSkeleton,
  DashboardHeaderSkeleton,
  TechCompanyCardSkeleton,
} from "./companies-skeletons";

export function CompaniesPageSkeleton() {
  return (
    <main className="min-h-screen w-full flex flex-col">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 flex-1 pb-12">
        <DashboardHeaderSkeleton />

        {/* Trending Section Skeleton */}
        <section className="mb-12 space-y-4">
          {/* Title "Trending Companies" - h-7 matches text-xl font-bold approx */}
          <Skeleton className="h-7 w-48 bg-white/5 pl-1" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <TechCompanyCardSkeleton key={i} />
            ))}
          </div>
          <Separator className="my-8 bg-white/5" />
        </section>

        {/* Main Content Grid Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 mb-16">
          {/* Main Column */}
          <div className="lg:col-span-3">
            <section className="space-y-4 h-full">
              <div className="flex items-center justify-between mb-2">
                {/* Title "All Companies" */}
                <Skeleton className="h-7 w-40 bg-white/5" />
              </div>

              <div className="space-y-4">
                <CompanyTableSkeleton />
              </div>
            </section>
          </div>

          {/* Right Sidebar Skeleton */}
          <aside className="hidden lg:block lg:col-span-1">
            <div className="sticky top-24 flex flex-col gap-6">
              {/* Ad Placeholders */}
              <Skeleton className="h-[300px] w-full rounded-xl bg-white/5" />
              <Skeleton className="h-[300px] w-full rounded-xl bg-white/5" />
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}






