import { CompaniesView } from "./companies-view";
import type { Metadata } from "next";

type CompaniesPageProps = {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
};

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://bytetooffer.com";

export async function generateMetadata(
  props: CompaniesPageProps,
): Promise<Metadata> {
  const pageTitle = "Top Tech Companies Interview Questions & Prep | Byte to Offer";
  const pageDescription =
    "Prepare for your next software engineering interview with real questions from top tech companies like Google, Amazon, Microsoft, Meta, and more. Access company-specific guides, interview patterns, and coding problems.";
  const canonicalUrl = `${APP_URL}/companies`;

  return {
    title: pageTitle,
    description: pageDescription,
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
      title: pageTitle,
      description: pageDescription,
      url: canonicalUrl,
      type: "website",
      images: [{ url: `${APP_URL}/icon.png`, alt: "ByteToOffer Logo" }],
    },
    alternates: {
      canonical: canonicalUrl,
    },
  };
}

export default async function CompaniesPage(props: CompaniesPageProps) {
  const searchParams = await props.searchParams;
  
  // This is the main page, so page is always 1
  return <CompaniesView page={1} searchParams={searchParams} />;
}
