/**
 * @fileoverview Defines the page for users to submit a new coding interview problem.
 *
 * This file exports a Next.js page component that provides a form for users
 * to contribute new coding problems to the platform. It fetches a list of all
 * companies to populate a dropdown in the form and includes metadata for SEO.
 */
import { ProblemSubmissionForm } from "@/features/problems";
import { companyService } from "@/features/companies/services/company.service";
import type { Company } from "@/types";
import { Separator } from "@/components/ui/separator";

/**
 * Metadata for the "Submit Problem" page.
 *
 * This object provides SEO information, including the page title and description.
 *
 * @type {import('next').Metadata}
 */
export const metadata = {
  title: "Submit New Interview Problem",
  description:
    "Contribute to Byte To Offer by submitting a new interview problem. Share your knowledge with the community and help others prepare for their tech interviews.",
};

/**
 * Renders the page for submitting a new interview problem.
 *
 * This server component fetches a list of companies to be passed as a prop
 * to the `ProblemSubmissionForm`. This allows the user to associate the new
 * problem with an existing company. It then renders the form, which handles
 * the actual user input and submission logic.
 *
 * @returns {Promise<JSX.Element>} The rendered "Submit Problem" page.
 */
export default async function SubmitProblemPage() {
  // Fetch a manageable number of companies for the dropdown.
  const companiesResult = await companyService.getCompanies({ pageSize: 200 });
  
  if (!companiesResult.isSuccess) {
    throw new Error(companiesResult.error.message);
  }

  const companiesData = companiesResult.value;
  const allCompanies = companiesData.companies;

  return (
    <section className="space-y-8 max-w-2xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl text-balance">
          Submit a New Interview Problem
        </h1>
        <p className="mt-2 text-lg text-muted-foreground">
          Contribute to the collection by adding a new problem. Please ensure
          the information is accurate.
        </p>
        {companiesData.totalCompanies && companiesData.totalCompanies > 200 && (
          <p className="mt-1 text-sm text-amber-700 dark:text-amber-500">
            Note: Displaying the first 200 companies. Future enhancements could
            include a searchable dropdown.
          </p>
        )}
      </div>
      <Separator />
      <ProblemSubmissionForm companies={allCompanies} />
    </section>
  );
}






