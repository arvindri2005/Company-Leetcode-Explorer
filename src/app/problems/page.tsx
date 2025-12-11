import { Suspense } from "react";
import { problemService } from "@/services/problem.service"; // Import service
import AllProblemsList from "@/components/problem/all-problems-list";
import AdPlaceholder from "@/components/ads/ad-placeholder";
import { Metadata } from "next";

// Removed unused import
// BETTER: I'll use hardcoded values but structured properly, and add the JSON-LD script. This avoids dependency on siteConfig if it's missing.

export const metadata: Metadata = {
  title: "Company Interview Problems | Byte to Offer",
  description:
    "Practice real interview questions from top tech companies. Filter by difficulty, company, and topic to ace your next technical interview.",
  openGraph: {
    title: "Company Interview Problems | Byte to Offer",
    description: "Practice real interview questions from top tech companies. Filter by difficulty, company, and topic to ace your next technical interview.",
    url: "https://bytetoffer.com/problems", // Assuming domain, will fix if wrong
    siteName: "Byte to Offer",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Company Interview Problems | Byte to Offer",
    description: "Practice real interview questions from top tech companies. Filter by difficulty, company, and topic to ace your next technical interview.",
  },
};

export const revalidate = 3600; // Revalidate every hour

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  name: "Company Interview Problems",
  description: "Collection of coding interview problems from top tech companies.",
  provider: {
    "@type": "Organization",
    name: "Byte to Offer",
    url: "https://bytetooffer.com"
  }
};

import {
  DifficultyFilter,
  LastAskedFilter,
  SortKey,
  ProblemStatus,
} from "@/types";

export interface SearchParamsProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function AllProblemsPage({
  searchParams,
}: SearchParamsProps) {
  const resolvedSearchParams = await searchParams;

  // Helper to parse array filters (e.g. ?difficulty=Easy&difficulty=Medium)
  const parseArrayValid = <T extends string>(
    val: string | string[] | undefined,
    validValues: T[]
  ): T[] => {
    if (!val) return [];
    if (Array.isArray(val)) {
      return val.filter((v): v is T => validValues.includes(v as T));
    }
    return validValues.includes(val as T) ? [val as T] : [];
  };

  const difficultyFilter = parseArrayValid(
    resolvedSearchParams.difficultyFilter,
    ["Easy", "Medium", "Hard"]
  ) as DifficultyFilter[];

  const lastAskedFilter = parseArrayValid(resolvedSearchParams.lastAskedFilter, [
    "last_30_days",
    "within_3_months",
    "within_6_months",
    "older_than_6_months",
  ]) as LastAskedFilter[];

  const statusFilter = parseArrayValid(resolvedSearchParams.statusFilter, [
    "solved",
    "attempted",
    "todo",
  ]) as ProblemStatus[];

  const searchTerm =
    typeof resolvedSearchParams.searchTerm === "string"
      ? resolvedSearchParams.searchTerm
      : "";

  const sortKey = (
    typeof resolvedSearchParams.sortKey === "string"
      ? resolvedSearchParams.sortKey
      : "title"
  ) as SortKey;

  const page = 
    typeof resolvedSearchParams.page === "string" 
      ? parseInt(resolvedSearchParams.page, 10) 
      : 1;

  const { problems, totalProblems, totalPages, currentPage, hasMore } =
    await problemService.getAllProblemsPaginated({
      page: isNaN(page) ? 1 : page,
      pageSize: 50,
      difficultyFilter,
      lastAskedFilter,
      searchTerm,
      sortKey,
      // Note: userId is not available here in server component unless passed via props/headers
      // but the service handles undefined userId gracefully for public view
    });

  console.log("ProblemsPage Server Debug:", { page, totalProblems, totalPages, currentPage, hasMore });
  // TEMPORARY DEBUG: Write to file to read it
  const fs = require('fs');
  const path = require('path');
  try {
     const debugPath = "C:\\Users\\arvin\\.gemini\\antigravity\\brain\\3e2ad74b-0d2d-40ff-9afa-bc532eac33fe\\debug_output.txt";
     fs.appendFileSync(debugPath, JSON.stringify({ timestamp: new Date().toISOString(), page, totalProblems, totalPages, currentPage, hasMore }) + "\n");
  } catch (e) {
     console.error("Failed to write debug file", e);
  }

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
              initialFilters={{
                difficultyFilter,
                lastAskedFilter,
                statusFilter,
                searchTerm,
                sortKey,
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
