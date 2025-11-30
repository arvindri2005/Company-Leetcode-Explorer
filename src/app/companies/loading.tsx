/**
 * @fileoverview Defines the loading skeleton UI for the main companies listing page.
 *
 * This component provides a placeholder UI that is displayed while the data for
 * the `/companies` page is being fetched. It mimics the layout of the actual page,
 * including skeletons for the title, description, and a grid of company cards,
 * providing a better user experience than a blank screen or a simple spinner.
 */
import {
  DashboardHeaderSkeleton,
  TechCompanyCardSkeleton,
  CompanyTableSkeleton,
} from "@/components/skeletons/companies-skeletons";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Renders the loading state for the companies page.
 *
 * This component displays a set of skeleton placeholders that visually represent
 * the structure of the companies page. This includes a skeleton for the page header
 * and a grid of `CompanyCardSkeleton` components to simulate the company list.
 *
 * @returns {JSX.Element} The rendered loading skeleton for the companies page.
 */
export default function CompaniesLoading() {
  return (
    <main className="min-h-screen w-full bg-[#0A0A0A] text-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <DashboardHeaderSkeleton />

        <section className="mb-16 space-y-6">
          <Skeleton className="h-8 w-48" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <TechCompanyCardSkeleton key={i} />
            ))}
          </div>
        </section>

        <section className="space-y-6">
          <Skeleton className="h-8 w-40" />
          <CompanyTableSkeleton />
        </section>
      </div>
    </main>
  );
}
