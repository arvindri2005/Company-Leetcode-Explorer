
import BulkCompanyUploadForm from '@/components/company/bulk-company-upload-form';
import { Separator } from '@/components/ui/separator';
import { getCompanies } from '@/lib/data';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Admin: Bulk Add Companies',
  description: 'Upload an Excel (.xlsx) or CSV (.csv) file to add multiple companies.',
  robots: { // Prevent indexing of this admin page
    index: false,
    follow: false,
  }
};

export default async function AdminBulkAddCompaniesPage() {
  // Fetch a reasonable number of existing company names for hint display
  const existingCompaniesData = await getCompanies({ pageSize: 50 });
  const existingCompanyNames = existingCompaniesData.companies.map(c => c.name);

  return (
    <section className="space-y-8 max-w-3xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl">Bulk Add Companies (Admin)</h1>
        <p className="mt-2 text-lg text-muted-foreground">
          Upload an Excel (.xlsx) or CSV (.csv) file to add multiple companies at once.
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          Ensure your file's first sheet (for Excel) or data (for CSV) has the following headers: <strong>Name, Logo, Description, Website</strong>.
        </p>
         <p className="mt-1 text-sm text-muted-foreground">
          The 'Name' column is required. 'Logo' and 'Website' should be valid URLs if provided. 'Description' is optional.
        </p>
      </div>
      <Separator />
      <BulkCompanyUploadForm existingCompanyNames={existingCompanyNames} />
    </section>
  );
}
