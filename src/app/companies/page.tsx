import { DashboardHeader } from "@/components/company/dashboard-header";
import { TechCompanyCard } from "@/components/company/tech-company-card";
import { CompanyListTable } from "@/components/company/company-list-table";
import { getCompaniesWithTotalCount, getCompanyBySlug } from "@/lib/data";
import { Separator } from "@/components/ui/separator";
import type { Metadata } from "next";

type CompaniesPageProps = {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
};


export const preferredRegion = "auto";

const ITEMS_PER_PAGE = 30;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://bytetooffer.com";

export async function generateMetadata(
  props: CompaniesPageProps,
): Promise<Metadata> {
  const searchParams = await props.searchParams;
  const page = searchParams?.page ? parseInt(searchParams.page as string) : 1;
  const pageTitle = `Explore Companies ${page > 1 ? ` - Page ${page}` : ""}`;
  const pageDescription =
    "Discover and prepare with real questions from top tech companies like Google, Amazon, and Microsoft.";
  const canonicalUrl = `${APP_URL}/companies${page > 1 ? `?page=${page}` : ""}`;

  return {
    title: pageTitle,
    description: pageDescription,
    openGraph: {
      title: pageTitle,
      description: pageDescription,
      url: canonicalUrl,
      type: "website",
      images: [{ url: `${APP_URL}/icon.png`, alt: "ByteToOffer Logo" }],
    },
    alternates: {
      canonical: canonicalUrl,
    },
  };
}

export default async function CompaniesPage(props: CompaniesPageProps) {
  const searchParams = await props.searchParams;
  const currentPage = searchParams?.page
    ? parseInt(searchParams.page as string)
    : 1;
  const searchTerm = (searchParams?.search as string) || "";

  // Fetch all companies for the list
  const {
    companies: initialCompanies,
    hasMore,
    nextCursor,
  } = await getCompaniesWithTotalCount({
    page: currentPage,
    pageSize: ITEMS_PER_PAGE,
    searchTerm,
  });

  // Fetch trending companies (Google, Amazon, Microsoft)
  // Only fetch if no search term is present, to keep the UI clean during search
  let trendingCompanies = [];
  if (!searchTerm) {
    const trendingSlugs = ["google", "amazon", "microsoft"];
    const trendingPromises = trendingSlugs.map((slug) => getCompanyBySlug(slug));
    const trendingResults = await Promise.all(trendingPromises);
    trendingCompanies = trendingResults.filter((c) => c !== undefined) as any[];
    
    // Fallback if specific companies aren't found (e.g. in dev env)
    if (trendingCompanies.length === 0 && initialCompanies.length > 0) {
      trendingCompanies = initialCompanies.slice(0, 3);
    }
  }

  return (
    <main className="min-h-screen w-full bg-[#0A0A0A] text-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <DashboardHeader />

        {!searchTerm && trendingCompanies.length > 0 && (
          <section className="mb-16 space-y-6">
            <h2 className="text-2xl font-bold">Trending Companies</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {trendingCompanies.map((company) => (
                <TechCompanyCard key={company.id} company={company} />
              ))}
            </div>
          </section>
        )}

        <section className="space-y-6">
          <h2 className="text-2xl font-bold">All Companies</h2>
          <CompanyListTable
            initialCompanies={initialCompanies}
            initialHasMore={hasMore}
            initialNextCursor={nextCursor}
            itemsPerPage={ITEMS_PER_PAGE}
          />
        </section>
      </div>
    </main>
  );
}
