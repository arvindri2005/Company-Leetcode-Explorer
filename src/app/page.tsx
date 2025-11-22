/**
 * @fileoverview Defines the main landing page for the application.
 *
 * This file constructs the homepage by assembling several distinct sections,
 * including a hero section, features display, statistics, a search component,
 * and a footer. It also exports Next.js metadata for SEO and social sharing,
 * including structured data for rich search results.
 */
import type { Metadata } from "next";
import HeroSection from "@/components/landing/hero-section";
import FeaturesSection from "@/components/landing/feature-section";
import StatsSection from "@/components/landing/stats-section";
import SearchSection from "@/components/landing/search-section";
import Footer from "@/components/landing/footer";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://bytetooffer.com";

/**
 * Metadata for the landing page.
 *
 * This object provides SEO and social sharing information for the homepage,
 * including the title, description, keywords, Open Graph data for social media,
 * a canonical URL, and structured data (Schema.org) for search engines.
 *
 * @type {Metadata}
 */
export const metadata: Metadata = {
  title: "Byte to offer",
  description:
    "Master coding interviews with AI-driven tools. Explore company-specific interview questions (Google, Amazon, Meta), get personalized strategies, and practice for top tech companies. Your ultimate resource for software engineering interview preparation.",
  keywords: [
    "LeetCode Interview Questions",
    "Company Coding Questions",
    "Google LeetCode",
    "Amazon LeetCode",
    "Meta LeetCode",
    "AI Interview Prep",
    "Software Engineer Interview",
    "Technical Interview Practice",
    "Data Structures",
    "Algorithms",
  ],
  openGraph: {
    title: "Byte to Offer",
    description:
      "Your ultimate hub for targeted coding interview preparation. AI mock interviews, problem insights, company-specific interview questions, and more.",
    type: "website",
    url: APP_URL,
    images: [
      {
        url: `${APP_URL}/og-image.png`,
        width: 1200,
        height: 630,
        alt: "Byte to Offer - AI-Powered Interview Prep",
      },
    ],
  },
  alternates: {
    canonical: APP_URL,
  },
  other: {
    'script[type="application/ld+json"]': JSON.stringify({
      "@context": "https://schema.org",
      "@type": "WebSite",
      url: APP_URL,
      name: "Byte to Offer",
      description:
        "Master coding interviews with AI-driven tools. Explore company-specific interview problems, generate flashcards, and get personalized prep strategies.",
      potentialAction: {
        "@type": "SearchAction",
        target: {
          "@type": "EntryPoint",
          urlTemplate: `${APP_URL}/companies?search={search_term_string}`,
        },
        "query-input": "required name=search_term_string",
      },
      publisher: {
        // Added publisher
        "@type": "Organization",
        name: "Byte to Offer",
        logo: {
          "@type": "ImageObject",
          url: `${APP_URL}/icon.png`,
        },
      },
    }),
  },
};

/**
 * Renders the main landing page of the application.
 *
 * This component serves as the entry point for the site and is composed of
 * several modular sections that highlight the application's purpose and features.
 *
 * @returns {JSX.Element} The rendered homepage component.
 */
export default function ShowcasePage() {
  return (
    <div className="bg-background w-full">
      <HeroSection />
      <FeaturesSection />
      <StatsSection />
      <SearchSection />
      <Footer />
    </div>
  );
}
