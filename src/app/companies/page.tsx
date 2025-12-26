import { Suspense } from "react";
import { CompaniesPageContent } from "@/components/company/companies-page-content";
import { companyService } from "@/services/company.service";
import type { Metadata } from "next";
import { env } from "@/env";

export const revalidate = 2592000; // 1 month

const APP_URL = env.NEXT_PUBLIC_APP_URL;

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

  const trendingResult = await Promise.all(trendingPromises);
  const foundTrending = trendingResult.filter(
    (c): c is NonNullable<typeof c> => c !== undefined && c !== null
  );

  // Fallback: If < 3 trending, fill with companies from the main list
  // We want to ensure we have at least 3 companies if possible
  const distinctTrending = new Map<string, typeof foundTrending[0]>();
  foundTrending.forEach((c) => distinctTrending.set(c.id, c));

  if (distinctTrending.size < 3) {
    for (const company of companies) {
      if (distinctTrending.size >= 3) break;
      if (!distinctTrending.has(company.id)) {
        distinctTrending.set(company.id, company);
      }
    }
  }

  const trendingCompanies = Array.from(distinctTrending.values()).slice(0, 3);

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
