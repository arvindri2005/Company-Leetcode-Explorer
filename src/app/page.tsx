
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight, Bot, Brain, CheckSquare, BarChart3, Search, Sparkles, BookOpenCheck, FileSpreadsheet, Palette, Users, PlusSquare } from 'lucide-react';
import Link from 'next/link';
import type { Metadata } from 'next';
import dynamic from 'next/dynamic';
import { FeatureGridSkeleton } from '@/components/skeletons/feature-grid-skeleton';
import { CallToActionSkeleton } from '@/components/skeletons/call-to-action-skeleton';

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

interface FeatureCardProps {
  icon: React.ElementType;
  title: string;
  description: string;
  link: string;
  linkText: string;
}

// FeatureCard is simple, so direct import is fine.
// If it were complex, dynamic import for it would be an option too.
const FeatureCard: React.FC<FeatureCardProps> = ({ icon: Icon, title, description, link, linkText }) => (
  <Card className="flex flex-col h-full shadow-lg hover:shadow-xl transition-shadow duration-300">
    <CardHeader className="flex flex-row items-start gap-4 pb-4">
      <div className="p-3 rounded-md bg-primary/10 text-primary">
        <Icon className="h-8 w-8" />
      </div>
      <div>
        <CardTitle className="text-xl mb-1">{title}</CardTitle>
        <CardDescription className="text-sm leading-relaxed">{description}</CardDescription>
      </div>
    </CardHeader>
    <CardContent className="flex-grow" />
    <CardFooter>
      <Button asChild className="w-full group">
        <Link href={link}>
          {linkText}
          <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
        </Link>
      </Button>
    </CardFooter>
  </Card>
);

// Dynamically import the FeaturesGrid section
const DynamicFeaturesGrid = dynamic(
  () => import('@/components/sections/home-features-grid').then(mod => mod.HomeFeaturesGrid),
  { 
    loading: () => <FeatureGridSkeleton />,
    // ssr: false // Removed: Not allowed in Server Components for next/dynamic
  }
);

// Dynamically import the CallToAction section
const DynamicCallToAction = dynamic(
  () => import('@/components/sections/home-cta').then(mod => mod.HomeCta),
  { 
    loading: () => <CallToActionSkeleton />,
    // ssr: false // Removed: Not allowed in Server Components for next/dynamic
  }
);


export default function ShowcasePage() {
  return (
    <div className="space-y-16 py-8">
      {/* Hero Section */}
      <section className="text-center py-12 bg-gradient-to-br from-primary/10 via-background to-accent/10 rounded-xl shadow-inner">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-6 text-primary">
            Company LeetCode Interview Question Explorer
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            Your AI-powered hub for targeted LeetCode-style coding interview preparation. Explore company-specific problems, practice with AI, and track your progress.
          </p>
          <Button asChild size="lg" className="group text-lg px-8 py-6 shadow-md hover:shadow-lg transition-shadow">
            <Link href="/companies">
              Explore Companies Now
              <Search className="ml-2 h-5 w-5 group-hover:scale-110 transition-transform" />
            </Link>
          </Button>
        </div>
      </section>

      <DynamicFeaturesGrid />
      <DynamicCallToAction />
    </div>
  );
}
