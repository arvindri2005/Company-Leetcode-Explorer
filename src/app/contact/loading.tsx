import { Skeleton } from "@/shared/components/ui/skeleton";

export default function ContactLoading() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <Skeleton className="h-10 w-48 mb-4" />
      <Skeleton className="h-5 w-96 mb-8" />
      <div className="space-y-6">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-12 w-32" />
      </div>
    </div>
  );
}
