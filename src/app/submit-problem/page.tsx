
import ProblemSubmissionForm from '@/components/problem/problem-submission-form';
import { getCompanies } from '@/lib/data';
import type { Company } from '@/types';
import { Separator } from '@/components/ui/separator';

export const metadata = {
  title: 'Submit New Problem',
  description: 'Add a new LeetCode problem to the database.',
};

export default async function SubmitProblemPage() {
  // Fetch a manageable number of companies, sorted by name, for the dropdown.
  // If the list is extremely long, consider a searchable select or other UI pattern in the future.
  const companiesData = await getCompanies({ pageSize: 200 /*, sortBy: 'name' if getCompanies supports it */ });
  const allCompanies = companiesData.companies;

  return (
    <section className="space-y-8 max-w-2xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl">Submit a New LeetCode Problem</h1>
        <p className="mt-2 text-lg text-muted-foreground">
          Contribute to the collection by adding a new problem. Please ensure the information is accurate.
        </p>
        {companiesData.totalCompanies > 200 && (
          <p className="mt-1 text-sm text-amber-700 dark:text-amber-500">
            Note: Displaying the first 200 companies. For a very large list of companies, future enhancements could include a searchable dropdown.
          </p>
        )}
      </div>
      <Separator />
      <ProblemSubmissionForm companies={allCompanies} />
    </section>
  );
}

