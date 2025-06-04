
import BulkProblemUploadForm from '@/components/problem/bulk-problem-upload-form';
import { Separator } from '@/components/ui/separator';
import { getCompanies } from '@/lib/data'; 

export const metadata = {
  title: 'Bulk Add LeetCode Problems',
  description: 'Upload an Excel (.xlsx) or CSV (.csv) file to add multiple LeetCode problems.',
};

export default async function BulkAddProblemsPage() {
  const companiesData = await getCompanies({ pageSize: 50 }); 
  const companyNames = companiesData.companies.map(c => c.name);

  return (
    <section className="space-y-8 max-w-3xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl">Bulk Add LeetCode Problems</h1>
        <p className="mt-2 text-lg text-muted-foreground">
          Upload an Excel (.xlsx) or CSV (.csv) file to add multiple problems at once.
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          Ensure your file's first sheet (for Excel) or data (for CSV) has the following headers: <strong>Title, Difficulty, Link, Tags, Company Name, Last Asked Period</strong>.
        </p>
         <p className="mt-1 text-sm text-muted-foreground">
          Accepted values for Difficulty: Easy, Medium, Hard. The 'Tags' column can be left empty.
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          Accepted values for Last Asked Period: last_30_days, within_3_months, within_6_months, older_than_6_months.
        </p>
      </div>
      <Separator />
      <BulkProblemUploadForm companyNames={companyNames} />
    </section>
  );
}
