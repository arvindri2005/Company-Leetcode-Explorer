import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";

/**
 * Skeleton for the InsightSection component in ProblemInsightsDialog.
 * Mimics the structure:
 * - Card
 *   - Header (Icon + Title)
 *   - Content (Text/List)
 */
export function InsightSectionSkeleton() {
  return (
    <Card className="bg-muted/20 border-none shadow-sm">
      <CardHeader className="flex flex-row items-center space-x-3 pb-3">
        {/* Icon Skeleton */}
        <Skeleton className="h-6 w-6 rounded-md" />
        {/* Title Skeleton */}
        <Skeleton className="h-6 w-48 rounded-md" />
      </CardHeader>
      <CardContent className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-[90%]" />
        <Skeleton className="h-4 w-[95%]" />
      </CardContent>
    </Card>
  );
}

/**
 * Skeleton for the ProblemInsightsDialog content.
 * Renders multiple InsightSectionSkeletons.
 */
export function ProblemInsightsSkeleton() {
  return (
    <div className="space-y-4 py-2" role="status" aria-busy="true" aria-label="Loading insights">
      <InsightSectionSkeleton />
      <InsightSectionSkeleton />
      <InsightSectionSkeleton />
    </div>
  );
}

/**
 * Skeleton for the SimilarProblemCard component in SimilarProblemsDialog.
 * Mimics the structure:
 * - Card
 *   - Header (Title + Difficulty Badge + Platform Info)
 *   - Content (Tags + Similarity Reason)
 *   - Footer (Button)
 */
export function SimilarProblemCardSkeleton() {
  return (
    <Card className="bg-muted/20 border-none shadow-sm">
      <CardHeader>
        <div className="flex justify-between items-start gap-2">
          {/* Title Skeleton */}
          <Skeleton className="h-6 w-2/3 rounded-md" />
          {/* Difficulty Badge Skeleton */}
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
        {/* Platform Info Skeleton */}
        <div className="flex items-center gap-2 pt-2">
          <Skeleton className="h-4 w-4 rounded-full" />
          <Skeleton className="h-4 w-24 rounded-md" />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Tags Section */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-4 rounded-md" />
            <Skeleton className="h-4 w-12 rounded-md" />
          </div>
          <div className="flex flex-wrap gap-2">
            <Skeleton className="h-5 w-16 rounded-full" />
            <Skeleton className="h-5 w-20 rounded-full" />
            <Skeleton className="h-5 w-14 rounded-full" />
          </div>
        </div>
        {/* Similarity Reason Section */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-4 rounded-md" />
            <Skeleton className="h-4 w-32 rounded-md" />
          </div>
          <div className="space-y-1">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-[90%]" />
          </div>
        </div>
      </CardContent>
      <CardFooter>
        {/* Button Skeleton */}
        <Skeleton className="h-9 w-full rounded-md" />
      </CardFooter>
    </Card>
  );
}

/**
 * Skeleton for the SimilarProblemsDialog content.
 * Renders multiple SimilarProblemCardSkeletons.
 */
export function SimilarProblemsSkeleton() {
  return (
    <div className="space-y-4 py-2" role="status" aria-busy="true" aria-label="Loading similar problems">
      <SimilarProblemCardSkeleton />
      <SimilarProblemCardSkeleton />
    </div>
  );
}
