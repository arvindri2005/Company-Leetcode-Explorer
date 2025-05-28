
import CompanySubmissionForm from '@/components/company/company-submission-form';
import { Separator } from '@/components/ui/separator';

export const metadata = {
  title: 'Add New Company',
  description: 'Add a new company to the platform.',
};

export default async function AddCompanyPage() {
  return (
    <section className="space-y-8 max-w-2xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl">Add a New Company</h1>
        <p className="mt-2 text-lg text-muted-foreground">
          Help expand our list of companies. Please provide accurate information.
        </p>
      </div>
      <Separator />
      <CompanySubmissionForm />
    </section>
  );
}
