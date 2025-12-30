import { Suspense } from "react";
import AdPlaceholder from "@/components/ads/ad-placeholder";
import { Metadata } from "next";
import { env } from "@/env";
import ErrorBoundary from "@/components/ui/error-boundary";
import ProblemListContainer from "./problem-list-container";
import ProblemListErrorFallback from "@/components/problem/problem-list-error-fallback";
import { Skeleton } from "@/components/ui/skeleton";
import StructuredData from "@/components/seo/structured-data";

const APP_URL = env.NEXT_PUBLIC_APP_URL;

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

export default function AllProblemsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-2 text-balance">
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
          <ErrorBoundary fallback={<ProblemListErrorFallback />}>
            <Suspense fallback={<div className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-24 w-full" />
                ))}
              </div>
            </div>}>
              <ProblemListContainer />
            </Suspense>
          </ErrorBoundary>
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
      <StructuredData data={jsonLd} />
    </div>
  );
}
