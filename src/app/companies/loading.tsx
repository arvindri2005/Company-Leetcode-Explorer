/**
 * @fileoverview Defines the loading skeleton UI for the main companies listing page.
 *
 * This component provides a placeholder UI that is displayed while the data for
 * the `/companies` page is being fetched. It mimics the layout of the actual page,
 * including skeletons for the title, description, and a grid of company cards,
 * providing a better user experience than a blank screen or a simple spinner.
 */
import CompanyCardSkeleton from "@/components/skeletons/CompanyCardSkeleton";
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
    <div className="min-h-screen w-full animated-gradient-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12">
        <section className="space-y-6 sm:space-y-8 lg:space-y-10">
          <div className="text-center sm:text-left space-y-3 sm:space-y-4">
            <Skeleton className="h-12 w-3/4 md:w-1/2 mx-auto sm:mx-0" />
            <Skeleton className="h-6 w-1/2 md:w-1/3 mx-auto sm:mx-0" />
          </div>

          <Skeleton className="h-px w-full my-6 sm:my-8" />

          <div className="w-full">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
              {[...Array(12)].map((_, i) => (
                <CompanyCardSkeleton key={i} />
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
