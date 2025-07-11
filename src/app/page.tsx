import type { Metadata } from 'next';import HeroSection from '@/components/landing/hero-section';
import FeaturesSection from '@/components/landing/feature-section';
import StatsSection from '@/components/landing/stats-section';
import SearchSection from '@/components/landing/search-section';
import Footer from '@/components/landing/footer';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:9002';

export const metadata: Metadata = {
  title: 'Company LeetCode Interview Questions | AI-Powered Prep Explorer',
  description: 'Master coding interviews with AI-driven tools. Explore company-specific LeetCode questions (Google, Amazon, Meta), engage in mock interviews, get personalized strategies, and practice for top tech companies. Your ultimate resource for software engineering interview preparation.',
  keywords: ['LeetCode Interview Questions', 'Company Coding Questions', 'Google LeetCode', 'Amazon LeetCode', 'Meta LeetCode', 'AI Interview Prep', 'Software Engineer Interview', 'Technical Interview Practice', 'Data Structures', 'Algorithms'],
  openGraph: {
    title: 'Company LeetCode Interview Questions | AI-Powered Prep Explorer',
    description: 'Your ultimate hub for targeted coding interview preparation. AI mock interviews, problem insights, company-specific LeetCode questions, and more.',
    type: 'website',
    url: APP_URL,
    images: [
      {
        url: `${APP_URL}/og-image.png`,
        width: 1200,
        height: 630,
        alt: 'Company LeetCode Interview Question Explorer - AI-Powered Interview Prep',
      },
    ],
  },
  alternates: {
    canonical: APP_URL,
  },
  other: {
    "script[type=\"application/ld+json\"]": JSON.stringify({
      "@context": "https://schema.org",
      "@type": "WebSite",
      "url": APP_URL,
      "name": "Company LeetCode Interview Question Explorer",
      "description": "Master coding interviews with AI-driven tools. Explore company-specific LeetCode problems, engage in mock interviews, generate flashcards, and get personalized prep strategies.",
      "potentialAction": {
        "@type": "SearchAction",
        "target": {
          "@type": "EntryPoint",
          "urlTemplate": `${APP_URL}/companies?search={search_term_string}`
        },
        "query-input": "required name=search_term_string"
      },
      "publisher": { // Added publisher
        "@type": "Organization",
        "name": "Company LeetCode Interview Question Explorer", // Or your actual organization name
        "logo": {
          "@type": "ImageObject",
          "url": `${APP_URL}/icon.png`
        }
      }
    }),
  }
};

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
