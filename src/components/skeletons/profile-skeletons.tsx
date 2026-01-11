import React from "react";

import { ProblemCardSkeleton } from "@/components/skeletons/problem-skeletons";
import { Card, CardContent,CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function UserInfoCardSkeleton() {
  return (
    <Card className="bg-card border border-border rounded-xl mb-8 shadow-sm overflow-hidden relative">
      <CardHeader className="p-6">
        <div className="flex flex-col sm:flex-row items-start gap-6">
          {/* Avatar Skeleton */}
          <Skeleton className="h-24 w-24 rounded-full ring-4 ring-primary/10 shrink-0" />

          <div className="flex-grow space-y-3 w-full pt-1">
            <div className="flex justify-between items-start gap-4 w-full">
              <div className="space-y-2 w-full">
                 {/* Name Skeleton */}
                <Skeleton className="h-8 w-48 sm:w-64" />
                 {/* Email Skeleton */}
                <Skeleton className="h-4 w-40 sm:w-52" />
              </div>

              {/* Desktop Actions Skeleton */}
              <div className="hidden sm:flex items-center gap-2">
                <Skeleton className="h-9 w-28" />
                <Skeleton className="h-9 w-24" />
              </div>
            </div>

            {/* Badges Skeleton */}
             <div className="flex flex-wrap gap-2 pt-2">
                <Skeleton className="h-6 w-20 rounded-full" />
                <Skeleton className="h-6 w-32 rounded-full" />
             </div>

            {/* Mobile Actions Skeleton */}
            <div className="sm:hidden pt-4 border-t border-border mt-4 w-full grid grid-cols-2 gap-3">
               <Skeleton className="h-9 w-full" />
               <Skeleton className="h-9 w-full" />
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
             <div className="flex items-center">
                 <Skeleton className="h-6 w-6 mr-3" />
                 <Skeleton className="h-8 w-48" />
             </div>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
             {[...Array(3)].map((_, i) => (
                 <div key={i} className="p-4 bg-muted/30 rounded-lg flex flex-col items-center">
                     <Skeleton className="h-8 w-8 mb-2 rounded-full" />
                     <Skeleton className="h-8 w-12 mb-1" />
                     <Skeleton className="h-4 w-16" />
                 </div>
             ))}
          </CardContent>
        </Card>
    );
}

export function ProfilePageSkeleton() {
  return (
    <div className="container mx-auto p-4 lg:p-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column */}
        <div className="lg:col-span-4 xl:col-span-3 space-y-8">
          <div className="sticky top-24 space-y-8">
            <UserInfoCardSkeleton />
            <ProgressStatsSkeleton />
          </div>
        </div>

        {/* Right Column */}
        <div className="lg:col-span-8 xl:col-span-9">
            {/* Tabs List Skeleton */}
            <div className="grid w-full grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 mb-6">
                 {[...Array(6)].map((_, i) => (
                     <Skeleton key={i} className="h-10 w-full rounded-sm" />
                 ))}
            </div>

            {/* Tab Content Skeleton (Simulating Bookmarks) */}
            <Card className="bg-card border border-border rounded-xl shadow-sm">
                 <CardHeader>
                     <Skeleton className="h-7 w-64" />
                 </CardHeader>
                 <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[...Array(6)].map((_, i) => (
                           <ProblemCardSkeleton key={i} />
                        ))}
                    </div>
                 </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}






