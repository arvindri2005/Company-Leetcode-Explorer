
import { getProblemByCompanySlugAndProblemSlug, getCompanyBySlug } from '@/lib/data';
import type { LeetCodeProblem, Company } from '@/types';
import MockInterviewChat from '@/components/ai/mock-interview-chat';
import { Separator } from '@/components/ui/separator';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ExternalLink, ChevronLeft } from 'lucide-react'; 
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import DifficultyBadge from '@/components/problem/difficulty-badge';
import TagBadge from '@/components/problem/tag-badge';
import type { Metadata } from 'next';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:9002';


interface MockInterviewPageProps {
  params: { companySlug: string; problemSlug: string };
}

export async function generateMetadata({ params }: MockInterviewPageProps): Promise<Metadata> {
  const company = await getCompanyBySlug(params.companySlug);

  if (!company) {
    return {
      title: 'Company Not Found | Mock Interview',
      description: `The company with slug "${params.companySlug}" was not found. Unable to start mock interview.`,
    };
  }

  const problemData = await getProblemByCompanySlugAndProblemSlug(params.companySlug, params.problemSlug);

  if (!problemData || !problemData.problem) {
    return { 
      title: `Problem Not Found for ${company.name} | Mock Interview`,
      description: `The problem with slug "${params.problemSlug}" for company "${company.name}" does not exist or could not be loaded.`,
    };
  }
  
  const { problem } = problemData;
  const pageUrl = `${APP_URL}/mock-interview/${params.companySlug}/${params.problemSlug}`;
  const title = `Mock Interview: ${problem.title} | ${company.name} | Company Interview Problem Explorer`;
  const description = `Practice solving "${problem.title}" (${problem.difficulty}) with an AI interviewer. A coding Problem problem often asked by ${company.name}.`;

  const breadcrumbList = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home", "item": `${APP_URL}/` },
      { "@type": "ListItem", "position": 2, "name": "Companies", "item": `${APP_URL}/companies` },
      { "@type": "ListItem", "position": 3, "name": company.name, "item": `${APP_URL}/company/${company.slug}` },
      { "@type": "ListItem", "position": 4, "name": `Mock Interview: ${problem.title}`, "item": pageUrl }
    ]
  };

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": pageUrl
    },
    "headline": `Mock Interview Practice: ${problem.title} for ${company.name}`,
    "description": description,
    "image": company.logo ? [company.logo] : [`${APP_URL}/og-image.png`], // Use company logo or default
    "author": {
      "@type": "Organization",
      "name": "Company Interview Problem Explorer AI"
    },
    "publisher": {
      "@type": "Organization",
      "name": "Company Interview Prolbem Explorer",
      "logo": {
        "@type": "ImageObject",
        "url": `${APP_URL}/icon.png` // A generic icon for the publisher
      }
    },
    "datePublished": problem.lastAskedPeriod ? new Date().toISOString() : new Date().toISOString(), // Placeholder, ideally problem creation date
    "dateModified": new Date().toISOString() // Always current date for mock interview pages
  };
  
  // Combine structured data
  const combinedSchemas = [breadcrumbList, articleSchema];


  return { 
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'article', 
      url: pageUrl,
      images: company.logo ? [{ url: company.logo, alt: `${company.name} logo for ${problem.title} mock interview`}] : [{ url: `${APP_URL}/og-image.png`, alt: `Mock interview for ${problem.title}`}],
      article: {
        // Potentially add tags, section, published_time, modified_time here
        // For simplicity, we'll rely on the main Article schema.org for richer data
        tags: problem.tags,
      }
    },
    alternates: {
      canonical: pageUrl,
    },
    other: {
      "script[type=\"application/ld+json\"]": JSON.stringify(combinedSchemas),
    }
  };
}

export default async function MockInterviewPage({ params }: MockInterviewPageProps) {
  const company = await getCompanyBySlug(params.companySlug);
  const problemData = await getProblemByCompanySlugAndProblemSlug(params.companySlug, params.problemSlug);

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

  if (!problemData || !problemData.problem) {
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
  const problem = problemData.problem;


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

// Import function for static params
import { getAllProblemCompanyAndProblemSlugs } from '@/lib/data';

export async function generateStaticParams() {
  try {
    const problemSlugsData = await getAllProblemCompanyAndProblemSlugs();
    if (!problemSlugsData || problemSlugsData.length === 0) {
        console.warn("generateStaticParams for mock interview pages: No problem slugs data found.");
        return [];
    }
    return problemSlugsData.map(({ companySlug, problemSlug }) => ({
      companySlug,
      problemSlug,
    }));
  } catch (error) {
    console.error("Error in generateStaticParams for mock interview pages:", error);
    return [];
  }
}
