
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
    };
  }

  const problemCount = company.problemCount ?? 0;
  
  const title = `${company.name} - Coding Problems & Interview Prep (${problemCount} Problems) | Company Interview Problem Explorer`;
  const description = `Explore ${company.name}'s coding interview questions, LeetCode style problems, common patterns, and AI-powered preparation strategies. ${problemCount} coding problems available for ${company.name}.`;
  
  let initialProblemDataForKeywords: LeetCodeProblem[] = [];
  if (problemCount > 0 && (!company.commonTags || company.commonTags.length === 0)) {
    // Fetching a small number of problems for keywords only if commonTags from stats are missing
    const problemResults = await getProblemsByCompanyFromDb(company.id, { page: 1, pageSize: MAX_PROBLEMS_FOR_AI_FEATURES });
    initialProblemDataForKeywords = problemResults.problems;
  }


  const companyKeywords = [
    company.name, 
    `${company.name} interview questions`,
    `${company.name} coding problems`,
    `${company.name} LeetCode`,
    'technical interview prep',
    'software engineer interview',
  ];
  // Use company.commonTags if available and populated for keywords
  const tagKeywordsFromStats = company.commonTags && company.commonTags.length > 0 
    ? company.commonTags.map(ct => ct.tag)
    : initialProblemDataForKeywords.flatMap(p => p.tags).filter(Boolean);
    
  const uniqueKeywords = Array.from(new Set([...companyKeywords, ...tagKeywordsFromStats])).slice(0, 15);

  const breadcrumbList = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": `${APP_URL}/`
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "Companies",
        "item": `${APP_URL}/companies`
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": company.name,
        "item": `${APP_URL}/company/${company.slug}`
      }
    ]
  };

  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": company.name,
    "url": `${APP_URL}/company/${company.slug}`,
    "logo": company.logo,
    "description": `Find LeetCode style coding interview questions and preparation material for ${company.name}. ${company.description || ''}`,
    ...(company.website && { "sameAs": [company.website] }),
  };
  
  const profilePageSchema = {
    "@context": "https://schema.org",
    "@type": "ProfilePage", 
    "mainEntity": organizationSchema,
    "breadcrumb": breadcrumbList,
    "name": title,
    "description": description,
    "url": `${APP_URL}/company/${company.slug}`,
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
      siteName: 'Company Interview Problem Explorer',
      images: company.logo ? [{ url: company.logo, alt: `${company.name} logo` }] : [{ url: `${APP_URL}/icon.png`, alt: 'Company Interview Problem Explorer Logo' }],
      type: 'profile', 
      profile: {
        username: company.slug, 
      }
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: company.logo ? [company.logo] : [`${APP_URL}/icon.png`],
    },
    other: {
       "script[type=\"application/ld+json\"]": JSON.stringify([profilePageSchema, breadcrumbList]), 
    }
  };
}

export default async function CompanyPage({ params, searchParams }: CompanyPageProps) {
  const company = await getCompanyBySlug(params.companySlug);

  if (!company) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center text-center p-6">
        <Building2 className="h-12 w-12 text-muted-foreground mb-3" />
        <h1 className="text-xl font-semibold mb-2">Company Not Found</h1>
        <p className="text-muted-foreground text-sm mb-4 max-w-sm">
          The company you're looking for (slug: {params.companySlug}) doesn't exist or may have been removed.
        </p>
        <Button asChild variant="outline" size="sm">
          <Link href="/companies">
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back to Companies
          </Link>
        </Button>
      </div>
    );
  }

  // Fetch problems for AI features, capped at MAX_PROBLEMS_FOR_AI_FEATURES
  const allProblemsForAIFeatures = await getProblemsByCompanyFromDb(company.id, { pageSize: MAX_PROBLEMS_FOR_AI_FEATURES });
  
  // Use company.problemCount for display if available, otherwise use the count of problems fetched for AI (which is capped)
  // This ensures the displayed total reflects the actual number of problems, while AI features might operate on a subset.
  const displayProblemCount = company.problemCount ?? allProblemsForAIFeatures.totalProblems;
  
  const initialPage = searchParams?.page ? parseInt(searchParams.page, 10) : 1;
  const currentUser = auth.currentUser; 
  
  const initialFilters: ProblemListFilters = {
    difficultyFilter: 'all',
    lastAskedFilter: 'all',
    statusFilter: 'all', 
    searchTerm: '',
    sortKey: 'title',
  };

  const initialPaginatedProblemsData = await getProblemsByCompanyFromDb(company.id, {
    pageSize: INITIAL_ITEMS_PER_PAGE,
    // @ts-ignore
    filters: initialFilters,
    userId: currentUser?.uid,
  });
  
  let initialProblems: LeetCodeProblem[] = initialPaginatedProblemsData.problems;
  let initialHasMore = initialPaginatedProblemsData.hasMore;
  let initialNextCursor = initialPaginatedProblemsData.nextCursor;
  let initialProblemDataError: string | null = null;

  if ('error' in initialPaginatedProblemsData) {
    console.error("Error fetching initial problems for company page:", initialPaginatedProblemsData.error);
    initialProblemDataError = initialPaginatedProblemsData.error as string;
  }
  
  const hasProblemsForFeatures = displayProblemCount > 0;


  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-4 max-w-6xl">
        <div className="mb-4">
          <nav className="flex items-center gap-1 text-xs text-muted-foreground mb-3">
            <Link href="/" className="hover:text-foreground transition-colors">
              Home
            </Link>
            <span>/</span>
            <Link href="/companies" className="hover:text-foreground transition-colors">
              Companies
            </Link>
            <span>/</span>
            <span className="text-foreground font-medium truncate">{company.name}</span>
          </nav>
          <Button asChild variant="ghost" size="sm" className="mb-3 -ml-2">
            <Link href="/companies">
              <ChevronLeft className="h-4 w-4 mr-1" />
              <span className="hidden sm:inline">Back to Companies</span>
            </Link>
          </Button>
        </div>

        <Card className="mb-4">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              {company.logo ? (
                <Image
                  src={company.logo}
                  alt={`${company.name} logo`}
                  width={48}
                  height={48}
                  className="rounded-lg border bg-background p-1 flex-shrink-0"
                  data-ai-hint={`${company.name} logo`}
                  priority
                />
              ) : (
                <div className="h-12 w-12 rounded-lg border bg-muted/50 flex items-center justify-center flex-shrink-0">
                  <Building2 className="h-6 w-6 text-primary" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h1 className="text-xl sm:text-2xl font-bold truncate">
                    {company.name} Interview Problems
                  </h1>
                  {hasProblemsForFeatures && (
                    <Badge variant="secondary" className="text-xs flex-shrink-0">
                      {displayProblemCount} Problem{displayProblemCount !== 1 ? 's' : ''} Listed
                    </Badge>
                  )}
                </div>
                {company.description && (
                  <p className="text-muted-foreground text-sm leading-relaxed line-clamp-2 mb-2">
                    {company.description}
                  </p>
                )}
                <div className="flex items-center gap-3">
                  {company.website && (
                    <Link
                      href={company.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                    >
                      <ExternalLink className="h-3 w-3" />
                      Website
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {initialProblemDataError && (
          <Card className="my-4 border-destructive bg-destructive/10">
            <CardHeader>
              <CardTitle className="text-destructive flex items-center text-lg">
                <AlertTriangle className="mr-2 h-5 w-5" />
                Failed to Load Problems
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-destructive/90 text-sm">
                We encountered an issue trying to load the problems for {company.name}.
                This might be a temporary issue with our services or with accessing the data.
              </p>
              <p className="text-xs text-destructive/70 mt-2">Error details: {initialProblemDataError}</p>
              <Button variant="outline" size="sm" className="mt-3" onClick={() => window.location.reload()}>
                Try Refreshing
              </Button>
            </CardContent>
          </Card>
        )}

        {!initialProblemDataError && hasProblemsForFeatures ? (
          <>
            <div className="mb-4">
              <Suspense fallback={<div className="animate-pulse h-36 bg-muted rounded-lg" />}>
                <CompanyProblemStats 
                  company={company} 
                  problems={allProblemsForAIFeatures.problems} 
                  totalProblemsCount={displayProblemCount} 
                />
              </Suspense>
            </div>
            <Tabs defaultValue="problems" className="w-full">
              <div className="mb-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <TabsList className="grid w-full sm:w-auto grid-cols-4 h-9">
                    <TabsTrigger value="problems" className="text-xs px-2">
                      <BookOpen className="h-3 w-3 sm:mr-1" />
                      <span className="hidden sm:inline">Problems</span>
                    </TabsTrigger>
                    <TabsTrigger value="ai-grouping" className="text-xs px-2">
                      <Brain className="h-3 w-3 sm:mr-1" />
                      <span className="hidden sm:inline">AI Groups</span>
                    </TabsTrigger>
                    <TabsTrigger value="flashcards" className="text-xs px-2">
                      <Target className="h-3 w-3 sm:mr-1" />
                      <span className="hidden sm:inline">Cards</span>
                    </TabsTrigger>
                    <TabsTrigger value="strategy" className="text-xs px-2">
                      <Users className="h-3 w-3 sm:mr-1" />
                      <span className="hidden sm:inline">Strategy</span>
                    </TabsTrigger>
                  </TabsList>
                </div>
              </div>

              <TabsContent value="problems" className="mt-0">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <BookOpen className="h-4 w-4" />
                      Coding Interview Problems for {company.name}
                      <Badge variant="outline" className="text-xs">{displayProblemCount}</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <Suspense fallback={<div className="animate-pulse h-48 bg-muted rounded" />}>
                       <ProblemList
                        key={company.id}
                        companyId={company.id}
                        companySlug={company.slug}
                        initialProblems={initialProblems}
                        initialHasMore={initialHasMore ?? false}
                        initialNextCursor={initialNextCursor}
                        itemsPerPage={INITIAL_ITEMS_PER_PAGE}
                        initialFilters={initialFilters}
                      />
                    </Suspense>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="ai-grouping" className="mt-0">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Brain className="h-4 w-4" />
                      AI-Powered Problem Grouping for {company.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <Suspense fallback={<div className="animate-pulse h-48 bg-muted rounded" />}>
                      <AIGroupingSection problems={allProblemsForAIFeatures.problems} companyName={company.name} companySlug={company.slug} />
                    </Suspense>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="flashcards" className="mt-0">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Target className="h-4 w-4" />
                      Study Flashcards for {company.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <Suspense fallback={<div className="animate-pulse h-48 bg-muted rounded" />}>
                      <DynamicFlashcardGenerator companyId={company.id} companyName={company.name} companySlug={company.slug} />
                    </Suspense>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="strategy" className="mt-0">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Users className="h-4 w-4" />
                      Interview Strategy for {company.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <Suspense fallback={<div className="animate-pulse h-48 bg-muted rounded" />}>
                      <CompanyStrategyGenerator companyId={company.id} companyName={company.name} companySlug={company.slug} />
                    </Suspense>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </>
        ) : (
          !initialProblemDataError && ( 
            <Card className="text-center py-8">
              <CardContent>
                <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <h2 className="text-lg font-semibold mb-2">No Problems Available for {company.name}</h2>
                <p className="text-muted-foreground text-sm mb-4 max-w-sm mx-auto">
                  We don't have coding problems for {company.name} yet. You can help by adding some!
                </p>
                <div className="flex flex-col sm:flex-row gap-2 justify-center max-w-xs mx-auto">
                  <Button asChild variant="outline" size="sm" className="flex-1">
                    <Link href="/companies">
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Browse Companies
                    </Link>
                  </Button>
                  <Button asChild variant="secondary" size="sm" className="flex-1">
                    <Link href={`/submit-problem?companyId=${company.id}&companyName=${encodeURIComponent(company.name)}`}>
                      <PlusSquare className="h-4 w-4 mr-1" />
                      Add Problem
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        )}
      </div>
    </div>
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

