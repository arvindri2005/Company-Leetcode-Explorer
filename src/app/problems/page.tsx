import { Suspense } from "react";
import { problemService } from "@/services/problem.service"; // Import service
import AllProblemsList from "@/components/problem/all-problems-list";
import AdPlaceholder from "@/components/ads/ad-placeholder";
import { Metadata } from "next";

// Removed unused import
// BETTER: I'll use hardcoded values but structured properly, and add the JSON-LD script. This avoids dependency on siteConfig if it's missing.

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://bytetooffer.com";

export const metadata: Metadata = {
  title: "Company Interview Problems | Byte to Offer",
  description:
    "Practice real interview questions from top tech companies. Filter by difficulty, company, and topic to ace your next technical interview.",
  openGraph: {
    title: "Company Interview Problems | Byte to Offer",
    description: "Practice real interview questions from top tech companies. Filter by difficulty, company, and topic to ace your next technical interview.",
    url: `${APP_URL}/problems`,
    siteName: "Byte to Offer",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Company Interview Problems | Byte to Offer",
    description: "Practice real interview questions from top tech companies. Filter by difficulty, company, and topic to ace your next technical interview.",
  },
};

export const revalidate = 2592000; // 1 month

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  name: "Company Interview Problems",
  description: "Collection of coding interview problems from top tech companies.",
  provider: {
    "@type": "Organization",
    name: "Byte to Offer",
    url: APP_URL
  }
};

import {
  DifficultyFilter,
  LastAskedFilter,
  SortKey,
  ProblemStatus,
} from "@/types";


export default async function AllProblemsPage() {
  
  /* eslint-disable-next-line @typescript-eslint/no-unused-vars */
  const { problems, totalProblems, totalPages, currentPage, hasMore, nextCursor } =
    await problemService.getAllProblemsPaginated({
      page: 1,
      pageSize: 50,
      difficultyFilter: [],
      lastAskedFilter: [],
      searchTerm: "",
      sortKey: "title",
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
              itemsPerPage={50}
              totalPages={totalPages || 1}
              currentPage={currentPage || 1}
              hasMore={hasMore}
              initialNextCursor={nextCursor}
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
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </div>
  );
}
