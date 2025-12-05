import { CompaniesView } from "@/app/companies/companies-view";
import type { Metadata } from "next";

type PaginatedCompaniesPageProps = {
  params: Promise<{ pageNumber: string }>;
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
};

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://bytetooffer.com";

export async function generateMetadata(
  props: PaginatedCompaniesPageProps,
): Promise<Metadata> {
  const params = await props.params;
  const page = parseInt(params.pageNumber);
  
  const pageTitle = `Top Tech Companies Interview Questions & Prep - Page ${page} | Byte to Offer`;
  const pageDescription =
    "Prepare for your next software engineering interview with real questions from top tech companies like Google, Amazon, Microsoft, Meta, and more. Access company-specific guides, interview patterns, and coding problems.";
  const canonicalUrl = `${APP_URL}/companies/page/${page}`;

  return {
    title: pageTitle,
    description: pageDescription,
    alternates: {
      canonical: canonicalUrl,
    },
    robots: {
      index: true,
      follow: true,
    }
  };
}

export default async function PaginatedCompaniesPage(props: PaginatedCompaniesPageProps) {
  const params = await props.params;
  const searchParams = await props.searchParams;
  const page = parseInt(params.pageNumber);
  
  if (isNaN(page) || page < 1) {
    // Ideally redirect to /companies, but for now just show page 1
    return <CompaniesView page={1} searchParams={searchParams} />;
  }

  return <CompaniesView page={page} searchParams={searchParams} />;
}
