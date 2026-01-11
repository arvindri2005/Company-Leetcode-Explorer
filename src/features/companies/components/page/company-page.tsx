/**
 * @fileoverview Defines the redesigned dynamic page for displaying a single company's details and problems.
 *
 * This file contains the server component for the `/company/[companySlug]` route.
 * It fetches the company's data based on the slug, generates dynamic metadata for SEO,
 * retrieves the initial list of associated problems, and renders the main page layout.
 */
import AdPlaceholder from "@/components/ads/ad-placeholder";
import type {
  Company,
  DifficultyFilter,
  LastAskedFilter,
  PaginatedProblemsResponse,
  ProblemListFilters,
  SortKey,
  StatusFilter,
} from "@/types";

import CompanyHeader from "../company-header";
import CompanyPreparationGuide from "../company-preparation-guide";
import RelatedCompanies from "../related-companies";

import CompanyTabs from "./company-tabs";
import NoProblemsAvailable from "./no-problems-available";
import ProblemLoadError from "./problem-load-error";


const INITIAL_ITEMS_PER_PAGE = 40;

/**
 * Defines the props structure for the CompanyPage, including the dynamic route parameters.
 */
interface CompanyPageProps {
  company: Company;
  initialPaginatedProblems: PaginatedProblemsResponse | { error: string };
}

/**
 * Renders the redesigned page for a specific company.
 * ...
 */
export default async function CompanyPage({ company, initialPaginatedProblems }: CompanyPageProps) {
// Helper to parse array filters
  const difficultyFilter: DifficultyFilter[] = [];
  const lastAskedFilter: LastAskedFilter[] = [];
  const statusFilter: StatusFilter[] = [];
  const searchTerm = "";
  const sortKey: SortKey = "title";

  const initialFilters: ProblemListFilters = {
    difficultyFilter,
    lastAskedFilter,
    statusFilter,
    searchTerm,
    sortKey,
    // Note: User status merging should be handled by caller or hydration if needed
  };

  const initialPaginatedProblemsData = initialPaginatedProblems;

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
    <div className="min-h-screen bg-background pb-12">
      <div className="container mx-auto px-4 py-4 max-w-7xl transition-all duration-300 ease-in-out">
        {/* Company Header Section */}
        <CompanyHeader company={company} />

        {/* Mobile Ad (Top) */}
        <div className="lg:hidden mt-6 mb-6">
          <AdPlaceholder className="h-24" title="Sponsored" />
        </div>

        {/* Main Content Grid: Problem List + Ads */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 mt-4 transition-all duration-300 ease-in-out mb-12">
          {/* Main Column: Tabs/Problem List */}
          <main className="lg:col-span-3 transition-all duration-300 ease-in-out min-h-[500px]">
            {hasProblems ? (
              <CompanyTabs
                company={company}
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
          </main>

          {/* Right Sidebar: Ads Only */}
          <aside className="lg:col-span-1 hidden lg:block transition-all duration-300 ease-in-out">
            <div className="sticky top-24 flex flex-col gap-4">
              <div className="h-[300px] w-full">
                <AdPlaceholder title="Sponsored" className="h-full my-0" />
              </div>
              <div className="h-[300px] w-full">
                <AdPlaceholder title="Advertisement" className="h-full my-0" />
              </div>
            </div>
          </aside>
        </div>

        {/* Bottom Sections: Full Width */}
        <div className="space-y-12">
          {/* Related Companies */}
          <section>
            <RelatedCompanies companies={company.relatedCompanies || []} />
          </section>

          {/* How to Prepare */}
          <section>
            <CompanyPreparationGuide company={company} />
          </section>

        </div>
      </div>
    </div>
  );
}






