import CompanyList from '@/components/company/company-list';
import { getCompanies } from '@/lib/data';
import { Separator } from '@/components/ui/separator';
import type { Metadata } from 'next';
import { cache } from 'react';
import SearchBar from '@/components/ui/search-bar'

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
  // Await searchParams if it's a Promise (for Next.js dynamic route API)
  const resolvedSearchParams = typeof (searchParams as any)?.then === "function"
    ? await (searchParams as any)
    : searchParams || {};
  const searchTerm = resolvedSearchParams?.search || '';
  const pageTitle ='Explore Companies';
  const pageDescription = searchTerm
    ? `Find companies matching "${searchTerm}" and their associated coding interview problems.`
    : 'Browse, search, and filter companies to find coding problems frequently asked in their technical interviews. Prepare effectively for your next coding interview.';

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
      }
    ]
  };
  if (searchTerm) {
    breadcrumbList.itemListElement.push({
        "@type": "ListItem",
        "position": 3,
        "name": `Search: "${searchTerm}"`,
        "item": `${APP_URL}/companies?search=${encodeURIComponent(searchTerm)}`
      });
  }

  return {
    title: pageTitle,
    description: pageDescription,
    openGraph: {
      title: pageTitle,
      description: pageDescription,
      url: `${APP_URL}/companies${searchTerm ? `?search=${encodeURIComponent(searchTerm)}` : ''}`,
      type: 'website', // Use 'website' for main listing and search results
      images: [{ url: `${APP_URL}/icon.png`, alt: 'Company Interview Problem Explorer Logo' }],
    },
    alternates: {
      canonical: `${APP_URL}/companies${searchTerm ? `?search=${encodeURIComponent(searchTerm)}` : ''}`,
    },
    other: {
      "script[type=\"application/ld+json\"]": JSON.stringify(breadcrumbList),
    }
  };
}

// Add this if you want to specify dynamic segments that should be cached
export const fetchCache = 'force-cache';

// Cache the getCompanies function
const getCompaniesWithCache = cache(async (pageSize: number, searchTerm: string) => {
  return getCompanies({
    pageSize,
    searchTerm
  });
});

export default async function CompaniesPage({ searchParams }: CompaniesPageProps) {
  const searchTerm = searchParams?.search || '';

  const {
    companies: initialCompanies,
    hasMore,
    nextCursor,
    totalCompanies
  } = await getCompaniesWithCache(ITEMS_PER_PAGE, searchTerm);

  // Create a more accurate subtitle based on cursor pagination
  const pageSubtitle = searchTerm
    ? `${initialCompanies.length > 0 ? `Showing ${initialCompanies.length}` : 'No'} compan${initialCompanies.length === 1 ? 'y' : 'ies'} matching "${searchTerm}".${hasMore ? ' Scroll down to load more.' : ''}`
    : `${initialCompanies.length > 0 ? `Showing ${initialCompanies.length} companies` : 'No companies available'}.${hasMore ? ' Scroll down to load more.' : ''}`;

  return (
    <div className="min-h-screen w-full">
      {/* Main container with responsive padding */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12">
        <section className="space-y-6 sm:space-y-8 lg:space-y-10">
          
          {/* Header section - Responsive typography and spacing */}
          <div className="text-center sm:text-left space-y-3 sm:space-y-4">
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight leading-tight">
              <span className="block sm:inline">Explore Companies</span>
              <span className="block sm:inline text-primary"> & Their Interview Problems</span>
            </h1>
            
            
          </div>

          {/* Responsive separator */}
          <Separator className="my-6 sm:my-8" />

          {/* Company List */}
          <div className="w-full">
            <CompanyList
              key={searchTerm} // Add key prop here to force re-render on search change
              initialCompanies={initialCompanies}
              initialSearchTerm={searchTerm}
              initialHasMore={hasMore}
              initialNextCursor={nextCursor}
              itemsPerPage={ITEMS_PER_PAGE}
            />
          </div>

          {/* Footer spacing for mobile scroll comfort */}
          <div className="h-4 sm:h-6 lg:h-8" />
          
        </section>
      </div>
    </div>
  );
}