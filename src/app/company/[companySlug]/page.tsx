/**
 * @fileoverview Defines the dynamic page for displaying a single company's details and problems.
 *
 * This file contains the server component for the `/company/[companySlug]` route.
 * It fetches the company's data based on the slug, generates dynamic metadata for SEO,
 * retrieves the initial list of associated problems, and renders the main page layout.
 * It also includes `generateStaticParams` to pre-render pages for known companies at build time.
 */
import { getCompanyBySlug, getProblemsByCompanyFromDb, getAllCompanySlugs } from '@/lib/data';
import type { Company, LeetCodeProblem, ProblemListFilters } from '@/types';
import type { Metadata } from 'next';
import CompanyHeader from '@/components/company/company-header';
import CompanyNotFound from '@/components/company/page/company-not-found';
import CompanyPageHeader from '@/components/company/page/company-page-header';
import ProblemLoadError from '@/components/company/page/problem-load-error';
import NoProblemsAvailable from '@/components/company/page/no-problems-available';
import CompanyTabs from '@/components/company/page/company-tabs';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://bytetooffer.com';
const INITIAL_ITEMS_PER_PAGE = 15;

/**
 * Defines the props structure for the CompanyPage, including the dynamic route parameters.
 */
interface CompanyPageProps {
  params: Promise<{ companySlug: string }>;
}

/**
 * Dynamically generates metadata for a specific company page.
 *
 * This function fetches company details by its slug to create a highly relevant
 * title, description, keywords, and Open Graph tags for SEO. It also generates
 * structured data (BreadcrumbList, Organization) for rich search results. If the
 * company is not found, it returns metadata for a "Not Found" page.
 *
 * @param {CompanyPageProps} props - The props containing the dynamic route parameters.
 * @returns {Promise<Metadata>} A promise that resolves to the generated metadata object.
 */
export async function generateMetadata(props: CompanyPageProps): Promise<Metadata> {
  const params = await props.params;
  const company = await getCompanyBySlug(params.companySlug);

  if (!company) {
    return {
      title: 'Company Not Found',
      description: 'The requested company page does not exist.',
    };
  }

  const problemCount = company.problemCount ?? 0;
  const title = `${company.name} Interview Problems`;
  const description = `Explore ${problemCount} coding interview questions from ${company.name}. Practice problems, understand common patterns, and prepare for your technical interviews.`;

  const companyKeywords = [
    company.name,
    `${company.name} interview questions`,
    `${company.name} coding problems`,
    `${company.name} LeetCode problems`,
    `${company.name} interview prep`,
    `${company.name} coding interview`,
    `${company.name} software engineer interview`,
    `${company.name} technical interview`,
    `${company.name} LeetCode`,
    `${company.name} interview preparation`,
    `${company.name} interview practice`,
    `${company.name} coding challenges`,
    `${company.name} data structures`,
    `${company.name} algorithms`,
    `${company.name} tech interview questions`,
    `${company.name} coding interview questions`,
  ];

  const tagKeywords = company.commonTags?.map(ct => ct.tag) ?? [];
  const uniqueKeywords = Array.from(new Set([...companyKeywords, ...tagKeywords])).slice(0, 15);

  const breadcrumbList = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home", "item": `${APP_URL}/` },
      { "@type": "ListItem", "position": 2, "name": "Companies", "item": `${APP_URL}/companies` },
      { "@type": "ListItem", "position": 3, "name": company.name, "item": `${APP_URL}/company/${company.slug}` }
    ]
  };

  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": company.name,
    "url": `${APP_URL}/company/${company.slug}`,
    "logo": company.logo,
    "description": `Find coding interview questions and preparation material for ${company.name}.`,
    ...(company.website && { "sameAs": [company.website] }),
  };

  return {
      title,
      description,
      keywords: uniqueKeywords,
      alternates: {
          canonical: `${APP_URL}/company/${company.slug}`,
      },
      openGraph: {
          title,
          description,
          url: `${APP_URL}/company/${company.slug}`,
          siteName: "Byte to Offer",
          images: company.logo
              ? [{ url: company.logo, alt: `${company.name} logo` }]
              : [],
          type: "article"
      },
      twitter: {
          card: "summary_large_image",
          title,
          description,
          images: company.logo ? [company.logo] : [],
      },
      other: {
          'script[type="application/ld+json"]': JSON.stringify([
              organizationSchema,
              breadcrumbList,
          ]),
      },
  };
}

/**
 * Renders the page for a specific company.
 *
 * This server component fetches the company's details based on the slug from the URL.
 * If the company is not found, it renders a `CompanyNotFound` component. Otherwise, it
 * fetches the first page of problems for that company. It then passes this initial data
 * to the `CompanyTabs` client component, which handles the interactive display of
 * problems, AI tools, and other company-specific information. It also handles
 * error states for problem fetching.
 *
 * @param {CompanyPageProps} props - The props containing the dynamic route parameters.
 * @returns {Promise<JSX.Element>} The rendered company page or a not-found component.
 */
export default async function CompanyPage(props: CompanyPageProps) {
  const params = await props.params;
  const company = await getCompanyBySlug(params.companySlug);

  if (!company) {
    return <CompanyNotFound companySlug={params.companySlug} />;
  }

  const initialFilters: ProblemListFilters = {
    difficultyFilter: 'all',
    lastAskedFilter: 'all',
    statusFilter: 'all',
    searchTerm: '',
    sortKey: 'title',
  };

  const initialPaginatedProblemsData = await getProblemsByCompanyFromDb(company.id, {
    pageSize: INITIAL_ITEMS_PER_PAGE
  });

  if ('error' in initialPaginatedProblemsData) {
    console.error("Error fetching initial problems for company page:", initialPaginatedProblemsData.error);
    return (
        <div className="container mx-auto px-4 py-4 max-w-6xl">
            <CompanyPageHeader companyName={company.name} />
            <CompanyHeader company={company} />
            <ProblemLoadError companyName={company.name} error={initialPaginatedProblemsData.error as string} />
        </div>
    );
  }

  const {
    problems: initialProblems,
    hasMore: initialHasMore,
    nextCursor: initialNextCursor,
    totalProblems: displayProblemCount
  } = initialPaginatedProblemsData;

  const hasProblems = displayProblemCount > 0;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-4 max-w-6xl">
        <CompanyPageHeader companyName={company.name} />
        <CompanyHeader company={company} />

        {hasProblems ? (
          <CompanyTabs
            company={company}
            displayProblemCount={displayProblemCount}
            initialProblems={initialProblems}
            initialHasMore={initialHasMore ?? false}
            initialNextCursor={initialNextCursor}
            initialFilters={initialFilters}
            itemsPerPage={INITIAL_ITEMS_PER_PAGE}
          />
        ) : (
          <NoProblemsAvailable companyName={company.name} companyId={company.id} />
        )}
      </div>
    </div>
  );
}

/**
 * Generates static paths for known company pages at build time.
 *
 * This Next.js function is used during the build process to fetch all existing
 * company slugs. It creates a list of `params` objects, allowing Next.js to
 * pre-render a static HTML page for each company. This improves performance
 * and SEO for the most important company pages.
 *
 * @returns {Promise<Array<{ companySlug: string }>>} A promise that resolves to an array of
 * objects, where each object contains a `companySlug` for a page to be statically generated.
 */
export async function generateStaticParams() {
  try {
    const companySlugs = await getAllCompanySlugs();
    if (!companySlugs || companySlugs.length === 0) {
      return [];
    }
    return companySlugs.map((slug) => ({
      companySlug: slug,
    }));
  } catch (error) {
    console.error("[generateStaticParams /company/[companySlug]] Error fetching company slugs:", error);
    return [];
  }
}
