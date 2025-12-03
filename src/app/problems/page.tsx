import { Suspense } from "react";
import { getAllProblemsPaginated } from "@/lib/data";
import AllProblemsList from "@/components/problem/all-problems-list";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "All Coding Problems | Byte to Offer",
  description:
    "Browse all coding problems available on Byte to Offer. Practice and improve your coding skills.",
};

export const revalidate = 3600; // Revalidate every hour

export default async function AllProblemsPage() {
  const { problems, hasMore, nextCursor } = await getAllProblemsPaginated({
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

      <Suspense fallback={<div>Loading problems...</div>}>
        <AllProblemsList
          initialProblems={problems}
          initialHasMore={hasMore}
          initialNextCursor={nextCursor}
          itemsPerPage={15}
          initialFilters={{
            difficultyFilter: [],
            lastAskedFilter: [],
            statusFilter: [],
          }}
        />
      </Suspense>
    </div>
  );
}
