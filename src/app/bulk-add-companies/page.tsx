
import BulkCompanyUploadForm from '@/components/company/bulk-company-upload-form';
import { Separator } from '@/components/ui/separator';
import { getCompanies } from '@/lib/data';

export const metadata = {
  title: 'Bulk Add Companies',
  description: 'Upload an Excel file to add multiple companies.',
};

export default async function BulkAddCompaniesPage() {
  // Fetch a reasonable number of existing company names for hint display
  const existingCompaniesData = await getCompanies({ pageSize: 50 });
  const existingCompanyNames = existingCompaniesData.companies.map(c => c.name);

  return (
    <section className="space-y-8 max-w-3xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl">Bulk Add Companies</h1>
        <p className="mt-2 text-lg text-muted-foreground">
          Upload an Excel (.xlsx) file to add multiple companies at once.
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          Ensure your Excel file's first sheet has the following headers: <strong>Name, Logo, Description, Website</strong>.
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

