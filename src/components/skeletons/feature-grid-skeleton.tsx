
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardHeader, CardFooter, CardContent } from "@/components/ui/card";

const FeatureCardSkeleton = () => (
  <Card className="flex flex-col h-full shadow-lg">
    <CardHeader className="flex flex-row items-start gap-4 pb-4">
      <Skeleton className="h-12 w-12 rounded-md shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
      </div>
    </CardHeader>
    <CardContent className="flex-grow" />
    <CardFooter>
      <Skeleton className="h-10 w-full" />
    </CardFooter>
  </Card>
);

export const FeatureGridSkeleton = () => {
  return (
    <section className="container mx-auto px-4 py-8">
      <Skeleton className="h-8 w-1/2 mx-auto mb-10 rounded-md" /> {/* Title Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {[...Array(6)].map((_, i) => (
          <FeatureCardSkeleton key={i} />
        ))}
      </div>
    </section>
  );
};
