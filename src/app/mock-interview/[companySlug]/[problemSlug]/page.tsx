
'use client'; // Required because we use useAuth and useRouter client-side

import { getProblemByCompanySlugAndProblemSlug, getCompanyBySlug } from '@/lib/data';
import type { LeetCodeProblem, Company } from '@/types';
import MockInterviewChat from '@/components/ai/mock-interview-chat';
import { Separator } from '@/components/ui/separator';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ExternalLink, ChevronLeft, LogIn, Loader2, Info } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import DifficultyBadge from '@/components/problem/difficulty-badge';
import TagBadge from '@/components/problem/tag-badge';
// import type { Metadata } from 'next'; // Metadata generation would be complex in a full client component
import { useAuth } from '@/contexts/auth-context';
import React, { useEffect, useState, use } from 'react'; // Import use
import { usePathname, useRouter } from 'next/navigation';

interface MockInterviewPageProps {
  params: { companySlug: string; problemSlug: string };
  // If params were definitely a Promise, the type would be:
  // params: Promise<{ companySlug: string; problemSlug: string; }>;
}

export default function MockInterviewPage({ params: paramsFromProps }: MockInterviewPageProps) {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  // Unwrap the params prop using React.use()
  // This will suspend if paramsFromProps is a promise.
  const params = use(paramsFromProps as any); // Use 'as any' if TypeScript complains, or adjust prop type

  const [company, setCompany] = useState<Company | null | undefined>(undefined);
  const [problem, setProblem] = useState<LeetCodeProblem | null | undefined>(undefined);
  const [isLoadingData, setIsLoadingData] = useState(true);

  useEffect(() => {
    // This effect runs after `params` is resolved due to React.use() potentially suspending.
    async function fetchData() {
      if (!params.companySlug || !params.problemSlug) {
        // This case should ideally not happen if params are correctly resolved from route
        setIsLoadingData(false);
        setCompany(null);
        setProblem(null);
        return;
      }

      setIsLoadingData(true);
      const companyData = await getCompanyBySlug(params.companySlug);
      setCompany(companyData);

      if (companyData) {
        const problemDetails = await getProblemByCompanySlugAndProblemSlug(params.companySlug, params.problemSlug);
        setProblem(problemDetails.problem);
      } else {
        setProblem(null); // No company, so no problem
      }
      setIsLoadingData(false);
    }

    // Ensure params are available before fetching
    if (params?.companySlug && params?.problemSlug) {
      fetchData();
    } else {
      // Handle case where resolved params might still be missing required fields, though unlikely for route params
      setIsLoadingData(false);
      console.warn("Resolved params are missing companySlug or problemSlug", params);
    }
  }, [params?.companySlug, params?.problemSlug]); // Depend on the resolved params' properties

  if (authLoading || isLoadingData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] text-center p-6">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-lg text-muted-foreground">Loading Interview Session...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <section className="space-y-6 flex flex-col h-full items-center justify-center text-center py-10">
         <Info size={48} className="text-primary mb-4" />
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
          Login Required
        </h1>
        <p className="text-muted-foreground max-w-md">
          Please log in to start your AI-powered mock interview for the problem
          {problem ? ` "${problem.title}"` : ''}
          {company ? ` from ${company.name}` : ''}.
        </p>
        <Button asChild size="lg" className="mt-4">
          <Link href={`/login?redirectUrl=${encodeURIComponent(pathname)}`}>
            <LogIn className="mr-2 h-5 w-5" /> Login to Continue
          </Link>
        </Button>
         <Button asChild variant="outline" className="mt-2">
          <Link href={company ? `/company/${company.slug}` : '/companies'}>
            <ChevronLeft className="mr-2 h-4 w-4" />
            Back to {company ? company.name : 'Companies'}
          </Link>
        </Button>
      </section>
    );
  }

  if (!company) {
     return (
      <div className="text-center py-10">
        <h1 className="text-2xl font-bold mb-4">Company Not Found</h1>
        <p className="text-muted-foreground mb-6">The company with slug "{params.companySlug}" could not be found.</p>
        <Button asChild variant="outline">
          <Link href="/companies">
             <ChevronLeft className="mr-2 h-4 w-4" /> Go Back to Companies
          </Link>
        </Button>
      </div>
    );
  }

  if (!problem) {
    return (
      <div className="text-center py-10">
        <h1 className="text-2xl font-bold mb-4">Problem Not Found for {company.name}</h1>
        <p className="text-muted-foreground mb-6">The problem you are looking for (Slug: {params.problemSlug}) does not exist for {company.name}.</p>
        <Button asChild variant="outline">
          <Link href={`/company/${company.slug}`}>
             <ChevronLeft className="mr-2 h-4 w-4" /> Back to {company.name}
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <section className="space-y-6 flex flex-col h-full">
      <div className="flex-shrink-0">
          <nav className="flex items-center gap-1 text-xs text-muted-foreground mb-3">
            <Link href="/" className="hover:text-foreground transition-colors">Home</Link>
            <span>/</span>
            <Link href="/companies" className="hover:text-foreground transition-colors">Companies</Link>
            <span>/</span>
            <Link href={`/company/${company.slug}`} className="hover:text-foreground transition-colors">{company.name}</Link>
            <span>/</span>
            <span className="text-foreground font-medium truncate">Mock Interview: {problem.title}</span>
          </nav>

        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
          Mock Interview: {problem.title}
        </h1>
        <p className="text-muted-foreground">Practice solving this problem with an AI interviewer. Often asked by {company.name}.</p>
      </div>
      
      <Card className="mb-4 flex-shrink-0 shadow-md">
        <CardHeader>
            <div className="flex justify-between items-start gap-2">
                <CardTitle className="text-xl">{problem.title}</CardTitle>
                <DifficultyBadge difficulty={problem.difficulty} />
            </div>
            <CardDescription>
                <Link href={problem.link} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline flex items-center gap-1">
                    View on LeetCode <ExternalLink size={14} />
                </Link>
            </CardDescription>
        </CardHeader>
        {problem.tags.length > 0 && (
            <CardContent className="pt-0">
                 <div className="text-xs text-muted-foreground mb-1">Tags:</div>
                <div className="flex flex-wrap gap-1.5">
                    {problem.tags.map(tag => <TagBadge key={tag} tag={tag} />)}
                </div>
            </CardContent>
        )}
      </Card>

      <Separator className="my-2 flex-shrink-0"/>
      
      <div className="flex-grow overflow-hidden min-h-0"> 
        <MockInterviewChat problem={problem} companySlug={params.companySlug} />
      </div>
    </section>
  );
}

// Static params generation can remain if the slugs are known ahead of time
// import { getAllProblemCompanyAndProblemSlugs } from '@/lib/data';
// export async function generateStaticParams() { ... }

