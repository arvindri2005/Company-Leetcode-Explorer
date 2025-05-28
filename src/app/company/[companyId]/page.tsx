import { getCompanyById, getProblemsByCompany, getCompanies as getAllCompaniesForStaticParams } from '@/lib/data';
import type { Company, LeetCodeProblem } from '@/types';
import ProblemList from '@/components/problem/problem-list';
import AIGroupingSection from '@/components/ai/ai-grouping-section';
import CompanyProblemStats from '@/components/company/company-problem-stats';
import FlashcardGenerator from '@/components/ai/flashcard-generator';
import CompanyStrategyGenerator from '@/components/ai/company-strategy-generator';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Building2, ExternalLink, BarChart3, BookOpen, Brain, Target, Users, Calendar, ChevronLeft } from 'lucide-react';
import Image from 'next/image';
import { Suspense } from 'react';

interface CompanyPageProps {
  params: { companyId: string };
}

// Compact loading skeletons
function CompanyHeaderSkeleton() {
  return (
    <div className="animate-pulse space-y-3">
      <div className="h-3 w-24 bg-muted rounded" />
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 bg-muted rounded-lg" />
        <div className="space-y-2 flex-1">
          <div className="h-6 w-40 bg-muted rounded" />
          <div className="h-3 w-60 bg-muted rounded" />
        </div>
      </div>
    </div>
  );
}

function StatsSkeleton() {
  return (
    <div className="space-y-4">
      {/* Key metrics skeleton */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="animate-pulse bg-muted rounded-lg p-4">
            <div className="h-3 w-12 bg-muted-foreground/20 rounded mb-2" />
            <div className="h-6 w-8 bg-muted-foreground/20 rounded" />
          </div>
        ))}
      </div>
      
      {/* Charts skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="animate-pulse bg-muted rounded-lg h-64" />
        <div className="animate-pulse bg-muted rounded-lg h-64" />
      </div>
    </div>
  );
}

export async function generateMetadata({ params }: CompanyPageProps) {
  const company = await getCompanyById(params.companyId);
  if (!company) {
    return { title: 'Company Not Found' };
  }
  
  const problems = await getProblemsByCompany(params.companyId);
  
  return { 
    title: `${company.name} - LeetCode Problems & Interview Prep`,
    description: `Explore ${company.name} coding interview questions, problem patterns, and preparation strategies. ${problems?.length || 0} problems available.`
  };
}

export default async function CompanyPage({ params }: CompanyPageProps) {
  const company = await getCompanyById(params.companyId);
  const problems = await getProblemsByCompany(params.companyId);

  if (!company) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center text-center p-6">
        <Building2 className="h-12 w-12 text-muted-foreground mb-3" />
        <h1 className="text-xl font-semibold mb-2">Company Not Found</h1>
        <p className="text-muted-foreground text-sm mb-4 max-w-sm">
          The company you're looking for doesn't exist or may have been removed.
        </p>
        <Button asChild variant="outline" size="sm">
          <Link href="/">
            <ChevronLeft className="h-4 w-4 mr-1" /> 
            Back to Companies
          </Link>
        </Button>
      </div>
    );
  }

  const hasProblems = problems.length > 0;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-4 max-w-6xl">
        {/* Compact Header */}
        <div className="mb-4">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-1 text-xs text-muted-foreground mb-3">
            <Link href="/" className="hover:text-foreground transition-colors">
              Companies
            </Link>
            <span>/</span>
            <span className="text-foreground font-medium truncate">{company.name}</span>
          </nav>

          {/* Back Button */}
          <Button asChild variant="ghost" size="sm" className="mb-3 -ml-2">
            <Link href="/">
              <ChevronLeft className="h-4 w-4 mr-1" /> 
              <span className="hidden sm:inline">Back</span>
            </Link>
          </Button>
        </div>
        
        {/* Compact Company Header */}
        <Card className="mb-4">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              {/* Logo */}
              {company.logo ? (
                <Image 
                  src={company.logo} 
                  alt={`${company.name} logo`} 
                  width={48} 
                  height={48} 
                  className="rounded-lg border bg-background p-1 flex-shrink-0"
                />
              ) : (
                <div className="h-12 w-12 rounded-lg border bg-muted/50 flex items-center justify-center flex-shrink-0">
                  <Building2 className="h-6 w-6 text-primary" />
                </div>
              )}
              
              {/* Company Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h1 className="text-xl sm:text-2xl font-bold truncate">
                    {company.name}
                  </h1>
                  {hasProblems && (
                    <Badge variant="secondary" className="text-xs flex-shrink-0">
                      {problems.length}
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
                  
                  {hasProblems && (
                    <div className="hidden sm:flex items-center gap-2">
                      <Button size="sm" variant="outline" className="h-7 text-xs">
                        <BarChart3 className="h-3 w-3 mr-1" />
                        Analytics
                      </Button>
                      <Button size="sm" variant="outline" className="h-7 text-xs">
                        <Calendar className="h-3 w-3 mr-1" />
                        Plan
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {hasProblems ? (
          <>
            {/* Compact Stats */}
            <div className="mb-4">
              <Suspense fallback={<StatsSkeleton />}>
                <CompanyProblemStats problems={problems} />
              </Suspense>
            </div>

            {/* Compact Tabs */}
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

                  {/* Mobile Quick Actions */}
                  <div className="flex sm:hidden gap-2">
                    <Button size="sm" variant="outline" className="flex-1 h-8 text-xs">
                      <BarChart3 className="h-3 w-3 mr-1" />
                      Analytics
                    </Button>
                    <Button size="sm" variant="outline" className="flex-1 h-8 text-xs">
                      <Calendar className="h-3 w-3 mr-1" />
                      Plan
                    </Button>
                  </div>
                </div>
              </div>

              <TabsContent value="problems" className="mt-0">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <BookOpen className="h-4 w-4" />
                      Interview Problems
                      <Badge variant="outline" className="text-xs">{problems.length}</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <Suspense fallback={<div className="animate-pulse h-48 bg-muted rounded" />}>
                      <ProblemList problems={problems} />
                    </Suspense>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="ai-grouping" className="mt-0">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Brain className="h-4 w-4" />
                      AI-Powered Problem Grouping
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <Suspense fallback={<div className="animate-pulse h-48 bg-muted rounded" />}>
                      <AIGroupingSection problems={problems} companyName={company.name} />
                    </Suspense>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="flashcards" className="mt-0">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Target className="h-4 w-4" />
                      Study Flashcards
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <Suspense fallback={<div className="animate-pulse h-48 bg-muted rounded" />}>
                      <FlashcardGenerator companyId={company.id} companyName={company.name} />
                    </Suspense>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="strategy" className="mt-0">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Users className="h-4 w-4" />
                      Interview Strategy
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <Suspense fallback={<div className="animate-pulse h-48 bg-muted rounded" />}>
                      <CompanyStrategyGenerator companyId={company.id} companyName={company.name} />
                    </Suspense>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </>
        ) : (
          /* Compact No Problems State */
          <Card className="text-center py-8">
            <CardContent>
              <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <h2 className="text-lg font-semibold mb-2">No Problems Available</h2>
              <p className="text-muted-foreground text-sm mb-4 max-w-sm mx-auto">
                We don't have coding problems for {company.name} yet. Check back later or explore other companies.
              </p>
              <div className="flex flex-col sm:flex-row gap-2 justify-center max-w-xs mx-auto">
                <Button asChild variant="outline" size="sm" className="flex-1">
                  <Link href="/">
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Browse Companies
                  </Link>
                </Button>
                <Button variant="secondary" size="sm" className="flex-1">
                  <Target className="h-4 w-4 mr-1" />
                  Request Problems
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

export async function generateStaticParams() {
  try {
    const companiesData = await getAllCompaniesForStaticParams({ pageSize: 1000 });
    const companies = companiesData.companies;
    
    if (!companies || companies.length === 0) {
      console.warn("generateStaticParams: No companies found, static paths might not be generated correctly.");
      return [];
    }
    
    return companies.map((company) => ({
      companyId: company.id,
    }));
  } catch (error) {
    console.error("Error in generateStaticParams:", error);
    return [];
  }
}