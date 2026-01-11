import { CompaniesPageContent } from "@/features/companies/components/companies-page-content";
import { companyService } from "@/features/companies/services/company.service";
import StructuredData from "@/components/seo/structured-data";
import { env } from "@/env";

const APP_URL = env.NEXT_PUBLIC_APP_URL;

export default async function CompaniesListContainer() {
  /* Fetch initial non-filtered data (Page 1) */
  const ITEMS_PER_PAGE = 30;
  
  const companiesResult = await companyService.getCompanies({
    page: 1,
    pageSize: ITEMS_PER_PAGE,
    searchTerm: "",
  });

  if (!companiesResult.isSuccess) {
    throw new Error(companiesResult.error.message);
  }

  const { companies, totalPages, hasMore, nextCursor } = companiesResult.value;

  // Fetch trending
  const trendingSlugs = ["google", "amazon", "microsoft"];
  const trendingPromises = trendingSlugs.map((slug) =>
    companyService.getCompanyBySlug(slug)
  );

  const trendingResults = await Promise.all(trendingPromises);
  const foundTrending = trendingResults
    .filter((result) => result.isSuccess)
    .map((result) => result.value);

  // Fallback logic
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

  // JSON-LD Construction
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: APP_URL,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Companies",
        item: `${APP_URL}/companies`,
      },
    ],
  };

  const itemListJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: companies.map((company: typeof companies[0], index: number) => ({
      "@type": "ListItem",
      position: index + 1,
      name: company.name,
      url: `${APP_URL}/company/${company.slug}`,
    })),
  };

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "What companies can I find interview questions for?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "You can find interview questions for top tech companies including Google, Amazon, Microsoft, Meta, Netflix, Apple, Uber, Airbnb, and many more. We cover a wide range of companies from FAANG to startups.",
        },
      },
      {
        "@type": "Question",
        name: "Are the interview questions real?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes, our questions are collected from recent interview experiences shared by candidates. We verify and curate them to ensure they reflect the current interview patterns.",
        },
      },
      {
        "@type": "Question",
        name: "How can I prepare for a specific company?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "You can browse our company-specific pages to find curated lists of questions, interview guides, and common topics asked by that company. We also provide difficulty breakdowns and trending tags.",
        },
      },
    ],
  };

  return (
    <>
      <StructuredData data={[breadcrumbJsonLd, itemListJsonLd, faqJsonLd]} />
      <CompaniesPageContent
        initialCompanies={companies}
        initialTrendingCompanies={trendingCompanies}
        initialTotalPages={totalPages || 1}
        initialHasMore={hasMore || false}
        initialNextCursor={nextCursor}
      />
    </>
  );
}






