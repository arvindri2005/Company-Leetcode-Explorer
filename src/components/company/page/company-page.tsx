/**
 * @fileoverview Defines the redesigned dynamic page for displaying a single company's details and problems.
 *
 * This file contains the server component for the `/company/[companySlug]` route.
 * It fetches the company's data based on the slug, generates dynamic metadata for SEO,
 * retrieves the initial list of associated problems, and renders the main page layout.
 */
import {
  companyService
} from "@/services/company.service";
import {
  problemService
} from "@/services/problem.service";
import type { Company, ProblemListFilters } from "@/types";
import AdPlaceholder from "@/components/ads/ad-placeholder";
import CompanyHeader from "@/components/company/company-header";
import CompanyTabs from "@/components/company/page/company-tabs";
import ProblemLoadError from "@/components/company/page/problem-load-error";
import NoProblemsAvailable from "@/components/company/page/no-problems-available";
import RelatedCompanies from "@/components/company/related-companies";
import CompanyPreparationGuide from "@/components/company/company-preparation-guide";

const INITIAL_ITEMS_PER_PAGE = 40;

/**
 * Defines the props structure for the CompanyPage, including the dynamic route parameters.
 */
interface CompanyPageProps {
  company: Company;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

/**
 * Renders the redesigned page for a specific company.
 * ...
 */
export default async function CompanyPage({ company, searchParams }: CompanyPageProps) {
  const resolvedSearchParams = await searchParams;

  // Helper to parse array filters
  const parseArrayValid = <T extends string>(
    val: string | string[] | undefined,
    validValues: T[]
  ): T[] => {
    if (!val) return [];
    if (Array.isArray(val)) {
      return val.filter((v): v is T => validValues.includes(v as T));
    }
    return validValues.includes(val as T) ? [val as T] : [];
  };

  const difficultyFilter = parseArrayValid(
     resolvedSearchParams?.difficultyFilter,
     ["Easy", "Medium", "Hard"]
   ) as any[]; // Type cast as necessary or import types
 
  const lastAskedFilter = parseArrayValid(resolvedSearchParams?.lastAskedFilter, [
     "last_30_days",
     "within_3_months",
     "within_6_months",
     "older_than_6_months",
   ]) as any[];
 
  const statusFilter = parseArrayValid(resolvedSearchParams?.statusFilter, [
     "solved",
     "attempted",
     "todo",
   ]) as any[];
 
  const searchTerm =
     typeof resolvedSearchParams?.searchTerm === "string"
       ? resolvedSearchParams.searchTerm
       : "";
 
  const sortKey = (
     typeof resolvedSearchParams?.sortKey === "string"
       ? resolvedSearchParams.sortKey
       : "title"
   ) as any;
 
  const page = 
     typeof resolvedSearchParams?.page === "string" 
       ? parseInt(resolvedSearchParams.page, 10) 
       : 1;

  const initialFilters: ProblemListFilters = {
    difficultyFilter,
    lastAskedFilter,
    statusFilter,
    searchTerm,
    sortKey,
  };

  const initialPaginatedProblemsData = await problemService.getProblemsByCompany(
    company.id,
    {
      page: isNaN(page) ? 1 : page,
      pageSize: INITIAL_ITEMS_PER_PAGE,
      companySlug: company.slug,
      totalProblemCount: company.problemCount,
      difficultyCounts: company.difficultyCounts,
      recencyCounts: company.recencyCounts,
      ...initialFilters,
    },
  );

  if ("error" in initialPaginatedProblemsData) {
    console.error(
      "Error fetching initial problems for company page:",
      initialPaginatedProblemsData.error,
    );
    return (
      <div className="container mx-auto px-4 py-4">
        <CompanyHeader company={company} />
        <ProblemLoadError
          companyName={company.name}
          error={initialPaginatedProblemsData.error as string}
        />
      </div>
    );
  }

  const {
    problems: initialProblems,
    hasMore: initialHasMore,
    nextCursor: initialNextCursor,
    totalProblems: displayProblemCount,
    totalPages,
    currentPage,
  } = initialPaginatedProblemsData;

  const hasProblems = displayProblemCount > 0;

  return (
      <div className="min-h-screen bg-background">
          <div className="container mx-auto px-4 py-4 max-w-7xl transition-all duration-300 ease-in-out">
              {/* Company Header Section */}
              <CompanyHeader company={company} />

              {/* Mobile Ad (Top) */}
              <div className="lg:hidden mt-6">
                  <AdPlaceholder
                      className="h-24"
                      title="Sponsored"
                  />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 mt-4 pb-20 lg:pb-0 transition-all duration-300 ease-in-out">
                  {/* Main Content: Tabs & Problem List */}
                  <main className="lg:col-span-3 transition-all duration-300 ease-in-out">
                      {hasProblems ? (
                          <CompanyTabs
                              company={company}
                              displayProblemCount={displayProblemCount}
                              initialProblems={initialProblems}
                              initialHasMore={initialHasMore ?? false}
                              initialNextCursor={initialNextCursor}
                              initialFilters={initialFilters}
                              itemsPerPage={INITIAL_ITEMS_PER_PAGE}
                              totalPages={totalPages ?? 1}
                              currentPage={currentPage ?? 1}
                          />
                      ) : (
                          <NoProblemsAvailable
                              companyName={company.name}
                              companyId={company.id}
                          />
                      )}
                      
                      <CompanyPreparationGuide company={company} />

                      {/* Related Companies (Desktop & Mobile) */}
                      <div className="mt-12">
                          <h2 className="text-2xl font-bold mb-6 text-white">Related Companies</h2>
                          <RelatedCompanies companies={company.relatedCompanies || []} />
                      </div>
                  </main>

                  {/* Right Sidebar: Ads Only */}
                  <aside className="lg:col-span-1 hidden lg:block transition-all duration-300 ease-in-out">
                      <div className="sticky top-24 h-[calc(100vh-8rem)] flex flex-col gap-4">
                          <div className="flex-1 min-h-0">
                              <AdPlaceholder title="Sponsored" className="h-full my-0" />
                          </div>
                          <div className="flex-1 min-h-0">
                              <AdPlaceholder title="Advertisement" className="h-full my-0" />
                          </div>
                      </div>
                  </aside>
              </div>
          </div>
      </div>
  );
}
