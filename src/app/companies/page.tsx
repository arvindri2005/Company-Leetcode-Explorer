import { Suspense } from "react";
import { CompaniesPageContent } from "@/components/company/companies-page-content";
import { companyService } from "@/services/company.service";
import type { Metadata } from "next";

export const revalidate = 2592000; // 1 month

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://bytetooffer.com";

export const metadata: Metadata = {
  title: "Top Tech Companies Interview Questions & Prep | Byte to Offer",
  description:
    "Prepare for your next software engineering interview with real questions from top tech companies like Google, Amazon, Microsoft, Meta, and more. Access company-specific guides, interview patterns, and coding problems.",
  keywords: [
    "Tech Company Interview Questions",
    "Google Interview Prep",
    "Amazon SDE Interview",
    "Microsoft Coding Questions",
    "Meta Interview Questions",
    "Software Engineer Interview",
    "Coding Interview Practice",
    "FAANG Interview Prep",
    "Byte to Offer Companies",
    "System Design Interview",
    "Frontend Interview Questions",
    "Backend Interview Questions",
    "Full Stack Interview",
    "Coding Challenges",
    "Algorithm Practice",
  ],
  openGraph: {
    title: "Top Tech Companies Interview Questions & Prep | Byte to Offer",
    description:
      "Prepare for your next software engineering interview with real questions from top tech companies like Google, Amazon, Microsoft, Meta, and more. Access company-specific guides, interview patterns, and coding problems.",
    url: `${APP_URL}/companies`,
    type: "website",
    images: [{ url: `${APP_URL}/icon.png`, alt: "ByteToOffer Logo" }],
  },
  alternates: {
    canonical: `${APP_URL}/companies`,
  },
};

export default async function CompaniesPage() {
  /* Fetch initial non-filtered data (Page 1) */
  const ITEMS_PER_PAGE = 30;
  const { companies, totalPages, hasMore, nextCursor } = await companyService.getCompanies({
    page: 1,
    pageSize: ITEMS_PER_PAGE,
    searchTerm: "",
  });

  // Fetch trending
  const trendingSlugs = ["google", "amazon", "microsoft"];
  const trendingPromises = trendingSlugs.map((slug) =>
    companyService.getCompanyBySlug(slug)
  );
  
  // Use Promise.allSettled or just Promise.all depending on error handling needed. 
  // Assuming Promise.all is fine as in original code.
  const trendingResult = await Promise.all(trendingPromises);
  const trendingCompanies = trendingResult.filter((c): c is NonNullable<typeof c> => c !== undefined && c !== null);

  return (
    <Suspense fallback={<div className="container mx-auto px-4 py-8 text-center text-gray-400">Loading companies...</div>}>
      <CompaniesPageContent
        initialCompanies={companies}
        initialTrendingCompanies={trendingCompanies}
        initialTotalPages={totalPages || 1}
        initialHasMore={hasMore || false}
        initialNextCursor={nextCursor}
        appUrl={APP_URL}
      />
    </Suspense>
  );
}
