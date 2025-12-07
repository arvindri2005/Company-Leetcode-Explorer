import { Suspense } from "react";
import { problemService } from "@/services/problem.service"; // Import service
import AllProblemsList from "@/components/problem/all-problems-list";
import AdPlaceholder from "@/components/ads/ad-placeholder";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "All Coding Problems | Byte to Offer",
  description:
    "Browse all coding problems available on Byte to Offer. Practice and improve your coding skills.",
};

export const revalidate = 3600; // Revalidate every hour

export default async function AllProblemsPage() {
  const { problems, hasMore, nextCursor } = await problemService.getAllProblemsPaginated({
    pageSize: 15,
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-2">
          All Coding Problems
        </h1>
        <p className="text-muted-foreground">
          Browse our extensive collection of coding problems to practice and
          prepare for your interviews.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-3">
          <Suspense fallback={<div>Loading problems...</div>}>
            <AllProblemsList
              initialProblems={problems}
              initialHasMore={hasMore ?? false}
              initialNextCursor={nextCursor}
              itemsPerPage={15}
              initialFilters={{
                difficultyFilter: [],
                lastAskedFilter: [],
                statusFilter: [],
                searchTerm: "",
                sortKey: "title",
              }}
            />
          </Suspense>
        </div>

        {/* Sidebar */}
        <aside className="hidden lg:block lg:col-span-1">
          <div className="sticky top-24 h-[calc(100vh-8rem)] flex flex-col gap-4">
            <div className="flex-1">
               <AdPlaceholder title="Sponsored" className="h-full" />
            </div>
            <div className="flex-1">
               <AdPlaceholder title="Advertisement" className="h-full" />
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
