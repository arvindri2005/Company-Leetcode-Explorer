import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

const CompanyCardSkeleton = () => {
  return (
    <Card className={cn(
      "group relative flex flex-col h-full transition-all duration-300 ease-out overflow-hidden rounded-xl",
      "bg-white/5 backdrop-blur-lg",
      "border border-white/10",
    )}>
      <CardContent className="p-4 flex flex-col h-full">
        <div className="flex items-center gap-3">
          <Skeleton className="h-12 w-12 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
        <div className="flex-grow" />
        <Skeleton className="h-10 w-full mt-4 rounded-full" />
      </CardContent>
    </Card>
  );
};

export default CompanyCardSkeleton;
