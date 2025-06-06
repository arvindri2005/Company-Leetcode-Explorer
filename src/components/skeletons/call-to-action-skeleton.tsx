
import { Skeleton } from "@/components/ui/skeleton";

export const CallToActionSkeleton = () => {
  return (
    <section className="text-center py-12 mt-10">
      <div className="container mx-auto px-4">
        <Skeleton className="h-8 w-3/4 mx-auto mb-6 rounded-md" /> {/* Title Skeleton */}
        <Skeleton className="h-6 w-1/2 mx-auto mb-8 rounded-md" /> {/* Subtitle Skeleton */}
        <Skeleton className="h-12 w-48 mx-auto rounded-md" />    {/* Button Skeleton */}
      </div>
    </section>
  );
};
