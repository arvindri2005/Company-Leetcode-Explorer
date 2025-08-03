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

interface CompanyPageProps {
  params: { companySlug: string };
}

export async function generateMetadata({ params }: CompanyPageProps): Promise<Metadata> {
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

export default async function CompanyPage({ params }: CompanyPageProps) {
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
