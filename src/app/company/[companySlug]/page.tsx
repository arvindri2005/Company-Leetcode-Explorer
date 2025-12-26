/**
 * @fileoverview Defines the dynamic page for displaying a single company's details and problems.
 *
 * This file contains the server component for the `/company/[companySlug]` route.
 * It fetches the company's data based on the slug, generates dynamic metadata for SEO,
 * retrieves the initial list of associated problems, and renders the main page layout.
 * It also includes `generateStaticParams` to pre-render pages for known companies at build time.
 */
import { companyService } from "@/services/company.service";
import { problemService } from "@/services/problem.service";
import type { Metadata } from "next";
import CompanyNotFound from "@/components/company/page/company-not-found";
import CompanyPage from "@/components/company/page/company-page";
import { getLogoUrl, capitalizeWords } from "@/lib/utils";
import { Company } from "@/types";
import { env } from "@/env";

import StructuredData from "@/components/seo/structured-data";

export const revalidate = 2592000; // 1 month

const APP_URL = env.NEXT_PUBLIC_APP_URL;

/**
 * Defines the props structure for the CompanyPage, including the dynamic route parameters.
 */
interface CompanyPageProps {
  params: Promise<{ companySlug: string }>;
}

function getStructuredData(company: Company): Array<Record<string, any>> {
  const breadcrumbList = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: `${APP_URL}/` },
      {
        "@type": "ListItem",
        position: 2,
        name: "Companies",
        item: `${APP_URL}/companies`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: company.name,
        item: `${APP_URL}/company/${company.slug}`,
      },
    ],
  };

  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: company.name,
    url: `${APP_URL}/company/${company.slug}`,
    logo: getLogoUrl(company.logo),
    description: `Find coding interview questions and preparation material for ${company.name}.`,
    ...(company.website && { sameAs: [company.website] }),
  };

  const companyName = capitalizeWords(company.name);
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "What programming languages can I use?",
        acceptedAnswer: {
          "@type": "Answer",
          text: `Most companies, including ${companyName}, allow you to use any mainstream programming language you are comfortable with, such as Python, Java, C++, or JavaScript. It's best to stick to the language you know best.`,
        },
      },
      {
        "@type": "Question",
        name: "How hard are the interview questions?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Questions typically range from Medium to Hard difficulty on platforms like LeetCode. It's important to be comfortable with optimizing your solutions for time and space complexity.",
        },
      },
      {
        "@type": "Question",
        name: `Does ${companyName} ask behavioral questions?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes, behavioral questions are a key part of the interview. Be prepared to discuss your past experiences, challenges you've faced, and how you work in a team. Using the STAR method (Situation, Task, Action, Result) is highly recommended.",
        },
      },
      {
        "@type": "Question",
        name: "How long does the process take?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "The entire process from application to offer can take anywhere from a few weeks to a couple of months, depending on the role and the company's current hiring volume.",
        },
      },
    ],
  };

  return [organizationSchema, breadcrumbList, faqSchema];
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
export async function generateMetadata(
  props: CompanyPageProps,
): Promise<Metadata> {
  const params = await props.params;
  const company = await companyService.getCompanyBySlug(params.companySlug);

  if (!company) {
    return {
      title: "Company Not Found",
      description: "The requested company page does not exist.",
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const problemCount = company.problemCount ?? 0;
  const companyName = capitalizeWords(company.name);
  const title = `${companyName} Interview Questions`;
  const description = `Prepare for your ${companyName} interview with ${problemCount} real coding questions. Master common patterns and get expert tips to land your dream job at ${companyName}.`;

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
    `how to get into ${company.name}`,
    `${company.name} hiring process`,
  ];

  const tagKeywords = company.commonTags?.map((ct) => ct.tag) ?? [];
  const uniqueKeywords = Array.from(
    new Set([...companyKeywords, ...tagKeywords]),
  ).slice(0, 20);

  const logoUrl = getLogoUrl(company.logo);

  return {
    title,
    description,
    keywords: uniqueKeywords,
    alternates: {
      canonical: `${APP_URL}/company/${company.slug}`,
    },
    robots: {
      index: true,
      follow: true,
    },
    openGraph: {
      title,
      description,
      url: `${APP_URL}/company/${company.slug}`,
      siteName: "Byte to Offer",
      images: logoUrl
        ? [{ url: logoUrl, alt: `${companyName} logo` }]
        : [],
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: logoUrl ? [logoUrl] : [],
    },
  };
}

/**
 * Renders the page for a specific company.
 *
 * This server component fetches the company's details based on the slug from the URL.
 * If the company is not found, it renders a `CompanyNotFound` component. Otherwise, it
 * renders the `CompanyPage` component with the fetched company data.
 *
 * @param {CompanyPageProps} props - The props containing the dynamic route parameters.
 * @returns {Promise<JSX.Element>} The rendered company page or a not-found component.
 */
export default async function CompanyPageWrapper(props: CompanyPageProps) {
  const params = await props.params;
  
  // Step 1: Parallelize Fetching
  // We fetch company and problems concurrently.
  // problemService.getProblemsByCompanySlug handles the company lookup internally if needed,
  // but we also need the company object for the page itself.
  const [company, problemsResponse] = await Promise.all([
      companyService.getCompanyBySlug(params.companySlug),
      problemService.getProblemsByCompanySlug(params.companySlug, {
          pageSize: 40, // Match INITIAL_ITEMS_PER_PAGE from CompanyPage
      })
  ]);

  if (!company) {
    return <CompanyNotFound companySlug={params.companySlug} />;
  }

  // Step 2: Merge User Status (Hollow Caching)
  // Logic to merge user status if userId is available.
  // Currently assuming public view or hydration handles this, 
  // as userId is not strictly available in this server component context without additional auth setup.
  // If we had userId:
  // const userStatuses = await problemService.getUserProblemStatuses(userId, problemsResponse.problems.map(p => p.id));
  // merge(problemsResponse.problems, userStatuses);
  
  const structuredData = getStructuredData(company);

  return (
    <>
      <StructuredData data={structuredData} />
      <CompanyPage 
        company={company}
        initialPaginatedProblems={problemsResponse}
      />
    </>
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
    const companySlugs = await companyService.getAllCompanySlugs();
    if (!companySlugs || companySlugs.length === 0) {
      return [];
    }
    return companySlugs.map((slug) => ({
      companySlug: slug,
    }));
  } catch (error) {
    console.error(
      "[generateStaticParams /company/[companySlug]] Error fetching company slugs:",
      error,
    );
    return [];
  }
}
