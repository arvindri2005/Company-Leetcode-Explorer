/**
 * @fileoverview Defines the redesigned dynamic page for displaying a single company's details and problems.
 *
 * This file contains the server component for the `/company/[companySlug]` route.
 * It fetches the company's data based on the slug, generates dynamic metadata for SEO,
 * retrieves the initial list of associated problems, and renders the main page layout.
 */
import {
  getCompanyBySlug,
  getProblemsByCompanyFromDb,
} from "@/lib/data";
import type { Company, ProblemListFilters } from "@/types";
import AdPlaceholder from "@/components/ads/ad-placeholder";
import CompanyHeaderV3 from "@/components/company/company-header-v3";
import CompanyTabsV3 from "@/components/company/page/company-tabs-v3";
import CompanyNotFound from "@/components/company/page/company-not-found";
import ProblemLoadError from "@/components/company/page/problem-load-error";
import NoProblemsAvailable from "@/components/company/page/no-problems-available";
import CompanyPageHeader from "./company-page-header";

const INITIAL_ITEMS_PER_PAGE = 15;

/**
 * Defines the props structure for the CompanyPageV2, including the dynamic route parameters.
 */
interface CompanyPageV2Props {
  company: Company;
}

/**
 * Renders the redesigned page for a specific company.
 *
 * This server component fetches the company's details based on the slug from the URL.
 * If the company is not found, it renders a `CompanyNotFound` component. Otherwise, it
 * fetches the first page of problems for that company. It then passes this initial data
 * to the `CompanyTabsV3` client component, which handles the interactive display of
 * problems, AI tools, and other company-specific information. It also handles
 * error states for problem fetching.
 *
 * @param {CompanyPageV2Props} props - The props containing the dynamic route parameters.
 * @returns {Promise<JSX.Element>} The rendered company page or a not-found component.
 */
export default async function CompanyPageV2({ company }: CompanyPageV2Props) {
  const initialFilters: ProblemListFilters = {
    difficultyFilter: "all",
    lastAskedFilter: "all",
    statusFilter: "all",
    searchTerm: "",
    sortKey: "title",
  };

  const initialPaginatedProblemsData = await getProblemsByCompanyFromDb(
    company.id,
    {
      pageSize: INITIAL_ITEMS_PER_PAGE,
    },
  );

  if ("error" in initialPaginatedProblemsData) {
    console.error(
      "Error fetching initial problems for company page:",
      initialPaginatedProblemsData.error,
    );
    return (
      <div className="container mx-auto px-4 py-4 max-w-7xl">
        <CompanyPageHeader companyName={company.name} />
        <CompanyHeaderV3 company={company} />
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
  } = initialPaginatedProblemsData;

  const hasProblems = displayProblemCount > 0;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-4 max-w-7xl">
        <CompanyPageHeader companyName={company.name} />
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 mt-4">
          <main className="lg:col-span-3">
            <CompanyHeaderV3 company={company} />
            {hasProblems ? (
              <CompanyTabsV3
                company={company}
                displayProblemCount={displayProblemCount}
                initialProblems={initialProblems}
                initialHasMore={initialHasMore ?? false}
                initialNextCursor={initialNextCursor}
                initialFilters={initialFilters}
                itemsPerPage={INITIAL_ITEMS_PER_PAGE}
              />
            ) : (
              <NoProblemsAvailable
                companyName={company.name}
                companyId={company.id}
              />
            )}
          </main>
          <aside className="lg:col-span-1 space-y-8">
            <AdPlaceholder />
            <AdPlaceholder />
          </aside>
        </div>
      </div>
    </div>
  );
}
