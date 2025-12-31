import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardHeader, CardContent } from "@/components/ui/card";

export function UserInfoCardSkeleton() {
  return (
    <Card className="bg-card border border-border rounded-xl mb-8 shadow-sm overflow-hidden relative">
      <CardHeader className="p-6">
        <div className="flex flex-col sm:flex-row items-start gap-6">
          {/* Avatar Skeleton */}
          <Skeleton className="h-24 w-24 rounded-full ring-4 ring-primary/10 shrink-0" />

          <div className="flex-grow space-y-3 w-full pt-1">
            <div className="flex justify-between items-start gap-4">
              <div className="space-y-2 w-full">
                {/* Name Skeleton */}
                <div className="flex items-center gap-2">
                  <Skeleton className="h-9 w-48 sm:w-64" />
                  <Skeleton className="h-8 w-8 rounded-full" />
                </div>
                {/* Email Skeleton */}
                <div className="flex items-center gap-2">
                  <Skeleton className="h-3.5 w-3.5 rounded-full" />
                  <Skeleton className="h-4 w-40" />
                </div>
              </div>

              {/* Logout Button Skeleton */}
              <Skeleton className="hidden sm:flex h-9 w-24" />
            </div>

            {/* Metadata Badges Skeleton */}
            <div className="flex flex-wrap gap-2 pt-1">
              <Skeleton className="h-6 w-20 rounded-full" />
              <Skeleton className="h-6 w-32 rounded-full" />
            </div>

            {/* Mobile Logout Skeleton */}
            <div className="sm:hidden pt-4 border-t border-border mt-4 w-full">
               <Skeleton className="h-10 w-full" />
            </div>
          </div>
        </div>
      </CardHeader>
    </Card>
  );
}

export function ProgressStatsSkeleton() {
  return (
    <Card className="bg-card border border-border rounded-xl mb-8 shadow-sm">
      <CardHeader>
        <Skeleton className="h-8 w-40 mb-2" />
      </CardHeader>
      <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="p-4 bg-muted/30 rounded-lg flex flex-col items-center">
            <Skeleton className="h-8 w-8 rounded-full mb-2" />
            <Skeleton className="h-9 w-12 mb-1" />
            <Skeleton className="h-4 w-16" />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export function ProfilePageSkeleton() {
  return (
    <div className="container mx-auto p-4 lg:p-8 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column Skeleton */}
        <div className="lg:col-span-4 xl:col-span-3 space-y-8">
          <div className="sticky top-24 space-y-8">
            <UserInfoCardSkeleton />
            <ProgressStatsSkeleton />
          </div>
        </div>

        {/* Right Column Skeleton */}
        <div className="lg:col-span-8 xl:col-span-9">
          {/* Tabs List Skeleton */}
          <div className="grid w-full grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 mb-6">
             {[...Array(6)].map((_, i) => (
               <Skeleton key={i} className="h-10 w-full rounded-md" />
             ))}
          </div>

          {/* Active Tab Content Skeleton (Mimicking Bookmarks List) */}
          <Card className="bg-card border border-border rounded-xl shadow-sm">
            <CardHeader>
              <Skeleton className="h-7 w-48" />
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Use generic card skeletons for problems */}
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="flex flex-col bg-card border border-border/40 rounded-lg overflow-hidden h-32 p-4 gap-3">
                     <div className="flex items-center gap-3">
                        <Skeleton className="h-8 w-8 rounded-full shrink-0" />
                        <div className="flex-1 space-y-2">
                           <Skeleton className="h-5 w-3/4" />
                           <Skeleton className="h-4 w-12 rounded-full" />
                        </div>
                     </div>
                     <div className="mt-auto flex justify-end gap-2">
                        <Skeleton className="h-8 w-8 rounded-md" />
                        <Skeleton className="h-8 w-8 rounded-md" />
                     </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
