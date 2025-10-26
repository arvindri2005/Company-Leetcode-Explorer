/**
 * @fileoverview Defines the page for adding a new company to the platform.
 *
 * This file exports a Next.js page component that provides users with a form
 * to submit new company information. It includes metadata for SEO purposes
 * and renders the `CompanySubmissionForm` component, which contains the
 * actual form logic and UI.
 */
import CompanySubmissionForm from "@/components/company/company-submission-form";
import { Separator } from "@/components/ui/separator";

/**
 * Metadata for the "Add Company" page.
 *
 * This object provides SEO information, including the page title and description,
 * which are used by search engines and in browser tabs.
 *
 * @type {import('next').Metadata}
 */
export const metadata = {
  title: "Add New Company | Byte To Offer",
  description:
    "Help grow the Byte To Offer platform by adding a new company. Your contributions help us provide a comprehensive resource for tech interview preparation.",
};

/**
 * Renders the page for submitting a new company.
 *
 * This server component sets up the layout and introductory text for the page,
 * encouraging users to contribute by adding new companies. It then displays the
 * client-side `CompanySubmissionForm` to handle the user input and submission process.
 *
 * @returns {Promise<JSX.Element>} The rendered "Add Company" page.
 */
export default async function AddCompanyPage() {
  return (
    <section className="space-y-8 max-w-2xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
          Add a New Company
        </h1>
        <p className="mt-2 text-lg text-muted-foreground">
          Help expand our list of companies. Please provide accurate
          information.
        </p>
      </div>
      <Separator />
      <CompanySubmissionForm />
    </section>
  );
}
