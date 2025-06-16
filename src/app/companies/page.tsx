import CompanyList from '@/components/company/company-list';
import { getCompanies } from '@/lib/data';
import { Separator } from '@/components/ui/separator';
import type { Metadata } from 'next';
import { cache } from 'react';

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
    ? `Search Results for "${searchTerm}" | Company Interview Problem Explorer` 
    : 'Explore Companies & Interview Problems | Company Interview Problem Explorer';
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

// Add this near the top of the file, before the page component
export const revalidate = 3600; // revalidate every hour

// Add this if you want to specify dynamic segments that should be cached
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-cache';

// Cache the getCompanies function
const getCompaniesWithCache = cache(async ({ page, pageSize, searchTerm }: { 
  page: number; 
  pageSize: number; 
  searchTerm: string; 
}) => {
  return getCompanies({
    page,
    pageSize,
    searchTerm
  });
});

export default async function CompaniesPage({ searchParams }: CompaniesPageProps) {
  const initialPage = 1;
  const searchTerm = searchParams?.search || '';

  const {
    companies: initialCompanies,
    totalPages,
    currentPage,
    totalCompanies
  } = await getCompaniesWithCache({
    page: initialPage,
    pageSize: ITEMS_PER_PAGE,
    searchTerm
  });

  const pageSubtitle = searchTerm
    ? `Found ${totalCompanies} compan${totalCompanies === 1 ? 'y' : 'ies'} matching "${searchTerm}".`
    : `Displaying ${initialCompanies.length > 0 ? 'companies' : 'no companies'}${totalCompanies > 0 ? ` out of ${totalCompanies} total.` : '.'} Scroll down to load more.`;

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
            
            <div className="max-w-4xl mx-auto sm:mx-0">
              <p className="text-sm sm:text-base md:text-lg lg:text-xl text-muted-foreground leading-relaxed">
                {pageSubtitle}
              </p>
              
              {/* Additional context for mobile users */}
              <p className="mt-2 text-xs sm:text-sm text-muted-foreground/80 block sm:hidden">
                Tap on any company to view their interview problems
              </p>
            </div>
          </div>

          {/* Responsive separator */}
          <Separator className="my-6 sm:my-8" />

          {/* Company List */}
          <div className="w-full">
            <CompanyList
              key={searchTerm} // Add key prop here
              initialCompanies={initialCompanies}
              initialSearchTerm={searchTerm}
              initialTotalPages={totalPages}
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

