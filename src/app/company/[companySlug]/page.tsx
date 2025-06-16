import { getCompanyBySlug, getProblemsByCompanyFromDb } from '@/lib/data';
import type { Company, LeetCodeProblem, ProblemListFilters, PaginatedProblemsResponse } from '@/types';
import ProblemList from '@/components/problem/problem-list';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Building2, ExternalLink, BookOpen, Brain, Target, Users, ChevronLeft, AlertTriangle, PlusSquare } from 'lucide-react';
import Image from 'next/image';
import { Suspense } from 'react';
import type { Metadata } from 'next';
import { auth } from '@/lib/firebase';
import { fetchProblemsForCompanyPage } from '@/app/actions/problem.actions';
import dynamic from 'next/dynamic';


const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:9002';
const INITIAL_ITEMS_PER_PAGE = 15;
const MAX_PROBLEMS_FOR_AI_FEATURES = 200; // Cap for AI feature data

const AIGroupingSection = dynamic(() => import('@/components/ai/ai-grouping-section'), {
  loading: () => <div className="animate-pulse h-48 bg-muted rounded-lg p-4 text-center text-sm text-muted-foreground">Loading AI Grouping...</div>,
});

const DynamicFlashcardGenerator = dynamic(() => import('@/components/ai/flashcard-generator'), {
  loading: () => <div className="animate-pulse h-48 bg-muted rounded-lg p-4 text-center text-sm text-muted-foreground">Loading Flashcards...</div>,
});

const CompanyStrategyGenerator = dynamic(() => import('@/components/ai/company-strategy-generator'), {
  loading: () => <div className="animate-pulse h-48 bg-muted rounded-lg p-4 text-center text-sm text-muted-foreground">Loading Strategy Generator...</div>,
});

const CompanyProblemStats = dynamic(() => import('@/components/company/company-problem-stats'), {
  loading: () => <div className="animate-pulse h-36 bg-muted rounded-lg" />,
});


interface CompanyPageProps {
  params: { companySlug: string };
  searchParams?: { page?: string; };
}

export async function generateMetadata({ params }: CompanyPageProps): Promise<Metadata> {
  const company = await getCompanyBySlug(params.companySlug);
  if (!company) {
    return {
      title: 'Company Not Found',
      description: 'The requested company page does not exist.',
      robots: { index: false }
    };
  }

  const problems = await getProblemsByCompanyFromDb(company.id);
  const problemCount = problems?.total || 0;

  const title = `${company.name} Interview Questions & Problems (${problemCount}+ Examples)`;
  const description = `Prepare for ${company.name} technical interviews with ${problemCount}+ real coding questions and problems. Practice actual ${company.name} interview questions, get AI-powered insights, and learn problem-solving patterns specific to ${company.name}'s interview process.`;

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    'name': `${company.name} Interview Questions`,
    'description': description,
    'numberOfItems': problemCount,
    'itemListElement': problems?.items?.slice(0, 10).map((problem, index) => ({
      '@type': 'Question',
      'position': index + 1,
      'name': problem.title,
      'text': `${problem.title} - ${problem.difficulty} level coding problem from ${company.name} interviews`,
    })) || [],
    'about': {
      '@type': 'Organization',
      'name': company.name,
      'image': company.logo || undefined,
    }
  };

  const faqStructuredData = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    'mainEntity': [
      {
        '@type': 'Question',
        'name': `What kind of interview questions does ${company.name} ask?`,
        'acceptedAnswer': {
          '@type': 'Answer',
          'text': `${company.name} typically asks coding problems focusing on data structures, algorithms, and system design. Our collection includes ${problemCount}+ verified ${company.name} interview questions across different difficulty levels.`
        }
      },
      {
        '@type': 'Question',
        'name': `How can I prepare for ${company.name} coding interviews?`,
        'acceptedAnswer': {
          '@type': 'Answer',
          'text': `To prepare for ${company.name} interviews: 1) Practice our curated list of ${company.name}-specific coding problems, 2) Use our AI-powered mock interviews, 3) Study problem patterns common in ${company.name} interviews, 4) Review solution approaches and time complexity requirements.`
        }
      }
    ]
  };

  return {
    title,
    description,
    keywords: [
      `${company.name} interview questions`,
      `${company.name} coding problems`,
      `${company.name} technical interview`,
      `${company.name} leetcode questions`,
      `${company.name} programming interview`,
      `${company.name} interview preparation`,
      `${company.name} coding challenges`,
      `${company.name} software engineer interview`,
      `practice ${company.name} problems`,
      `real ${company.name} interview questions`
    ],
    openGraph: {
      title,
      description,
      type: 'website',
      url: `${APP_URL}/company/${params.companySlug}`,
      images: company.logo ? [{ url: company.logo, alt: `${company.name} logo` }] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
    alternates: {
      canonical: `${APP_URL}/company/${params.companySlug}`
    },
    other: {
      'script:ld+json': [
        JSON.stringify(structuredData),
        JSON.stringify(faqStructuredData)
      ]
    }
  };
}

export default async function CompanyPage({
  params,
  searchParams,
}: CompanyPageProps) {
  const page = Number(searchParams?.page) || 1;
  const company = await getCompanyBySlug(params.companySlug);

  if (!company) {
    return (
      <main className="container mx-auto px-4 py-8">
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-bold">Company Not Found</h1>
          <p className="text-muted-foreground">The requested company does not exist.</p>
          <Button asChild>
            <Link href="/companies">Browse All Companies</Link>
          </Button>
        </div>
      </main>
    );
  }

  const { items: problems, total: totalProblems } = await getProblemsByCompanyFromDb(company.id) || { items: [], total: 0 };

  return (
    <main className="container mx-auto px-4 py-8">
      {/* Company Header Section */}
      <section className="mb-8">
        <nav className="mb-4 flex items-center space-x-2 text-muted-foreground">
          <Link href="/companies" className="hover:text-foreground">
            Companies
          </Link>
          <ChevronLeft className="h-4 w-4" />
          <span className="text-foreground">{company.name}</span>
        </nav>

        <div className="flex flex-col md:flex-row gap-6 items-start">
          <div className="flex-grow space-y-4">
            <div className="flex items-center gap-4">
              {company.logo ? (
                <Image
                  src={company.logo}
                  alt={`${company.name} logo`}
                  width={64}
                  height={64}
                  className="rounded-lg border"
                  priority
                />
              ) : (
                <div className="w-16 h-16 rounded-lg border flex items-center justify-center bg-muted">
                  <Building2 className="h-8 w-8 text-muted-foreground" />
                </div>
              )}
              <div>
                <h1 className="text-3xl font-bold tracking-tight">{company.name} Interview Questions</h1>
                <p className="text-xl text-muted-foreground">
                  Practice {totalProblems} Real Interview Problems
                </p>
              </div>
            </div>

            <div className="prose max-w-none dark:prose-invert">
              <p>
                Prepare for your {company.name} technical interview with our comprehensive collection 
                of coding problems. These questions are carefully curated from real {company.name} interviews, 
                covering various difficulty levels and topics frequently asked in their interview process.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Total Problems</CardTitle>
                  <CardDescription>{totalProblems} coding questions</CardDescription>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Mock Interviews</CardTitle>
                  <CardDescription>AI-powered practice</CardDescription>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Success Rate</CardTitle>
                  <CardDescription>Track your progress</CardDescription>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Difficulty</CardTitle>
                  <CardDescription>All levels covered</CardDescription>
                </CardHeader>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Interview Preparation Tips */}
      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">How to Prepare for {company.name} Interviews</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Practice Strategically
              </CardTitle>
              <CardDescription>
                Focus on {company.name}'s most frequently asked questions and their preferred problem types.
              </CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                Use AI Mock Interviews
              </CardTitle>
              <CardDescription>
                Get real interview experience with our AI interviewer specialized in {company.name}'s style.
              </CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Learn Patterns
              </CardTitle>
              <CardDescription>
                Understand common patterns in {company.name}'s interview questions to solve similar problems.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* Problem List Section */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold">Practice Problems</h2>
        </div>
        <Suspense fallback={<div>Loading problems...</div>}>
          <ProblemList
            companyId={company.id}
            initialPage={page}
            itemsPerPage={INITIAL_ITEMS_PER_PAGE}
          />
        </Suspense>
      </section>
    </main>
  );
}

export async function generateStaticParams() {
  try {
    const { getAllCompanySlugs } = await import('@/lib/data'); 
    const companySlugs = await getAllCompanySlugs();
    console.log('[generateStaticParams /company/[companySlug]] Generating slugs:', companySlugs);
    if (!companySlugs || companySlugs.length === 0) {
      console.warn('[generateStaticParams /company/[companySlug]] No company slugs found to generate static pages.');
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

