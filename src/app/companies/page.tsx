import CompanyList from '@/components/company/company-list';
import { getCompanies } from '@/lib/data';
import { Separator } from '@/components/ui/separator';
import type { Metadata } from 'next';
import { cache } from 'react';

// Use static rendering with custom cache behavior
export const dynamic = 'force-static';
// Enable static generation and caching
export const preferredRegion = 'auto';
// Disable automatic revalidation
export const revalidate = false;

const ITEMS_PER_PAGE = 9;
// Define a base URL, ideally from an environment variable
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:9002';


interface CompaniesPageProps {
  searchParams?: {
    page?: string; 
    search?: string;
  };
}

export async function generateMetadata({ searchParams }: CompaniesPageProps): Promise<Metadata> {
  const searchTerm = searchParams?.search || '';
  const pageTitle = searchTerm 
    ? `${searchTerm} LeetCode Interview Questions | Company-wise Problems` 
    : 'LeetCode Problems by Company | Company-wise Coding Interview Questions';
  const pageDescription = searchTerm
    ? `Explore ${searchTerm} coding interview questions from LeetCode. Find company-specific problems, difficulty levels, and interview patterns to prepare effectively.`
    : 'Browse LeetCode problems organized by company. Find coding interview questions from top tech companies like Google, Amazon, Meta, and Microsoft. Comprehensive collection of company-wise programming problems with solutions.';

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
        "name": "Company-wise LeetCode Problems",
        "item": `${APP_URL}/companies`
      }
    ]
  };

  const itemList = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": "Company-wise LeetCode Problems",
    "description": "Comprehensive collection of coding interview problems organized by company",
    "url": `${APP_URL}/companies`,
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Google LeetCode Problems",
        "url": `${APP_URL}/company/google`
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "Amazon LeetCode Problems",
        "url": `${APP_URL}/company/amazon`
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": "Meta LeetCode Problems",
        "url": `${APP_URL}/company/meta`
      }
    ]
  };

  return {
    title: pageTitle,
    description: pageDescription,
    keywords: [
      'LeetCode company problems',
      'company-wise coding questions',
      'tech company interview problems',
      'FAANG coding questions',
      'Google interview problems',
      'Amazon coding questions',
      'Meta interview preparation',
      'Microsoft coding problems',
      'company specific leetcode',
      'coding interview preparation'
    ],
    alternates: {
      canonical: `${APP_URL}/companies`
    },
    openGraph: {
      title: pageTitle,
      description: pageDescription,
      url: `${APP_URL}/companies`,
      type: 'website',
      siteName: 'Company Interview Problem Explorer',
    },
    twitter: {
      card: 'summary_large_image',
      title: pageTitle,
      description: pageDescription,
    },
    other: {
      'script:ld+json': [
        JSON.stringify(breadcrumbList),
        JSON.stringify(itemList)
      ]
    }
  };
}

// Add this if you want to specify dynamic segments that should be cached
export const fetchCache = 'force-cache';

// Cache the getCompanies function
const getCompaniesWithCache = cache(async (page: number, pageSize: number, searchTerm: string) => {
  return getCompanies({
    page,
    pageSize,
    searchTerm
  });
});

export default async function CompaniesPage({
  searchParams,
}: CompaniesPageProps) {
  const page = Number(searchParams?.page) || 1;
  const searchTerm = searchParams?.search || '';
  const companies = await getCompanies(page, searchTerm);

  return (
    <main className="container mx-auto px-4 py-8">
      <section className="space-y-6">
        <div className="flex flex-col space-y-4">
          <h1 className="text-4xl font-bold tracking-tight">
            LeetCode Problems by Company
          </h1>
          <p className="text-lg text-muted-foreground max-w-[800px]">
            Explore our comprehensive collection of coding interview questions organized by company. 
            Find problems commonly asked at top tech companies like Google, Amazon, Meta, and Microsoft. 
            Practice with real interview questions and improve your problem-solving skills.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4">
          <div className="bg-muted/50 p-4 rounded-lg">
            <h2 className="text-xl font-semibold mb-2">Why Practice Company-Specific Problems?</h2>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground">
              <li>Companies often reuse or ask variations of their favorite problems</li>
              <li>Learn company-specific patterns and coding style preferences</li>
              <li>Focus your preparation on problems that matter for your target companies</li>
              <li>Track your progress with company-wise problem statistics</li>
            </ul>
          </div>
        </div>

        <Separator className="my-6" />
        
        <div className="space-y-8">
          <CompanyList
            initialCompanies={companies.items}
            initialSearchTerm={searchTerm}
            initialTotalPages={companies.totalPages}
            itemsPerPage={ITEMS_PER_PAGE}
          />
        </div>
      </section>
    </main>
  );
}

