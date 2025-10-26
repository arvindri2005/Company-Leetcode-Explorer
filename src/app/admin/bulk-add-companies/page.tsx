/**
 * @fileoverview Defines the admin page for bulk-adding companies from a file.
 *
 * This file exports a Next.js page component that provides an interface for
 * administrators to upload an Excel or CSV file to add or update multiple
 * companies in the database. It includes instructions and renders the
 * `BulkCompanyUploadForm` which handles the file processing and submission logic.
 */
import BulkCompanyUploadForm from "@/components/company/bulk-company-upload-form";
import { Separator } from "@/components/ui/separator";
import { getCompanies } from "@/lib/data";
import type { Metadata } from "next";

/**
 * Metadata for the "Bulk Add Companies" admin page.
 *
 * This object provides SEO information and explicitly tells search engine robots
 * not to index this administrative page.
 *
 * @type {Metadata}
 */
export const metadata: Metadata = {
  title: "Admin: Bulk Add Companies",
  description:
    "Upload an Excel (.xlsx) or CSV (.csv) file to add multiple companies.",
  robots: {
    index: false,
    follow: false,
  },
};

/**
 * Renders the admin page for bulk-uploading company data.
 *
 * This server component sets up the page layout, provides clear instructions on the
 * required file format and headers, and fetches a list of existing company names
 * to pass down to the form for validation or informational purposes. It then renders
 * the `BulkCompanyUploadForm` component.
 *
 * @returns {Promise<JSX.Element>} The rendered bulk-add companies page.
 */
export default async function AdminBulkAddCompaniesPage() {
  // Fetch a reasonable number of existing company names for hint display
  const existingCompaniesData = await getCompanies({ pageSize: 50 });
  const existingCompanyNames = existingCompaniesData.companies.map(
    (c) => c.name,
  );

  return (
    <section className="space-y-8 max-w-3xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
          Bulk Add Companies (Admin)
        </h1>
        <p className="mt-2 text-lg text-muted-foreground">
          Upload an Excel (.xlsx) or CSV (.csv) file to add multiple companies
          at once.
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          Ensure your file's first sheet (for Excel) or data (for CSV) has the
          following headers: <strong>Name, Logo, Description, Website</strong>.
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          The 'Name' column is required. 'Logo' and 'Website' should be valid
          URLs if provided. 'Description' is optional.
        </p>
      </div>
      <Separator />
      <BulkCompanyUploadForm existingCompanyNames={existingCompanyNames} />
    </section>
  );
}
