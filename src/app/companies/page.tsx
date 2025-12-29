import { Suspense } from "react";
import type { Metadata } from "next";
import { env } from "@/env";
import ErrorBoundary from "@/components/ui/error-boundary";
import CompanyListErrorFallback from "@/components/company/company-list-error-fallback";
import CompaniesListContainer from "./companies-list-container";
import StructuredData from "@/components/seo/structured-data";

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
  twitter: {
    card: "summary_large_image",
    title: "Top Tech Companies Interview Questions & Prep | Byte to Offer",
    description:
      "Prepare for your next software engineering interview with real questions from top tech companies like Google, Amazon, Microsoft, Meta, and more.",
    images: [`${APP_URL}/og-image.png`],
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  name: "Top Tech Companies Interview Questions",
  description:
    "Collection of interview questions and preparation guides for top tech companies.",
  provider: {
    "@type": "Organization",
    name: "Byte to Offer",
    url: APP_URL,
  },
};

export default function CompaniesPage() {
  return (
    <ErrorBoundary fallback={<CompanyListErrorFallback />}>
      <Suspense
        fallback={
          <div className="container mx-auto px-4 py-8 text-center text-gray-400">
            Loading companies...
          </div>
        }
      >
        <CompaniesListContainer />
      </Suspense>
      <StructuredData data={jsonLd} />
    </ErrorBoundary>
  );
}
